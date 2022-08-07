import { expect } from "chai";
import { ArticleComment } from "../../models/index.js";
import errorMessage from '../../helper/error.js'
describe('article comment model testing', ()=>{
    describe('successfull article comment model', ()=>{
        const articleComment = ArticleComment({userId: "userId", content: "content"});
        it("should be frozen object", ()=>{
            expect(articleComment).to.be.frozen
        })
        it('should have _id field as string', ()=>{
            expect(articleComment).to.haveOwnProperty('_id').to.be.a('string')
        })
        it("should have user Id as string", ()=>{
            expect(articleComment).to.haveOwnProperty('userId', 'userId').to.be.a('string')
        })
        it("should have content as string", ()=>{
            expect(articleComment).to.haveOwnProperty('content', 'content').to.be.a('string')
        })
        it('should have createdAt as date', ()=>{
            expect(articleComment).to.haveOwnProperty('createdAt').to.be.a('Date')
        })
        it("should have modifiedAt as undefined", ()=>{
            expect(articleComment).to.haveOwnProperty('modifiedAt', undefined)
        })
    })
    describe('null checking', ()=>{
        it("should throw error: no user id", ()=>{
            expect(()=>ArticleComment({}))
            .to.throw(Error, errorMessage.nullError.idMissing.message)
            .with.property('code', errorMessage.nullError.idMissing.code)
        })
        it("should throw error: no content", ()=>{
            expect(()=>ArticleComment({userId: 'userId'}))
            .to.throw(Error, errorMessage.nullError.contentMissing.message)
            .with.property('code', errorMessage.nullError.contentMissing.code)
        })
    })
})