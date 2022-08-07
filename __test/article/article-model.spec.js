import {expect} from 'chai'
import { Article } from '../../models/index.js'
import errorMessage from '../../helper/error.js'

describe("test", ()=>{
    describe("successfull model", ()=>{
        const article = Article({
            userId: Date.now().toString(),
            title: "testing article model",
            content: "hi",
            matchingInfo: {
                meet: true,
                matchingNickname: 'hey'
            }
        })
        it("should be a frozen object", ()=>{
            expect(article).to.be.an("object").and.to.be.a.frozen;
        })
        it("should have _id field as string", ()=>{
            expect(article).to.have.property('_id').and.to.be.a('string')
        })
        it("should have userId field as string", ()=>{
            expect(article).to.have.property('userId').and.to.be.a("string")
        })
        it('should have createdAt as Date type', ()=>{
            expect(article).to.have.property('createdAt').and.to.be.a("Date")
        })
        it('should have modifiedAt as undefined', ()=>{
            expect(article).to.have.property('modifiedAt').and.to.be.undefined
        })
        it('should have views as number', ()=>{
            expect(article).to.have.property('views').and.to.be.a('number')
        })
        it('should have like as empty array', ()=>{
            expect(article).to.haveOwnProperty('like').to.be.an('array').to.be.lengthOf(0)
        })
        it("should have title as string", ()=>{
            expect(article).to.have.property('title').and.to.be.a('string')
        })
        it("should have content as string", ()=>{
            expect(article).to.have.property('content').and.to.be.a('string')
        })
        it('should have files field as array', ()=> {
            expect(article).to.haveOwnProperty('files').and.to.be.an('array')
        })
        it('should have matching info field as object', ()=>{
            expect(article).to.haveOwnProperty('matchingInfo').and.to.be.an('object')
        })
        it('should have meet in matchingInfo as boolean', ()=>{
            expect(article).to.haveOwnProperty('matchingInfo').to.haveOwnProperty('meet').to.be.true
        })
        it('should have matching nickname field as stirng', ()=>{
            expect(article).to.haveOwnProperty('matchingInfo').to.haveOwnProperty('matchingNickname').to.be.a('string')
        })
        it("should have comments as array", ()=>{
            expect(article).to.have.property('comments').and.to.be.an('array')
        })
    })
    describe("null error throwing", ()=>{
        it("should throw error: no user id", ()=>{
            expect(()=>Article({}))
            .to.throw(Error, errorMessage.nullError.idMissing.message)
            .with.property('code', errorMessage.nullError.idMissing.code)
        })
        it("should throw error: no title", ()=>{
            expect(()=>Article({userId: 'test'}))
            .to.throw(Error, errorMessage.nullError.titleMissing.message)
            .with.property('code', errorMessage.nullError.titleMissing.code)
        })
        it("should throw error: no content", ()=>{
            expect(()=>Article({userId: "test", title: "title"}))
            .to.throw(Error, errorMessage.nullError.contentMissing.message)
            .with.property('code', errorMessage.nullError.contentMissing.code)
        })
        it('should thow error: no matching info - where', ()=>{
            expect(()=>Article({userId: 'test', title: 'title', content: 'heyhey'}))
            .to.throw(Error, errorMessage.nullError.matchingInfoWhereMissing.message)
            .with.property('code', errorMessage.nullError.matchingInfoWhereMissing.code)
        })
        it('should throw error: no matching nickname ', ()=>{
            expect(()=>Article({userId:"test", title: 'title', content: 'content', matchingInfo: {meet: false}}))
            .to.throw(Error, errorMessage.nullError.matchingInfoWhoMissing.message)
            .with.property('code', errorMessage.nullError.matchingInfoWhoMissing.code)
        })
    })
    describe("type error throwing", ()=>{
        it("should throw type error: userId is not strig", ()=>{
            expect(()=>Article({userId: [], title: "title", content: "content", matchingInfo: {meet: true, matchingNickname: 'a'}}))
            .to.throw(TypeError, errorMessage.syntaxError.idNotString.message)
            .with.property("code", errorMessage.syntaxError.idNotString.code)
        })
        it("should throw type error: title not stirng", ()=>{
            expect(()=>Article({userId: 'test', title: 10, content: 'content', matchingInfo: {meet: true, matchingNickname: 'a'}}))
            .to.throw(TypeError, errorMessage.syntaxError.titleNotStr.message)
            .with.property('code', errorMessage.syntaxError.titleNotStr.code)
        })
        it("should throw type error: content not string", ()=>{
            expect(()=>Article({userId: "userId", title: "title", content: {}, matchingInfo: {meet: true, matchingNickname: 'a'}}))
            .to.throw(TypeError, errorMessage.syntaxError.contentNotStr.message)
            .with.property('code', errorMessage.syntaxError.contentNotStr.code)
        })
        it('should throw type error: matching info meet is not boolean', ()=>{
            expect(()=> Article({userId: 'test', title: 'title', content: 'content', matchingInfo: {meet: 'look', matchingNickname: 'a'}}))
            .to.throw(TypeError, errorMessage.syntaxError.matchingInfoWherNotBoolean.message)
            .with.property('code', errorMessage.syntaxError.matchingInfoWherNotBoolean.code)
        })
        it('should throw type error: matching nickname not stirng', ()=>{
            expect(()=>Article({userId: 'userid', title: 'title', content: 'content', matchingInfo: {meet: false, matchingNickname: {}}}))
            .to.throw(TypeError, errorMessage.syntaxError.matchingInfoWhoNotStr.message)
            .with.property('code', errorMessage.syntaxError.matchingInfoWhoNotStr.code)
        })
    })
})