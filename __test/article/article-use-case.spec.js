import { expect } from "chai";
import {  article_use_case } from "../../use-cases/handle-article.js"
import errorMessage from '../../helper/error.js'
import { articleDb, makeDb } from "../../db-handler/index.js";

var articleId, userId;
describe('adding article', ()=>{
    before(async()=>{
        const db = await makeDb(),
       {_id} = await db.collection('user').findOne()
        userId = _id;
    })
    it('should return true with insertedId', async()=>{
        const result = await article_use_case
        .addArticle({user: {_id: userId}, title: 'title', content: 'content', matchingInfo:{meet: true, matchingNickname: 'true'}});
        articleId = result.body.id;
        expect(result).to.have.property('status', true)
        && expect(result).to.have.property('body').to.have.property('id').to.be.a('string')
    })
    it("should return false: no user found", async()=>{
        const result = await article_use_case
        .addArticle({user: {_id: "noUser"}, title: 'title', content: 'content', matchingInfo:{meet: true, matchingNickname: 'true'}});
        expect(result).to.have.property('status', false)
        && expect(result).to.have.property('body', errorMessage.dbError.userNotFound)
    })
})
describe('get articles', ()=>{
    describe('get all articles of first page', ()=>{
        let lastArticle;
        it('should get current 10 articles and content to less than 10 characters', async()=>{
            const result = await article_use_case.getAllArticles({body: {user: {_id: userId}}});
            lastArticle = result.body.articles[result.body.articles.length -1]
            expect(result).to.have.property('status', true)
            && expect(result).to.have.property('body').to.have.property('articles').to.be.an('array')
            .to.haveOwnProperty('0').to.haveOwnProperty('content').to.be.lengthOf.below(10)
        })
        it('should retun next 10 articles', async()=>{
             const result = await article_use_case.getAllArticles({createdAt: lastArticle.createdAt, body:{user:{_id: userId}}});
             expect(result).to.haveOwnProperty('status', true)
            && expect(result).to.haveOwnProperty('body')
            .to.haveOwnProperty('articles').to.be.lengthOf(2) //NOTE later change this
            && expect(result.body.articles[0]).to.haveOwnProperty('createdAt').to.be.lessThan(lastArticle.createdAt)
        })
        it('should return false: created at is not date', async()=>{
            const result = await article_use_case.getAllArticles({createdAt: 'falsefaf', body: {user: {_id: userId}}});
            expect(result).to.haveOwnProperty('status', false)
            && expect(result).to.haveOwnProperty('body', errorMessage.syntaxError.timestampNotDate)
        })
    })
    describe('get my articles', () => {
        let lastArticle;
        before(async()=>{
            await article_use_case.addArticle({user: {_id: userId}, title: 'title', content: 'content', matchingInfo:{meet: true, matchingNickname: 'true'}})
        })
        it('should return current 10 of my articles', async()=>{
            const result = await article_use_case.getMyArticles({userId})
            lastArticle = result.body.articles[result.body.articles.length -1]
            expect(result).to.haveOwnProperty('status', true)
            && expect(result).to.haveOwnProperty('body')
            .to.haveOwnProperty('articles').to.be.lengthOf.at.least(1) 
        })
        it('should return next 10 articles of mine', async()=>{
            const result = await article_use_case.getMyArticles({userId, createdAt: lastArticle.createdAt})
            expect(result).to.haveOwnProperty('status', true)
            && expect(result).to.haveOwnProperty('body')
            .to.haveOwnProperty('articles').to.be.an('array')
            .to.haveOwnProperty('0').to.haveOwnProperty('createdAt').to.be.lessThan(lastArticle.createdAt)
        })
        it('shold return false: no user id', async()=>{
            const result = await article_use_case.getMyArticles({});
            expect(result).to.haveOwnProperty('status', false)
            && expect(result).to.haveOwnProperty('body', errorMessage.nullError.idMissing)
        })
        it('should return false: created at is not date', async()=>{
            const result = await article_use_case.getMyArticles({userId, createdAt:'adfas'});
            expect(result).to.haveOwnProperty('status', false)
            && expect(result).to.haveOwnProperty('body', errorMessage.syntaxError.timestampNotDate)
        })
        it('should return false: no user found', async()=>{
            const result = await article_use_case.getMyArticles({userId: "userId", page: '1'})
            expect(result).to.haveOwnProperty('status', false)
            && expect(result).to.haveOwnProperty('body', errorMessage.dbError.userNotFound)
        })
    })
    
    describe('get one article', ()=>{
        let result;
        before(async()=> result = await article_use_case.getOneArticle({articleId, body:{user: {_id: userId}}}))
        it('should return true and one article', ()=>{
            expect(result).to.have.property('status', true)
        })
        it(`should return body with one article that has same _id with ${articleId}`, ()=>{
            expect(result).to.have.property('body').to.have.property('article').to.include({_id: articleId})
        })
        it('should have inclemented to 1 article views', async()=>{
            const viewCheck = await articleDb.getOneArticle(articleId);
            expect(viewCheck).to.haveOwnProperty('views', 1)
        })
        it('should have like & hasUserLiked field with value', ()=>{
            expect(result.body.article).to.haveOwnProperty("like").to.be.a('number', 0)
            && expect(result.body.article).to.haveOwnProperty('hasUserLiked', false)
        })
    })
})
describe('update article', ()=>{
    it("should return true and updated article", async()=>{
        const result = await article_use_case.updateArticle(articleId, {content: 'new'});
        expect(result).to.have.property('status', true)
        && expect(result).to.have.property('body').to.have.property('article').to.include({content: 'new'})
        && expect(result.body.article).to.haveOwnProperty('modifiedAt').to.be.a("date")
    })
    it("should return false: no article id", async()=>{
        const result = await article_use_case.updateArticle('', {content: 'new'});
        expect(result).to.have.property('status', false)
        && expect(result).to.have.property('body', errorMessage.nullError.postIdMissing)
    })
    it('should return false: no content', async()=>{
        const result = await article_use_case.updateArticle(articleId);
        expect(result).to.have.property('status', false)
        && expect(result).to.have.property('body', errorMessage.nullError.contentMissing)
    })
    it('should return false: article id not found in db', async()=>{
        const result = await article_use_case.updateArticle('articleid', {content: 'new'});
        expect(result).to.have.property('status', false)
        && expect(result).to.have.property('body', errorMessage.dbError.postIdNotFound);
    })
})
describe('delete article', ()=>{
    describe('delete one article', ()=>{
        it("should return true and nothing", async()=>{
            const result = await article_use_case.deleteArticle(articleId);
            expect(result).to.have.property('status', true)
            && expect(result).to.have.property('body')
        })
        it("should return false: no article id", async()=>{
            const result = await article_use_case.deleteArticle();
            expect(result).to.have.property('status', false)
            && expect(result).to.have.property('body', errorMessage.nullError.postIdMissing);
        })
        it('should return false: id not found in db', async()=>{
            const result = await article_use_case.deleteArticle('articleid')
            expect(result).to.have.property('status', false)
            && expect(result).to.have.property('body', errorMessage.dbError.postIdNotFound);
        })
    })
    describe('delete articles by user', ()=>{
        before(async()=>{
            await article_use_case.addArticle({user: {_id: userId},  title: 'title', content: 'content', matchingInfo:JSON.stringify({meet: true, matchingNickname: 'true'})});
            await article_use_case.addArticle({user: {_id: userId},  title: 'title', content: 'content', matchingInfo:JSON.stringify({meet: true, matchingNickname: 'true'})});
        })
        it("should return true and deleted count", async()=>{
            const result = await article_use_case.deleteArticles(userId);
            expect(result).to.have.property('status', true)
            && expect(result).has.property('body').to.have.property('deletedCount').at.least(1)
        })
        it('should return false: no user id', async()=>{
            const result = await article_use_case.deleteArticles()
            expect(result).to.have.property('status', false)
            && expect(result).to.have.property('body', errorMessage.nullError.idMissing);
        })
    })
})
describe('comment handling', ()=>{
    var articleId, commentId;
    before(async()=>{
        const {body: {id}} = await article_use_case
        .addArticle({user: {_id: userId}, title: 'principle', content: 'oh oh ', matchingInfo:{meet: true, matchingNickname: 'true'}})
        articleId = id;
    })
    after(()=>{
        article_use_case.deleteArticle(articleId)
    })
    describe('adding comment', ()=>{
        it('should add new comment', async()=>{
            const result = await article_use_case.addComment({articleId, body: {userId, content:'okay sugar i no dummy dummy'}})
            commentId = result.body.comments[0]._id
            expect(result).to.haveOwnProperty('status', true)
            && expect(result).to.haveOwnProperty('body').to.have.property('comments').to.be.an('array')
        })
        it('should return false: article id missing', async()=>{
            const result = await article_use_case.addComment({body: {userId, content: 'drinking'}})
            expect(result).to.haveOwnProperty('status', false)
            && expect(result).to.haveOwnProperty('body', errorMessage.nullError.postIdMissing)
        })
        it('should return false: user id missing', async()=>{
            const result = await article_use_case.addComment({articleId, body: {content: 'fly away'}});
            expect(result).to.haveOwnProperty('status', false)
            && expect(result).to.haveOwnProperty('body', errorMessage.nullError.idMissing)
        })
        it('should return false: conetent missing', async()=>{
            const result = await article_use_case.addComment({articleId, body: {userId}});
            expect(result).to.haveOwnProperty('status', false)
            && expect(result).to.haveOwnProperty('body', errorMessage.nullError.contentMissing)
        })
        it('should return false: no user found', async()=>{
            const result = await article_use_case.addComment({articleId, body: {userId: 'noUserFound', content: "we're good"}})
            expect(result).to.haveOwnProperty('status', false)
            && expect(result).to.haveOwnProperty('body', errorMessage.dbError.userNotFound);
        })
        it("should return false: no article found in db", async()=>{
            const result = await article_use_case.addComment({articleId:'noArticle', body: {userId, content: 'run away'}})
            expect(result).to.haveOwnProperty('status', false)
            && expect(result).to.haveOwnProperty('body', errorMessage.dbError.postIdNotFound)
        })
    })
    describe('udpating comment', ()=>{
        it('should return true and update comment', async()=>{
            const result = await article_use_case.updateComment({articleId, body: {content: "you got higher power"}, commentId: commentId})
            expect(result).to.haveOwnProperty('status', true)
            && expect(result).to.haveOwnProperty('body').to.haveOwnProperty('comments')
            .to.haveOwnProperty('0')
            .to.haveOwnProperty('content', 'you got higher power')
        })
        it('should return false: article id missing', async()=>{
            const result = await article_use_case.updateComment({commentId, body: {content: 'a'}})
            expect(result).to.haveOwnProperty('status', false)
            && expect(result).to.haveOwnProperty('body', errorMessage.nullError.postIdMissing)
        })
        it('shoudl return false: comment id missing', async()=>{
            const result = await article_use_case.updateComment({articleId, body: {content: "better"}})
            expect(result).to.haveOwnProperty('status', false)
            && expect(result).to.haveOwnProperty('body', errorMessage.nullError.commentIdMissing)
        })
        it('should return false: content missing', async()=>{
            const result = await article_use_case.updateComment({articleId, commentId, body:{}});
            expect(result).to.haveOwnProperty('status', false)
            && expect(result).to.haveOwnProperty('body', errorMessage.nullError.contentMissing)
        })
        it('should return false: article not found in db', async()=>{
            const result = await article_use_case.updateComment({articleId: "articleIDNotFound", commentId, body:{content: 'hello'}})
            expect(result).to.haveOwnProperty('status', false)
            && expect(result).to.haveOwnProperty('body', errorMessage.dbError.postIdNotFound)
        })
        it('should return false: comment id not found in db', async()=>{
            const result = await article_use_case.updateComment({articleId, commentId:'noComment', body: {content: 'hello'}})
            expect(result).to.haveOwnProperty('status', false)
            && expect(result).to.haveOwnProperty('body', errorMessage.dbError.commentIdNotFound);
        })
    })
    describe('delete comment', ()=>{
        it("should return true and delete comment", async()=>{
            const result = await article_use_case.deleteComment({articleId, commentId});
            expect(result).to.haveOwnProperty('status', true)
            && expect(result).to.haveOwnProperty('body').to.haveOwnProperty('comments').to.be.lengthOf(0)
        })
        it('should return false: articleid missing', async()=>{
            const result = await article_use_case.deleteComment({commentId});
            expect(result).to.haveOwnProperty('status', false)
            && expect(result).to.haveOwnProperty('body', errorMessage.nullError.postIdMissing)
        })
        it("should return false: comment id missing", async()=>{
            const result = await article_use_case.deleteComment({articleId});
            expect(result).to.haveOwnProperty('status', false)
            && expect(result).to.haveOwnProperty('body', errorMessage.nullError.commentIdMissing)
        })
        it("should return false: article not found", async()=>{
            const result = await article_use_case.deleteComment({articleId: 'noArticleId', commentId})
            expect(result).to.haveOwnProperty('status', false)
            && expect(result).to.haveOwnProperty('body', errorMessage.dbError.postIdNotFound)
        })
        it('should return false: comment not found', async()=>{
            const result = await article_use_case.deleteComment({articleId, commentId: 'noComment'})
            expect(result).to.haveOwnProperty('status', false)
            && expect(result).to.haveOwnProperty('body', errorMessage.dbError.commentIdNotFound)
        })
    })
})
describe('handling like feature in article', () => {
    let articleId;
    before(async()=>{ 
        const {body: {id}} = await article_use_case.addArticle({user: {_id: userId}, title: 'title', content: 'content', matchingInfo: {meet: true, matchingNickname: 'true'}})
        articleId = id;
    })
    after(async()=> article_use_case.deleteArticle(articleId))
    describe('add like - happy path', () => {
        let result;
        before(async()=> result = await article_use_case.addLikeToArticle({articleId, userId}))
        it('should return true in status', ()=> 
            expect(result).to.haveOwnProperty('status', true))
        it('should return nothing in body', ()=> 
            expect(result).to.haveOwnProperty('body', null))
        it('should have added user id to article', async()=>{
            const checkLike = await articleDb.getOneArticle(articleId);
            expect(checkLike).to.haveOwnProperty('like').to.be.an('array').to.deep.include({userId})
        })
    })
    describe('add like - unhappy path', () => {
        it('should return false: no article id', async()=>{
            const result = await article_use_case.addLikeToArticle({userId});
            expect(result).to.haveOwnProperty('status', false)
            && expect(result).to.haveOwnProperty('body', errorMessage.nullError.postIdMissing)
        })
        it('should return false: no user id', async()=>{
            const result = await article_use_case.addLikeToArticle({articleId});
            expect(result).to.haveOwnProperty('status', false)
            && expect(result).to.haveOwnProperty('body', errorMessage.nullError.idMissing)
        })
        it('should return false: article not found in db', async ()=>{
            const result = await article_use_case.addLikeToArticle({articleId: 'a', userId});
            expect(result).to.haveOwnProperty('status', false)
            && expect(result).to.haveOwnProperty('body', errorMessage.dbError.postIdNotFound)
        })
        it('should return false: user not found in db', async()=>{
            const result = await article_use_case.addLikeToArticle({articleId, userId: 'a'})
            expect(result).to.haveOwnProperty('status', false)
            && expect(result).to.haveOwnProperty('body', errorMessage.dbError.userNotFound)
        })
        describe("should return false: already liked", ()=>{
            let result;
            before(async()=> result = await article_use_case.addLikeToArticle({articleId, userId}))
            it('should return status: false', ()=> 
                expect(result).to.haveOwnProperty('status', false))
            it('should return body with error message', ()=> 
                expect(result).to.haveOwnProperty('body', errorMessage.dbError.articleAlreadyLiked))
            it("should not have user id in like array twice", async()=>{
                const checkLike = await articleDb.getOneArticle(articleId);
                expect(checkLike).to.haveOwnProperty('like').to.be.lengthOf(1)
            })
        })
    })
})
