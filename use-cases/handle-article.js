
import { articleDb, userDb } from '../db-handler/index.js'
import errorMessage from '../helper/error.js'
import { deleteFile } from '../helper/file-handler.js'
import { Article, ArticleComment, Community } from '../models/index.js'
import out from "../helper/out.js"
import { valid } from "../helper/utils.js"
import { generateId } from '../helper/id-generator.js'
import { scheduleJob } from '../helper/scheduler.js'
import { payment_use_case } from './handle-payment.js'
const result ={
    status: false,
    body: ''
}
const matchingType = 'matching',
communityType = 'community';
export const article_use_case = {
    addArticle,
    getAllArticles,
    getPopularArticles,
    getMyArticles,
    getOneArticle,
    updateArticle,
    deleteArticle,
    deleteAllArticlesByUser,
    addComment,
    editComment,
    deleteComment,
    getCommentList,
    getComment,
    addLikeToArticle,
    calculatePopularArticles,
    deleteAllLikeByUser,
    deleteAllCommentsByUser,
}
// 매일 0시 정각에 실행
scheduleJob('0 0 0 * * *', calculatePopularArticles)

/**
 * add article to db
 * @returns {Promise<{status: boolean, body: {id: String}}>} {id: savedId}
 * @error log & return
 */
async function addArticle({user: {_id: userId}, matchingInfo, ...rest}){
    try {
        // NOTE 공통 부분 valid check
        const bodyModel = {
            title: {type: 'str'},
            content: {type: 'str'},
            files: {type: 'arr', optional: true},
            userId: {type: 'str'}
        }
        valid({...rest, userId}, bodyModel)
        // NOTE matching 일 경우 한번 더 valid check
        if(matchingInfo) {
            const {matching, userId} = matchingInfo;
            if(!Array.isArray(matching) || matching.length < 1){
                result.status = false;
                result.body = errorMessage.syntaxError.matchingNotArr;
                return result;
            } else if(typeof userId !== 'string'){
                result.status = false;
                result.body = errorMessage.syntaxError.matchingInfoWhoNotStr;
                return result;
            } 
            const hasUser = await userDb.findUserById(userId)
            if(typeof hasUser === 'undefined'){
                result.status = false;
                result.body = errorMessage.dbError.userNotFound;
                return result;
            }
        }
        
        const isUserExist = await userDb.findUserById(userId);
        if(!isUserExist){
            result.status = false;
            result.body = errorMessage.dbError.userNotFound;
            return result;
        }
        const articleType = matchingInfo
        ? 'matching'
        : 'community'
        const article = matchingInfo
        ? Article({matchingInfo, userId, ...rest})
        : Community({userId, ...rest})
        // NOTE db 저장
        const savedId = await articleDb.insertArticle(article, articleType);
        result.status = true;
        result.body = {id: savedId}
        return result;
    } catch (err) {
        console.log(err);
        result.status = false;
        result.body = err.message;
        return result;
    }
}
/**
 * get alll articles and return array
 * @returns {Promise<{status: boolean, body: {articles: Array}}>} {articles}
 * @error log & throw
 */
async function getAllArticles({createdAt, articleType, body: {user: {_id: userId}}}){
    try {
        const reqModel = {
            articleType: {type: 'str', null: true}
        }
        valid({articleType}, reqModel)
        if(createdAt && isNaN(new Date(createdAt))){
            result.status = false;
            result.body = errorMessage.syntaxError.timestampNotDate;
            return  result;
        }
        const ct = createdAt? new Date(createdAt): new Date()
        const articles = await articleDb.getArticles(ct, articleType);
        // NOTE format article array
        const shortArticels = makeContentShort(articles),
        hasUserLikedArticles = await Promise.all(shortArticels.map(article => addHasUserLiked(article, userId, articleType)))

        result.status = true;
        result.body = {articles: hasUserLikedArticles};
        return result;
    } catch (err) {
        console.log(err);
        throw err;
    }
}
/**
 * 인기순 게시글 가져오기
 * @param {String} userId 
 * @param {String} articleType 
 * @param {Number} pagination 
 * @returns {Promise<{status: boolean, body: {articles: Array}}>}
 */
async function getPopularArticles(userId, articleType, pagination){
    try {
        const reqModel = {
            userId: {type: "str"},
            articleType: {type: "str", null: true},
            pagination: {type: "num", min:1}
        }
        valid({userId, articleType, pagination}, reqModel)
        const articles = await articleDb.getPopularArticles(pagination, articleType)
        // content 길이 & 해당 유저가 좋아했는지 확인
        const shortArticles = makeContentShort(articles),
        hasUserLikedArticles = await Promise.all(shortArticles.map(article => addHasUserLiked(article, userId, articleType)))
        result.status = true;
        result.body = {articles: hasUserLikedArticles}
        return result;
        // 본인이 좋아요 했는지 표시?
        // content 짧게
    } catch (err) {
        console.log(err)
        throw err;
    }
}
/**
 * get userId and page, return article for one user. with user info
 * @returns {Promise<{status: boolean, body: {articles: Array}}>}
 */
async function getMyArticles({userId, createdAt, articleType}){
    try {
        const reqModel = {
            articleType: {type: 'str', null: true
        },
            userId: {type: 'str'}
        }
        valid({articleType, userId}, reqModel)
        if(createdAt && isNaN(new Date(createdAt))){
            result.status = false;
            result.body = errorMessage.syntaxError.timestampNotDate;
            return result;
        }
        const hasUser = await userDb.findUserById(userId);
        if(!hasUser){
            result.status = false;
            result.body = errorMessage.dbError.userNotFound;
            return result;
        }
        createdAt = createdAt || new Date()
        const articles = await articleDb.getMyArticles(userId, new Date(createdAt), articleType)
        const shortArticles = makeContentShort(articles),
        hasUserLikedArticles = await Promise.all(shortArticles.map(article => addHasUserLiked(article, userId, articleType)))
        result.status = true;
        result.body = {articles: hasUserLikedArticles}
        return result;
    } catch (err) {
        console.log(err);
        throw err;
    }
}
/**
 * get article id and return whole document including comments
 * @returns {Promise<{status: boolean, body: {article: object}}>}
 */
async function getOneArticle({articleId, body: {user: {_id}}, articleType}){
    try {
        const reqModel = {
            articleType: {type: 'str', null: true},
            articleId: {type: 'str'}
        }
        valid({articleType, articleId}, reqModel)
        const article = await articleDb.getOneArticle(articleId, articleType);
        if(!article) {
            result.status = false;
            result.body = errorMessage.dbError.postIdNotFound;
            return result;
        }
        // NOTE 조회수 올리는 코드. 이렇게 하면 현재 나가는 article 말고 그 다음부터 1 더해진 조회수로 나간다.
        await articleDb.incViews(articleId, articleType)
        const formattedArticle = await formatOneArticle(article, articleType, _id)
        result.status = true;
        result.body = {article: formattedArticle}
        return result;
    } catch (err) {
        console.log(err);
        throw err;
    }
}
/**
 * get article and retun updated article
 * @param {String} articleId 
 * @param {object} article 
 * @param {String} articleType
 * @param {String} userId
 * @returns {Promise<{status: boolean, body: {updatedarticle: object}}>}
 * @error log & throw
 */
async function updateArticle(articleId, article, articleType, userId){
    try {
        const reqModel = {
            articleType: {type: 'str', null: true},
            articleId: {type: 'str'},
            article: {type: "obj"}
        }
        valid({articleType, articleId, article}, reqModel)
        const hasArticle = await articleDb.getOneArticle(articleId, articleType);
        if(!hasArticle){
            result.status = false;
            result.body = errorMessage.dbError.postIdNotFound;
            return result;
        }
        // 본인만 수정할 수 있음
        if(hasArticle.userId !== userId){
            result.status = false;
            result.body = errorMessage.authorization.notAuthorizedUser;
            return result
        }
        // article file 정리
        if(article.files && article.files.deleted && article.files.deleted.length > 0)
            article.files.deleted.forEach(f => deleteFile(f))
        const modifiedArticle = {
            ...article,
            modifiedAt: new Date(),
            files: article.files.allFiles || []
        }
        const updatedArticle = await articleDb.updateArticle(articleId, modifiedArticle, articleType);
        const formattedArticle = await formatOneArticle(updatedArticle, articleType, userId)
        result.status = true;
        result.body = {article: formattedArticle}
        return result;
    } catch (err) {
        console.log(err);
        throw err;
    }
}
/**
 * delete one article and return deleted count
 * @param {String} articleId 
 * @param {String} userId
 * @param {String} articleType
 * @returns {Promise<{status: boolean, body: }>}
 * @error log & throw
 */
async function deleteArticle(articleId, userId, articleType){
    try {
        const reqModel = {
            articleId: {type: 'str'},
            userId: {type: "str"},
            articleType: {type: 'str', null: true}
        }
        valid({articleId, userId, articleType}, reqModel)
        const hasArticle = await articleDb.getOneArticle(articleId, articleType);
        if(!hasArticle){
            result.status = false;
            result.body = errorMessage.dbError.postIdNotFound;
            return result;
        }
        if(hasArticle.userId !== userId){
            result.status = false;
            result.body =errorMessage.authorization.notAuthorizedUser
            return result;
        }
        // NOTE file system
        if(hasArticle.files) hasArticle.files.map(f => deleteFile(f))
        // 게시글 지우기
        await articleDb.deleteOneArticle(articleId, articleType);
        // 댓글 지우기
        await articleDb.deleteCommentsByArticle(articleId, articleType)
        // 좋아요 지우기
        await articleDb.deleteLikeByArticle(articleId, articleType)
        // 인기 게시글에서 지우기
        await articleDb.deletePopularArticle(articleId, articleType)
        result.status = true;
        result.body = {};
        return result;
    } catch (err) {
        console.log(err);
        throw err;
    }
}
/**
 * 게시글에 좋아요 추가하거나 삭제하기
 * @param {String} articleId
 * @param {String} userId
 * @param {String} articleType
 * @returns {Promise<{status: boolean, body: null}>}
 * @error log & throw;
 */
async function addLikeToArticle(articleId, userId, articleType){
    try {
        const reqModel = {
            articleId: {type: "str"},
            userId: {type: 'str'},
            articleType: {type: 'str', null: true}
        }
        valid({articleId, userId, articleType}, reqModel)
        
        const hasArticle = await articleDb.getOneArticle(articleId, articleType);
        if(!hasArticle){
            result.status = false;
            result.body = errorMessage.dbError.postIdNotFound;
            return result;
        }
        const hasUser = await userDb.findUserById(userId);
        if(!hasUser){
            result.status = false;
            result.body = errorMessage.dbError.userNotFound;
            return result;
        }
        // NOTE 좋아요 추가하거나 삭제하기
        const likeModel = {
            postId: articleId,
            userId
        }
        const hasLike = await articleDb.getLike(articleId, userId, articleType)
        if(hasLike) await articleDb.deleteLike(articleId, userId, articleType)
        else {
            const {value: {like}}  = await articleDb.addLike(likeModel, articleType);
            await payment_use_case.getFreeCoinByArticleLike(articleId, like, articleType);
        }


        result.status = true;
        result.body = null;
        return result;
    } catch (err) {
        console.log(err);
        throw err;
    }
}
async function addComment(body, articleType) {
    try { 
        const { user: {_id: userId} } = body
        // NOTE 1차로 거르기
        const reqModel = {articleType: {type: 'str', null: true}}
        valid({articleType}, reqModel)
        let addModel = {
            postId: {type: 'str'},
            parent: {type: 'num'},
            content: {type: 'str'}
        }
        let data = valid(body, addModel)

        let id = generateId()

        let query = {
            _id: id,
            userId: userId,
            ...data,
            createdAt: new Date(),
            modifiedAt: ''
        }
        const isUserExist = await userDb.findUserById(userId);
        if(!isUserExist){
            result.status = false;
            result.body = errorMessage.dbError.userNotFound;
            return result;
        }
        const hasArticle = await articleDb.getOneArticle(data.postId, articleType)
        if(!hasArticle){
            result.status = false;
            result.body = errorMessage.dbError.postIdNotFound
            return result;
        }
        const savedId = await articleDb.insertComment(query, articleType)
        result.status = true;
        result.body = {id: savedId}
        return result
    } catch(err) {
        result.status = false;
        result.body = err.message;
        return result;
    }
}
async function editComment(commentId, body, articleType) {
    try {
        // NOTE 1차 거르기
        const reqModel = {articleType: {type: "str", null: true}}
        valid({articleType}, reqModel)
        let editModel = {
            id: {type: 'str'},
            content: {type: 'str'}
        }
        body.id = commentId;
        let data = valid(body, editModel)

        delete data.id

        const {user: {_id: userId}} =body;
        const comment = await articleDb.getComment(commentId, articleType)
        if(!comment){
            result.status = false;
            result.body = errorMessage.dbError.commentIdNotFound
            return result;
        }
        if(comment.userId !== userId){
            result.status = false;
            result.body = errorMessage.authorization.notMyAccount
            return result;
        }

        let where = {_id: commentId}
        let update = {
            ...data,
            modifiedAt: new Date()
        }
        
        const dbResult = await articleDb.updateComment(where, update, articleType)
        if(dbResult.matchedCount > 0) {
            result.status = true
            result.body = out({modifiedCount : dbResult.modifiedCount})
            return result
        }
        result.status = false;
        result.body = {success: false, ...errorMessage.dbError.userNotFound}
        return result
    } catch(err) {
        throw err
    }
}
async function deleteComment(commentId, body, articleType) {
    try {
        // NOTE 1차 거르기
        const reqModel = {articleType: {type: "str", null: true}}
        valid({articleType}, reqModel)
        const {user: {_id: userId}} = body;
        const comment = await articleDb.getComment(commentId, articleType)
        if(!comment){
            result.status = false;
            result.body = errorMessage.dbError.commentIdNotFound
            return result;
        }
        if(comment.userId !== userId){
            result.status = false;
            result.body = errorMessage.authorization.notMyAccount
            return result;
        }
        const dbResult = await articleDb.deleteComment(commentId, articleType)
        if(dbResult.deletedCount > 0) {
            result.status = true
            result.body = out({deletedCount: dbResult.deletedCount})
            return result
        }
        result.status = false;
        result.body = {success: false, ...errorMessage.dbError.userNotFound}
        return result
    } catch(err) {
        throw err
    }
}
async function getCommentList(articleId, date, body, articleType) {
    try {
        // NOTE 1차 거르기
        const reqModel = {articleType: {type: "str", null: true}}
        valid({articleType}, reqModel)

        let where = {postId: articleId}
        let totalWhere = {postId: articleId}
        let limit = 10

        if(date){
            where = {createdAt: {$lt: new Date(date)}, ...where}
        }

        if(body.limit) {
            limit = parseInt(body.limit)
        }

        let dbResult = await articleDb.getCommentList(where, limit, articleType)
        const commentTotal = await articleDb.getCommentTotal(totalWhere, articleType)

        // NOTE 닉네임 & 프로필 넣기
        if(dbResult) dbResult = await Promise.all(dbResult.map(comment => addUserInfoToObj(comment)))
        if(dbResult) {
            result.status = true
            let data = {
                item: dbResult,
                total: commentTotal
            }
            result.body = out(data)
            return result
        }
        result.status = false;
        result.body = {success: false, ...errorMessage.dbError.userNotFound}
        return result
    } catch(err) {
        throw err
    }
}
async function getComment(id, articleType) {
    try {
        // NOTE 1차 거르기
        const reqModel = {articleType: {type: "str", null: true}}
        valid({articleType}, reqModel)

        let dbResult = await articleDb.getComment(id, articleType)
        // NOTE add nickname and profile
        if (dbResult) dbResult = await addUserInfoToObj(dbResult)
        if(dbResult) {
            result.status = true
            result.body = out(dbResult)
            return result
        }
        result.status = false;
        result.body = {success: false, ...errorMessage.dbError.commentIdNotFound}
        return result
    } catch(err) {
        throw err
    }
}
/**
 * 게시글 1개 정보 붙이기
 * 매칭일 경우 프로필 사진과 닉네임
 * 전부 다 hasUserLiked 붙여 나가기
 * @param {object} article 
 * @param {String} articleType 
 * @param {String} userId 
 * @returns {Promise<object>}
 */
async function formatOneArticle(article, articleType, userId){
    if(articleType === 'matching'){
        const { matchingInfo: { userId: matchingUserId } } = article
        //const { nickname, profilePic } = await userDb.getNicknameAndProfileImage(matchingUserId)
        const basicProfile = await userDb.getNicknameAndProfileImage(matchingUserId)
        if(basicProfile){
            article.matchingInfo.nickname = basicProfile.nickname;
            article.matchingInfo.profileImage = basicProfile.profilePic
        }
    }
    return addHasUserLiked(article, userId, articleType)
}
/**
 * get one object that has userId field and delete the field and add userInfo field
 * @param {object} obj any object that has userId
 * @returns {Promise<{userInfo: {userId, nickname, profileImage}}>}
 * @error log & throw
 */
async function addUserInfoToObj(obj){
    try {
        const {userId} = obj,
        {nickname, profilePic} = await userDb.getNicknameAndProfileImage(userId)
        delete obj.userId;
        obj.userInfo = {
            userId,
            nickname,
            profileImage: profilePic
        }
        return obj;
    } catch (err) {
        console.log(err);
        throw err;
    }
}
/**
 * 게시글 본문 짧게 만들기 (100)
 * @param {Array} articles 
 * @returns {Array}
 */
function makeContentShort(articles){
    return articles.map(({content, ...rest}) => {
        return {
            content: content.substring(-1, 100),
            ...rest
        }
    })
}
/**
 * 유저가 좋아했는지 field 추가
 * @param {object} article 
 * @param {String} userId 
 * @param {String} articleType 
 * @returns {Promise<object>}
 */
async function addHasUserLiked(article, userId, articleType){
    const {_id} = article;
    const hasUserLiked = await articleDb.getLike(_id, userId, articleType)
    return {
        ...article,
        hasUserLiked: hasUserLiked ? true : false
    }
}
/**
 * 매일 정각 00:00 (밤)에 일주일간의 게시물 모아서 snapshot 찍기
 */
async function calculatePopularArticles(){
    try {
        const res = await Promise.all([
            articleDb.save7daysPopularArticles('matching'),
            articleDb.save7daysPopularArticles('community')
        ])
        return res;
    } catch (err) {
        console.log(err)
        throw err;
    }
}

/**
 * 유저 탈퇴 - 게시글 전부 지우기
 * 1. 각 타입마다 모든 게시글 가져오기
 * 2. s3 파일 지우기
 * 3. 댓글 지우기 (각 타입마다)
 * 4. 좋아요 지우기 (각 타입마다)
 * 5. 게시글 전부 지우기
 * @param {String} userId
 */
 async function deleteAllArticlesByUser(userId){
    try {
        const matchingArticles = await articleDb.getAllArticleByUser(userId, matchingType),
        mArticleIds = matchingArticles.map(({_id}) => _id);


        const communityArticles = await articleDb.getAllArticleByUser(userId, communityType),
        cArticleIds = communityArticles.map(({_id}) => _id)

        await Promise.all([
        // 매칭 게시판
            matchingArticles.forEach(({files}) => files.forEach(f => deleteFile(f))),
            articleDb.deletCommentsByManyArticles(mArticleIds, matchingType),
            articleDb.deleteLikesByManyArticles(mArticleIds, matchingType),
        // 커뮤 게시판
            communityArticles.forEach(({files}) => files.forEach(f => deleteFile(f))),
            articleDb.deletCommentsByManyArticles(cArticleIds, communityType),
            articleDb.deleteLikesByManyArticles(cArticleIds, communityType),
        // 전부 지우기 (+ popular 게시판)
            articleDb.deleteArticleByUser(userId),
            articleDb.deleteManyPopularArticles(mArticleIds, matchingType),
            articleDb.deleteManyPopularArticles(cArticleIds, communityType)
        ])
    } catch (err) {
        console.log(err);
        throw err;
    }
}
/**
 * 유저 탈퇴 - 좋아요 전부 지우기
 * @param {String} userId 
 */
async function deleteAllLikeByUser(userId){
    try {
        const
        mIds = (await articleDb.getAllLikeByUser(userId, matchingType)).map(({postId}) => postId),

        cIds = (await articleDb.getAllLikeByUser(userId, communityType)).map(({postId}) => postId)

        await Promise.all([
            articleDb.decreaseManyArticleLike(mIds, matchingType),
            articleDb.deleteAllLikeByUser(userId, matchingType),

            articleDb.decreaseManyArticleLike(cIds, communityType),
            articleDb.deleteAllLikeByUser(userId, communityType)
        ])
    } catch (err) {
        console.log(err)
        throw err;
    }
}
/**
 * 유저 탈퇴 - 댓글 전부 지우기
 * @param {String} userId 
 */
async function deleteAllCommentsByUser(userId){
    try {
        const 
        mIds = (await articleDb.getAllCommentsByUser(userId, matchingType)).map(({postId}) => postId),

        cIds = (await articleDb.getAllCommentsByUser(userId, communityType)).map(({postId}) => postId)

        await Promise.all([
            articleDb.decManyArticleComments(mIds, matchingType),
            articleDb.deleteAllCommentsByUser(userId, matchingType),

            articleDb.decManyArticleComments(cIds, communityType),
            articleDb.deleteAllCommentsByUser(userId, communityType)
        ])
    } catch (err) {
        console.log(err)
        throw err;
    }
}