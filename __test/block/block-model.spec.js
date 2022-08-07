import { expect } from "chai"
import { Block } from "../../models/index.js"
import errorMessage from '../../helper/error.js'

describe("block model testing", ()=>{
    describe("successfull block model: block to phone", ()=>{
        const block = Block({blockBy:"userA", blockToPhone: "01012"});
        it("should be a frozen object", ()=>{
            expect(block).to.be.an("object").and.to.be.frozen
        })
        it("should have id", ()=>{
            expect(block).to.have.property("_id").and.to.be.a("string")
        })
        it("should have block by", ()=>{
            expect(block).to.have.property("blockBy", "userA")
        })
        it("should have blockTo with phone", ()=>{
            expect(block).to.have.property("blockTo").to.have.property("phoneNumber", "01012")
        })
        it("should have block to with user id undefined", ()=>{
            expect(block).to.have.property("blockTo").to.have.property("userId").to.be.undefined
        })
    })
    describe("successful block model: block to id",()=>{
        const block = Block({blockBy: "userA", blockToUserId: "userB"})
        it("should be a frozen object", ()=>{
            expect(block).to.be.an("object").and.to.be.frozen
        })
        it("should have id", ()=>{
            expect(block).to.have.property("_id").and.to.be.a("string")
        })
        it("should have block by", ()=>{
            expect(block).to.have.property("blockBy", "userA")
        })
        it("should have blockTo with user id", ()=>{
            expect(block).to.have.property("blockTo").to.have.property("userId", "userB")
        })
        it("should have block to phone number undefined", ()=>{
            expect(block).to.have.property("blockTo").to.have.property("phoneNumber").to.be.undefined
        })
    })
    describe("successful model: block to user id & phone number", ()=>{
        const block = Block({blockBy: "userA", blockToUserId: "userB", blockToPhone: "01012"})
        it("should be a frozne object", ()=>{
            expect(block).to.be.an("object").and.to.be.frozen
        })
        it("should have _id", ()=>{
            expect(block).to.have.property("_id").and.to.be.a("string")
        })
        it("should have block to with user id", ()=>{
            expect(block).to.have.property("blockTo").to.have.property("userId", "userB")
        })
        it("should have block to with phone number", ()=>{
            expect(block).to.have.property("blockTo").to.have.property("phoneNumber", "01012")
        })
    })
    describe("null checking", ()=>{
        it("should throw error: no block by", ()=>{
            expect(()=>Block({}))
            .to.throw(Error, errorMessage.nullError.blockByMissing.message)
            .with.property("code", errorMessage.nullError.blockByMissing.code)
        })
        it("should throw error: no block to user id", ()=>{
            expect(()=>Block({blockBy: "userA"}))
            .to.throw(Error, errorMessage.nullError.blockToMissing.message)
            .with.property("code", errorMessage.nullError.blockToMissing.code)
        })
    })
    describe("syntax checking", ()=>{
        it("should throw syntax error: block by is not stirng", ()=>{
            expect(()=>Block({blockBy: 10, blockToPhone: "01012345678"}))
            .to.throw(SyntaxError, errorMessage.syntaxError.blockByNotStr.message)
            .with.property("code", errorMessage.syntaxError.blockByNotStr.code)
        })
        it("should throw syntax error: block to user id is not stirng", ()=>{
            expect(()=>Block({blockBy: "UserA", blockToUserId: []}))
            .to.throw(SyntaxError, errorMessage.syntaxError.blockToUidNotStr.message)
            .with.property("code", errorMessage.syntaxError.blockToUidNotStr.code)
        })
        it("should throw syntax error: block to phone number is not string", ()=>{
            expect(()=>Block({blockBy: "userA", blockToPhone: 1}))
            .to.throw(SyntaxError, errorMessage.syntaxError.blockToPnoNotStr.message)
            .with.property("code", errorMessage.syntaxError.blockToPnoNotStr.code)
        })
    })
})