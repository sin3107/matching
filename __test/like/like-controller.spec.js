import { expect, use } from "chai";
import chaiThings from 'chai-things'
import { getLikeMatchings, getLikes, postLike } from "../../controllers/like-controller.js";
import { likeDb, makeDb } from "../../db-handler/index.js";
import { Like } from "../../models/index.js";
use(chaiThings)

let userA, userB, userC
describe("post like controller", ()=>{
    before(async()=> {
        const db = await makeDb(),
        cursor = db.collection('user').aggregate([{$sample: {size:3}}]),
        docs = [];
        await cursor.forEach(item => docs.push(item._id));
        userA = docs[0];
        userB = docs[1];
        userC = docs[2]? docs[2]: docs[0];
    })
    after(()=> likeDb.deleteLikeMatchingByUser(userA))
    it("must return 201 - send like ", async()=>{
        const httpRequest = {
            body: {
                likeFrom: userA,
                likeTo: userB
            }
        }
        const httpResponse = await postLike(httpRequest);
        expect(httpResponse).to.have.property("statusCode", '201')
        && expect(httpResponse).to.have.property("body")
        .to.haveOwnProperty("matching", false)
    })
    it('must return 400 - send like in 7 days', async ()=>{
        const httpRequest = {
            body: {
                likeFrom: userA,
                likeTo: userB
            }
        }
        const httpResponse = await postLike(httpRequest);
        expect(httpResponse).to.have.property("statusCode", '400')
        && expect(httpResponse).to.have.property("body")
    })
    it("must return 201 - matching", async()=>{
        const httpRequest = {
            body: {
                likeFrom: userB,
                likeTo: userA,
            }
        }
        const httpResponse = await postLike(httpRequest);
        expect(httpResponse).to.have.property("statusCode", '201')
        && expect(httpResponse).to.have.property("body")
        .to.haveOwnProperty('matching', true)
    })
})
describe('get likes controller', () => {
    before(async()=> {
        await likeDb.insertLike(Like({likeFrom: userA, likeTo: userB}))
        await likeDb.insertLike(Like({likeFrom: userC, likeTo: userA}))
    })
    after(()=> likeDb.deleteLikeOfUser(userA))
    it('must return 200 - get list of from and to likes', async()=>{
        const httpRequest = {
            params: {userId: userA}
        },
        httpResponse = await getLikes(httpRequest);
        expect(httpResponse).to.haveOwnProperty('statusCode', '200')
        && expect(httpResponse).to.haveOwnProperty('body').to.have.keys('likeFromList', 'likeToList')
    })
})
describe('get like matching', () => {
    before(async()=> {
        await likeDb.insertLikeMatching(userA, userB)
        await likeDb.insertLikeMatching(userA, userC)
    })
    after(()=> likeDb.deleteLikeMatchingByUser(userA))
    it('should return 200 - get list of matchings', async()=>{
        const httpRequest = {
            params: {userId: userA}
        },
        httpResponse = await getLikeMatchings(httpRequest);
        expect(httpResponse).to.haveOwnProperty('statusCode', '200')
        && expect(httpResponse).to.haveOwnProperty('body').to.haveOwnProperty('matchings')
        .to.be.an('array').to.be.lengthOf(2)
    })
})
