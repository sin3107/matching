import errorMessage from '../../helper/error.js'
import { expect } from "chai"
import { ChatMessage } from "../../models/index.js"

describe('Testing chat message model', () => {
    describe('getting successful model', () => {
        const message = ChatMessage({conversationId: 'conversationId', from:"A", to:"B", contentType:"Text", content: "testing"})
        it("should be a frozen object", ()=>{
            expect(message).to.be.a.frozen.and.to.be.an('object')
        })
        it('should have _id field with random string', ()=>{
            expect(message).to.haveOwnProperty('_id').to.be.a('string')
        })
        it('should have conversation id field as string', ()=> {
            expect(message).to.haveOwnProperty('conversationId').to.be.a('string', 'conversationId')
        })
        it("should have from field as string", ()=>{
            expect(message).to.haveOwnProperty('from').to.be.a('string', 'A')
        })
        it("should have to field as string", ()=>{
            expect(message).to.haveOwnProperty('to').to.be.a('string', "B")
        })
        it('should have contentType field as string', ()=>{
            expect(message).to.haveOwnProperty('contentType').to.be.a('string', 'Text')
        })
        it('should have content field as string', ()=>{
            expect(message).to.haveOwnProperty('content').to.be.a('string', 'testing')
        })
        it('should have timestamp field as Date', ()=>{
            expect(message).to.haveOwnProperty('timestamp').to.be.a('Date')
        })
    })
    describe('null checking', () => {
        it('should throw error: no conversation id', ()=>{
            expect(()=>ChatMessage({}))
            .to.throw(Error, errorMessage.nullError.conversationIdMissing.message)
            .with.property('code', errorMessage.nullError.conversationIdMissing.code)
        })
        it("should throw error: no from field given", ()=>{
            expect(()=>ChatMessage({conversationId:'conv'}))
            .to.throw(Error, errorMessage.nullError.fromMissing.message)
            .with.property('code', errorMessage.nullError.fromMissing.code)
        })
        it("should throw error: no to field ", ()=>{
            expect(()=>ChatMessage({conversationId:'conv', from:'A'}))
            .to.throw(Error, errorMessage.nullError.toMissing.message)
            .with.property('code', errorMessage.nullError.toMissing.code)
        })
        it('should throw error: no contentType field', ()=>{
            expect(()=>ChatMessage({conversationId:'conv', from:"A", to:"B"}))
            .to.throw(Error, errorMessage.nullError.contentTypeMissing.message)
            .with.property('code', errorMessage.nullError.contentTypeMissing.code)
        })
        it('should throw error: no content', ()=>{
            expect(()=>ChatMessage({conversationId:'conv', from:"from", to:"to", contentType:'text'}))
        })
    })
    
})
