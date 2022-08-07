import { expect } from "chai"
import { articleDb } from "../../db-handler/index.js"
import { Article, ArticleComment } from "../../models/index.js"
const id1 = Date.now().toString(),
id2 = new Date().toDateString(),
id3 = new Date().toTimeString(),
userId = 'test'
describe('db handling', ()=>{
    describe('article db handling with article', ()=>{
        let lastArticle;
        before(async()=>{
            await articleDb.insertArticle(Article({_id: id1, title: id1, content: id1, userId: userId, matchingInfo: {meet: true, matchingNickname: 'a'}}));
            await articleDb.insertArticle(Article({_id: id2, title: id2, content: id2, userId: userId, matchingInfo: {meet: true, matchingNickname: 'a'}}))
            await articleDb.insertArticle(Article({_id: id3, title: id3, content: id3, userId: userId, matchingInfo: {meet: true, matchingNickname: 'a'}}))
        })
        it('should get article db', async()=>{
            const db = await articleDb.getArticleDb();
            expect(db.s.namespace).to.have.property("collection", "article");
        })
        it("should insert new article", async()=>{
            const article = Article({_id: 'test', userId: userId, title: id1, content: Date.now().toString(), matchingInfo: {meet: true, matchingNickname: 'a'}}),
            savedId = await articleDb.insertArticle(article);
            expect(savedId).to.be.equal('test')
        })
        it('should get current 10 articles', async()=>{
            const articles = await articleDb.getArticles();
            lastArticle = articles[articles.length -1]
            expect(articles).to.be.lengthOf(2) // NOTE later change this
            && expect(articles).to.not.have.any.keys('modifiedAt', 'matchingInfo', 'comments');
        })
        it('should get current artilces of next 10', async()=>{
            const articles = await articleDb.getArticles(lastArticle.createdAt);
            expect(articles).to.be.lengthOf(2) // NOTE later change this
            && expect(articles[articles.length -1]).to.haveOwnProperty('createdAt').to.be.lessThan(lastArticle.createdAt)
        })
        it('should get my articles of currnet 10', async()=>{
            const articles = await articleDb.getMyArticles({userId});
            expect(articles).to.be.lengthOf(1) //NOTE change this value later
            lastArticle = articles[articles.length -1]
        })
        it('should get next 10 articles of mine', async()=>{
            const articles = await articleDb.getMyArticles({userId, createdAt: lastArticle.createdAt});
            expect(articles).to.be.lengthOf(1) // NOTE change this value later
            && expect(articles[articles.length -1]).to.haveOwnProperty('createdAt').to.be.lessThan(lastArticle.createdAt)
        })
        it('should get one article', async()=>{
            const article = await articleDb.getOneArticle('test');
            expect(article).to.have.property('_id', 'test')
        })
        it('should inclement one in views', async()=>{
            await articleDb.incViews('test');
            const checkViews = await articleDb.getOneArticle('test');
            expect(checkViews).to.haveOwnProperty('views', 1)
        })
        it('should add like by one user', async()=>{
            await articleDb.addLike({articleId: 'test', userId});
            const checkLike = await articleDb.getOneArticle('test');
            expect(checkLike).to.haveOwnProperty('like').to.haveOwnProperty('0')
            .to.include({userId})
        })
        it('should update one article', async()=>{
            const id = 'test',
            content = {content: 'updated', title: 'new'},
            updatedArticle = await articleDb.updateArticle(id, content);
            expect(updatedArticle).to.include({content: 'updated', title: 'new'})
        })
        it('should delete one article', async()=>{
            const deletedCount = await articleDb.deleteOneArticle('test');
            expect(deletedCount).to.be.equal(1)
        })
        it('should delete all article by one user', async()=>{
            const deletedCount = await articleDb.deleteArticleByUser(userId);
            expect(deletedCount).to.be.a("Number", 3)
        })
    })
    describe('article db handling with comment', () => {
        var commentId;
        before(async()=>{
            await articleDb.insertArticle({_id: id1, content: id1, userId})
        })
        after(()=>{
            articleDb.deleteOneArticle(id1)
        })
        it("should add comment to article document", async()=>{
            const comment = ArticleComment({userId, content: 'hello from test script'}), 
            addedComments = await articleDb.addComment({articleId: id1, comment})
            commentId = comment._id
            expect(addedComments[0]).to.haveOwnProperty('_id', commentId)
        })
        it('should update comment', async()=>{
            const comment = {_id: commentId, content: 'new content', modifiedAt: new Date()},
            updatedComments = await articleDb.updateComment({articleId: id1, comment})
            expect(updatedComments[0]).to.haveOwnProperty('_id', commentId)
            && expect (updatedComments[0]).to.haveOwnProperty('content', 'new content')
        })
        it('should delete comment', async()=>{
            const deleted = await articleDb.deleteComment({articleId: id1, commentId});
            expect(deleted).to.be.lengthOf(0)
        })
    })
})