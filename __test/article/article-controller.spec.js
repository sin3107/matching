import { expect } from "chai";
import { deleteComment, deleteArticle, getArticles, postComment, postArticle, putComment, getMyArticles, postArticleLike, getArticle, putArticle } from "../../controllers/article-controller.js"
import { articleDb, makeDb } from "../../db-handler/index.js";
import errorMessage from '../../helper/error.js'
var userId, articleId, lastArticle;
describe('add article', ()=>{
    before(async()=> {
        const db = await makeDb(),
        {_id} = await db.collection('user').findOne()
        userId = _id;
    })
    it('should return 201 and inserted id', async()=>{
        const httpRequest = {body:{title: 'title', userId:userId, content: 'back', matchingInfo:JSON.stringify({meet: true, matchingNickname: 'true'})}},
        httpResponse = await postArticle(httpRequest);
        articleId = httpResponse.body.id
        expect(httpResponse).to.have.property('statusCode', '201')
        && expect(httpResponse).to.have.property('body').to.have.property('id').to.be.a('string')
    })
})
describe('get articles', ()=>{
    it("should get current 10 articles", async()=>{
        const httpRequest = {
            query: {},
            body: {user: {_id: {userId}}}
        },
        httpResponse = await getArticles(httpRequest);
        expect(httpResponse).to.have.property('statusCode', '200')
        && expect(httpResponse).to.have.property('body').to.have.property('articles').to.be.an('array')
        lastArticle = httpResponse.body.articles[httpResponse.body.articles.length -1]
    })
    it('should get next 10 articles', async()=>{
        const httpRequest = {query: {createdAt: lastArticle.createdAt}, body: {user: {_id: userId}}},
        httpResponse = await getArticles(httpRequest);
        expect(httpResponse).to.haveOwnProperty('statusCode', '200')
        && expect(httpResponse).to.haveOwnProperty('body').to.haveOwnProperty('articles').to.be.an('array')
        && expect(httpResponse.body.articles[0]).to.haveOwnProperty('createdAt').to.be.lessThan(lastArticle.createdAt)
    })
})
describe('get my articles', () => {
    it('should get current 10 of my articles', async()=>{
        const httpRequest = {query: {}, params: {userId}},
        httpResponse = await getMyArticles(httpRequest);
        expect(httpResponse).to.haveOwnProperty('statusCode', '200')
        && expect(httpResponse).to.haveOwnProperty('body')
        .to.haveOwnProperty('articles').to.be.an('array')
        lastArticle = httpResponse.body.articles[httpResponse.body.articles.length -1]
    })
    it('should get next 10 of my articles', async()=> {
        const httpResponse = await getMyArticles({query: {createdAt: lastArticle.createdAt}, params: {userId}});
        expect(httpResponse).to.haveOwnProperty('statusCode', '200')
        // && expect(httpResponse).to.haveOwnProperty('body').to.haveOwnProperty('articles').to.be.an('array')
        // && expect(httpResponse.body.articles[0]).to.haveOwnProperty('createdAt').to.be.lessThan(lastArticle.createdAt)
    })
})

describe('get one article', ()=>{
    it("should get 200 and one article", async()=>{
        const HttpRequest = {params: {id: {articleId: '0994ada137304803affb281db678b2ed'}}, body: {user: {_id: userId}}};
        const httpResponse = await getArticle(HttpRequest);
        expect(httpResponse).to.haveOwnProperty('statusCode', '200')
        && expect(httpResponse).to.haveOwnProperty('body').to.haveOwnProperty('article')
    })
})
describe('get update article', ()=>{
    let httpResponse;
    before(async() => httpResponse = await putArticle({params: {id: articleId}, body: {article: {content: "new"}}}))
    it('should return 200 status code', ()=> 
        expect(httpResponse).to.haveOwnProperty('statusCode', '200'))
    it('should return body with updated article', ()=> 
        expect(httpResponse).to.haveOwnProperty('body').to.haveOwnProperty('article'))
    it('should have content: new in updated article', ()=>
        expect(httpResponse.body.article).to.haveOwnProperty('content', 'new'))
})
describe('delete one article', ()=>{
    it('should delete article and return with status code 200', async()=>{
        const httpResponse = await deleteArticle({params: {id: articleId}});
        expect(httpResponse).to.haveOwnProperty('statusCode', '200')
        && expect(httpResponse).to.haveOwnProperty('body')
    })
})
describe('comment controller testing', () => {
    var articleId, commentId;
    before(async()=>{
        const {body: {id}} = await postArticle({body: {title: "it's alright", userId, content: 'gasoline', matchingInfo:JSON.stringify({meet: true, matchingNickname: 'true'})}})
        articleId = id;
    })
    after(()=> deleteArticle({params: {id: articleId}}))
    describe('post article comment', ()=>{
        it('should return whole comment with just updated', async()=>{
            const httpRequest = {
                params: {articleId},
                body: {userId,content: "white houses"}
            }
            const httpResponse = await postComment(httpRequest)
            const {body: {comments}} = httpResponse;
            commentId = comments[0]._id;
            expect(httpResponse).to.haveOwnProperty('statusCode', '201')
            && expect(httpResponse).to.haveOwnProperty('body').to.haveOwnProperty('comments').to.be.an('array')
            && expect(httpResponse.body.comments[0]).to.deep.include({content: httpRequest.body.content})
        })
        it('should return 400: missing article id', async()=>{
            const httpRequest = {
                params: {},
                body: {userId, content: 'getting over you'}
            },
            httpResponse = await postComment(httpRequest)
            expect(httpResponse).to.haveOwnProperty('statusCode', '400')
            && expect(httpResponse).to.haveOwnProperty('body', errorMessage.nullError.postIdMissing)
        })
        it('should return 400 code: missing userid', async()=>{
            const httpRequest = {
                params: {articleId},
                body: {content: 'christmas'}
            }
            const httpResponse = await postComment(httpRequest);
            expect(httpResponse).to.haveOwnProperty('statusCode', '400')
            && expect(httpResponse).to.haveOwnProperty('body', errorMessage.nullError.idMissing)
        })
        it('should return 400: missing content', async()=>{
            const httpRequest = {params: {articleId}, body: {userId}},
            httpResponse = await postComment(httpRequest);
            expect(httpResponse).to.haveOwnProperty('statusCode', '400')
            && expect(httpResponse).to.haveOwnProperty('body', errorMessage.nullError.contentMissing)
        })
        it('should return 400: no user foudn', async()=>{
            const httpRequest = {params: {articleId}, body: {userId: 'noUserFound', content:'fly fly'}},
            httpResponse = await postComment(httpRequest)
            expect(httpResponse).to.haveOwnProperty('statusCode', '400')
            && expect(httpResponse).to.haveOwnProperty('body', errorMessage.dbError.userNotFound)
        })
        it("should return 400: no article found", async()=>{
            const httpReuest = {params: {articleId: 'wrongId'}, body: {userId, content: 'toxic'}},
            httpResponse = await postComment(httpReuest)
            expect(httpResponse).to.haveOwnProperty('statusCode', '400')
            && expect(httpResponse).to.haveOwnProperty('body', errorMessage.dbError.postIdNotFound)
        })
    })
    describe('put comment', () => {
        it("shoud return 200 with updated comment", async()=>{
            const httpRequest = {
                params: {articleId, commentId},
                body: {content: 'fight back'}
            },
            httpResponse = await putComment(httpRequest);
            expect(httpResponse).to.haveOwnProperty('statusCode', '200')
            expect(httpResponse).to.haveOwnProperty('body').to.haveOwnProperty('comments')
            && expect(httpResponse.body.comments[0]).to.deep.include({content: httpRequest.body.content})
        })
        it('should return 400: missing articleId', async()=>{
            const httpRequest = {params: {commentId}, body: {content: 'monday'}},
            httpResponse = await putComment(httpRequest)
            expect(httpResponse).to.haveOwnProperty('statusCode', '400')
            && expect(httpResponse).to.haveOwnProperty('body', errorMessage.nullError.postIdMissing)
        })
        it("should return 400: missing comment id", async()=>{
            const httpRequest = {params: {articleId}, body: {content: 'monday'}},
            httpResponse = await putComment(httpRequest)
            expect(httpResponse).to.haveOwnProperty('statusCode', '400')
            && expect(httpResponse).to.haveOwnProperty('body', errorMessage.nullError.commentIdMissing)
        })
        it('should return 400: missing contetn', async()=>{
            const httpRequest = {params: {articleId, commentId}, body: {}},
            httpResponse = await putComment(httpRequest)
            expect(httpResponse).to.haveOwnProperty('statusCode', '400')
            && expect(httpResponse).to.haveOwnProperty('body', errorMessage.nullError.contentMissing)
        })
        it('should return 400: no article found',  async()=>{
            const httpRequest = {params: {articleId: 'noarticle', commentId}, body: {content: 'hello'}},
            httpResponse = await putComment(httpRequest)
            expect(httpResponse).to.haveOwnProperty('statusCode', '400')
            && expect(httpResponse).to.haveOwnProperty('body', errorMessage.dbError.postIdNotFound)
        })
        it('should return  400: no comment found', async()=>{
            const httpRequest = {params: {articleId, commentId: 'noComment'}, body: {content: 'hellod]'}},
            httpResponse = await putComment(httpRequest)
            expect(httpResponse).to.haveOwnProperty('statusCode', '400')
            && expect(httpResponse).to.haveOwnProperty('body', errorMessage.dbError.commentIdNotFound)
        })
    })
    describe('delete comment', () => {
        it('should return 200 with comments array', async()=>{
            const httpRequest = {params: {articleId, commentId}},
            httpResponse = await deleteComment(httpRequest)
            expect(httpResponse).to.haveOwnProperty('statusCode', '200')
            && expect(httpResponse).to.haveOwnProperty('body').to.haveOwnProperty('comments').to.be.lengthOf(0)
        })
        it('should return 400: articleid missing', async()=>{
            const httpRequest = {params: {commentId}},
            httpResponse = await deleteComment(httpRequest)
            expect(httpResponse).to.haveOwnProperty('statusCode', '400')
            && expect(httpResponse).to.haveOwnProperty('body', errorMessage.nullError.postIdMissing)
        })
        it('should return 400: comment id missing', async()=>{
            const httPrequest = {params: {articleId}},
            httpResponse = await deleteComment(httPrequest)
            expect(httpResponse).to.haveOwnProperty('statusCode', '400')
            && expect(httpResponse).to.haveOwnProperty('body', errorMessage.nullError.commentIdMissing)
        })
        it('should return 400: no article found', async()=>{
            const httpRequest = {params: {articleId: 'heuy', commentId}},
            httpResponse = await deleteComment(httpRequest)
            expect(httpResponse).to.haveOwnProperty('statusCode', '400')
            && expect(httpResponse).to.haveOwnProperty('statusCode', '400')
        })
        it('should retrun 400: comment not found', async()=>{
            const httpRequest = {params: {articleId, commentId: 'nocomment'}},
            httpResponse =await deleteComment(httpRequest)
            expect(httpResponse).to.haveOwnProperty('statusCode', '400')
            && expect(httpResponse).to.haveOwnProperty('body', errorMessage.dbError.commentIdNotFound)
        })
    })
})
describe('testing add like to article controller', () => {
    let articleId;
    before(async()=> {
        const {body:{id}} = await postArticle({body: {
            title: 'title', userId:userId, content: 'back', matchingInfo:JSON.stringify({meet: true, matchingNickname: 'true'})
        }})
        articleId = id;
    })
    after(()=> deleteArticle({params: {id: articleId}}))
    describe('testing happy path for adding like to article', () => {
        let httpResponse; 
        before(async()=> httpResponse = await postArticleLike({params: {articleId}, body: {userId}}))
        it('should have status code of 200', ()=> 
            expect(httpResponse).to.haveOwnProperty('statusCode', '200'))
        it('should have body with null', ()=> 
            expect(httpResponse).to.haveOwnProperty('body', null))
        it('should have added like to article', async ()=>{
            const checkLike = await articleDb.getOneArticle(articleId);
            expect(checkLike).to.haveOwnProperty('like').to.be.an('array').to.deep.include({userId})
        })
    })
    describe('add like testing unhappy path', () => {
        it('should return status code of 400: no article id', async()=>{
            const httpResponse = await postArticleLike({params:{}, body:{userId}});
            expect(httpResponse).to.haveOwnProperty('statusCode', '400')
            && expect(httpResponse).to.haveOwnProperty('body', errorMessage.nullError.postIdMissing)
        })
        it('should return 400 status code: no user id', async()=>{
            const httpResponse = await postArticleLike({params:{articleId}, body:{}});
            expect(httpResponse).to.haveOwnProperty('statusCode', '400')
            && expect(httpResponse).to.haveOwnProperty('body', errorMessage.nullError.idMissing)
        })
        it('should return 400 status code: article not found in db', async()=>{
            const httpResponse = await postArticleLike({params: {articleId: 'afd'}, body: {userId}});
            expect(httpResponse).to.haveOwnProperty('statusCode', '400')
            && expect(httpResponse).to.haveOwnProperty('body', errorMessage.dbError.postIdNotFound)
        })
        it('should return 400: no user found in db', async()=>{
            const httpResponse = await postArticleLike({params: {articleId}, body: {userId: 'ahah'}})
            expect(httpResponse).to.haveOwnProperty('statusCode', '400')
            && expect(httpResponse).to.haveOwnProperty('body', errorMessage.dbError.userNotFound)
        })
        it("should return 400: already liked to this article", async()=>{
            const httpResponse = await postArticleLike({params: {articleId}, body:{userId}})
            expect(httpResponse).to.haveOwnProperty('statusCode', '400')
            && expect(httpResponse).to.haveOwnProperty('body', errorMessage.dbError.articleAlreadyLiked)
        })
    })
    
})
