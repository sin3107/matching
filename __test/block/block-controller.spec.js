import { expect } from "chai"
import { postBlock, postUnblock } from "../../controllers/block-controller.js"
import { makeDb } from "../../db-handler/index.js"

let blockBy, blockToUserId, blockToPhone, phoneNotExist = '010111111111'
describe("POST new block", ()=>{
    before(async()=>{
        const db = await makeDb(),
        cursor = db.collection('user').aggregate([{$sample: {size: 2}}]),
        users = [];
        await cursor.forEach(({_id, phoneNumber}) => users.push({_id, phoneNumber}))
        blockBy = users[0]._id
        blockToUserId = users[1]._id
        blockToPhone = users[0].phoneNumber
    })
    it("should block user based on user id", async()=>{
        const httpRequest = {body:{blockBy, blockToUserId}}
        const httpResponse = await postBlock(httpRequest);
        expect(httpResponse).to.have.property('statusCode', '201')
        && expect(httpResponse).to.have.property('body', null)
    })
    it('should block phone number', async()=>{
        const httpResponse = await postBlock({body: {blockBy, blockToPhone}})
        expect(httpResponse).to.haveOwnProperty('statusCode', '201')
        && expect(httpResponse).to.haveOwnProperty('body', null)
    })
})
describe("POST unblock", ()=>{
    it("should unblock user based on user id", async()=>{
        const httpRequest = {body:{blockBy, blockToUserId}};
        const httpResponse = await postUnblock(httpRequest);
        expect(httpResponse).to.have.property('statusCode', '200')
        && expect(httpResponse).to.have.property('body', null)
    })
    it('should unblock phone number', async()=>{
        const httpResponse = await postUnblock({body: {blockBy, blockToPhone}})
        expect(httpResponse).to.have.property('statusCode', '200')
        && expect(httpResponse).to.have.property('body', null)
    })
})