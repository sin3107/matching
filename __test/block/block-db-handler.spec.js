import { expect, use } from "chai";
import chaiThings from 'chai-things';
import { blockDb } from "../../db-handler/index.js"
import { Block } from "../../models/index.js";
use(chaiThings)

describe("get db", ()=>{
    it("should get block db", async()=>{
        const db = await blockDb.getBlockDb();
        expect(db.s.namespace).to.have.property("collection", "block");
    })
})
describe("save data", ()=>{
    let id;
    after(async()=> await blockDb.delteManyBlock(id))
    it("should save block", async()=>{
        const block = Block({blockBy: 'userA', blockToPhone: "01012345678"})
        const savedId = await blockDb.insertBlock(block);
        expect(savedId).to.be.a("string", block._id)
        id = savedId
    })
})
describe("find block data", ()=>{
    const user1 = "userA", user2 = "userB", user3= "user3"
    beforeEach(async()=> {
        await blockDb.insertBlock(Block({blockBy: user1, blockToUserId: user2}))
        await blockDb.insertBlock(Block({blockBy: user3, blockToUserId: user1}))
        await blockDb.insertBlock(Block({blockBy: user1, blockToPhone: '01012345678'}))
    })
    afterEach(async()=> await blockDb.delteManyBlock(user1))
    describe('testing get block between two user', () => {
        it("should get data where userA and user B have blocked", async ()=>{
            const blocked = await blockDb.getBlockBetweenTwoUser(user1, user2)
            expect(blocked).to.be.an("object").and.have.property("blockBy", user1)
            || expect(blocked).to.be.an("object").and.have.property("blockBy", user2)
        })
        it("should return undefined when no user found", async()=>{
            const falseUserid1 = "drivers", falseUserId2= "license",
            blocked = await blockDb.getBlockBetweenTwoUser(falseUserid1, falseUserId2);
            expect(blocked).to.be.undefined
        })
    })
    describe('testing get all block list by user', () => {
        it("should get all data where userA included", async()=>{
            const blockList = await blockDb.getAllBlockListByUser(user1);
            expect(blockList).to.be.an("array").to.be.lengthOf(3)
        })
        it("should return null when no document found: getAllBlockListByUser", async()=>{
            const falseUserId = "hope ur ok",
            blockList = await blockDb.getAllBlockListByUser(falseUserId);
            expect(blockList).to.be.null;
        })
    })
    describe('testing get block by one user list', () => {
        it("should get all data where user a blocked other users", async()=>{
            const blockList = await blockDb.getBlockedByOneUserList(user1);
            expect(blockList).to.be.an('array')
            .to.be.lengthOf(2)
            .to.include.something.that.haveOwnProperty('blockBy', user1)
        })
        it('should return null if nothing found', async()=>{
            const fakeUserId = 'fakeUserId',
            nullList = await blockDb.getBlockedByOneUserList(fakeUserId);
            expect(nullList).to.be.null;
        })
    })
    describe('testing get block to user', () => {
        it("should get one document - where user a has blocked user b", async()=>{
            const block = await blockDb.getBlockToUser(user1, user2);
            expect(block).to.be.an("object")
            .to.haveOwnProperty('blockTo').with.property('userId', user2)
        })
        it("should get one document where user1 has blocked 0101234578", async()=>{
            const block =await blockDb.getBlockToPhone(user1, '01012345678')
            expect(block).to.be.an('object')
            .to.haveOwnProperty('blockTo').with.property('phoneNumber', '01012345678')
        })
    })
    
    
})
describe("update block data", ()=>{
    const userA = 'userA', phoneNumber = '01012345678', userB = 'userB', userC='userC'
    before(async()=> {
        await blockDb.insertBlock(Block({blockBy: userA, blockToPhone: phoneNumber}))
        await blockDb.insertBlock(Block({blockBy: userC, blockToPhone: phoneNumber}))
    })
    after(async()=> await blockDb.delteManyBlock(userB))
    it(`should find where blockTo phone number is ${phoneNumber}, and update user id to ${userB}`, async()=>{
        await blockDb.updateUserId(phoneNumber, userB);
        const checkUpdate = await blockDb.getAllBlockListByUser(userB)
        expect(checkUpdate).to.be.an('array')
        .to.be.lengthOf(2)
        .to.haveOwnProperty('0').to.haveOwnProperty('blockTo').to.deep.include({userId: userB})
    })
})
describe("delete block data", ()=>{
    const userA = 'userA', userB='userB', phoneNumber="01011112222", userC = 'userC'
    before(async()=> {
        await blockDb.insertBlock(Block({blockBy: userA, blockToUserId: userB}))
        await blockDb.insertBlock(Block({blockBy: userA, blockToPhone: phoneNumber}))
        await blockDb.insertBlock(Block({blockBy: userC, blockToUserId: userA}))
    })
    it(`should delete data where ${userA} blocked ${userB}`, async()=>{
        await blockDb.unBlockUserId(userA, userB);
        const block = await blockDb.getBlockBetweenTwoUser(userA, userB);
        expect(block).to.be.undefined
    })
    it(`should delete block where ${userA} blocked ${phoneNumber} phonenubmer`, async()=>{
        await blockDb.unBlockPhone(userA, phoneNumber);
        const block = await blockDb.getBlockedByOneUserList(userA)
        expect(block).to.be.null
    })
    it(`should delete all userA's data`, async()=>{
        await blockDb.delteManyBlock(userA);
        const checkDelete = await blockDb.getAllBlockListByUser(userA)
        console.log(checkDelete)
    })
})