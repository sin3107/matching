import { expect, use } from 'chai';
import {likeDb, userDb} from '../../db-handler/index.js'
import { Like } from '../../models/index.js';
import chaiThings from 'chai-things'
use(chaiThings)

let userA = 'userA', userB = 'userB', userC = 'userC', userD = 'userD'
describe("like db handling", ()=>{
    it("must get collection db", async()=>{
        const db = await likeDb.getLikeDb();
        expect(db.s.namespace).to.have.property("collection", "like");
    });
    it("must creat index that expires in 7 days", async()=>{
        await likeDb.createIndexesLikeDb();
        const db = await likeDb.getLikeDb(),
        indexes = await db.indexes();
        expect(indexes).to.be.an('array').to.be.lengthOf(2)
        && expect(indexes[1]).to.deep.include({name: "timestamp_1"})
    } )
    describe('inserting like', () => {
        let like, savedId
        before(async()=> {
            like = Like({likeFrom: userA, likeTo: userB});
            savedId = await likeDb.insertLike(like)
        })
        after(()=> likeDb.deleteLikeOfUser(userA))
        it("insert like", ()=>{
            expect(savedId).to.be.a('string', like._id)
        })
    })
    
    describe("find like", ()=>{
        let savedLiked =[];
        before(async()=> {
            savedLiked[savedLiked.length] = await likeDb.insertLike(Like({likeFrom: userC, likeTo: userA}))
            savedLiked[savedLiked.length] = await likeDb.insertLike(Like({likeFrom: userA, likeTo: userB}))
            savedLiked[savedLiked.length] = await likeDb.insertLike(Like({likeFrom: userA, likeTo: userD}))
        })
        after(()=> likeDb.deleteLikeOfUser(userA))
        it(`must return all ${userA}'s like list`, async()=>{
            const likeList = await likeDb.findLikeOfUser(userA);
            expect(likeList).to.be.an('array').to.include.something.that.have.own.property('likeFrom', userA)
        });
        it(`must return all like from ${userA}`, async()=>{
            const likeList = await likeDb.findLikeFrom(userA);
            expect(likeList).to.be.an('array').to.haveOwnProperty('0')
            .to.deep.include({likeFrom: userA})
        })
        it(`must return all like to to ${userA}`, async()=>{
            const likeList = await likeDb.findLikeTo(userA)
            expect(likeList).to.be.an('array').to.haveOwnProperty('0')
            .to.deep.include({likeTo: userA})
        });
        it(`must return one document: {likeFrom: ${userA}, likeTo: ${userD}}`, async()=>{
            const like = await likeDb.findLike({from: userA, to: userD});
            expect(like).to.be.an('object')
            .to.include({likeFrom: userA, likeTo: userD})
        })
        it("must return null : no match", async()=>{
            const likeList =await likeDb.findLike({from: "Y", to: "Z"});
            expect(likeList).to.be.undefined;
        });
    })    
    describe('delete like', ()=>{
        before(async()=> {
            await likeDb.insertLike(Like({likeFrom: userA, likeTo: userB}))
            await likeDb.insertLike(Like({likeFrom: userC, likeTo: userA}))
            await likeDb.insertLike(Like({likeFrom: userB, likeTo: userC}))
        })
        it(`must delete one like ${userA} -> ${userB}`, async()=>{
            await likeDb.deleteLike(userA, userB);
            const checkDelete = await likeDb.findLike({from: userA, to: userB})
            expect(checkDelete).to.be.undefined
        })
        it(`must delet all document of ${userC}`, async()=>{
            await likeDb.deleteLikeOfUser(userC);
            const checkDeletes = await likeDb.findLikeOfUser(userC)
            expect(checkDeletes).to.be.null
        })
    })
    describe('like matchig', () => {
        before(async()=>{
            await likeDb.insertLikeMatching(userA, userC);
            await likeDb.insertLikeMatching(userC, userD);
            await likeDb.insertLikeMatching(userC, userB)
        })
        it("should return inserted id", async()=>{
            const insertedId = await likeDb.insertLikeMatching(userA, userB);
            expect(insertedId).to.be.an('object')
        })
        it(`should find like matching with ${userA} and ${userB}`, async()=>{
            const likeMatching = await likeDb.findLikeMatching(userA, userB);
            expect(likeMatching).to.be.an('object').to.haveOwnProperty('matching')
            .to.include.something.that.deep.equals({userId: userA})
        }) 
        it(`should find all like matching by ${userA}`, async()=>{
            const likeMatchings = await likeDb.findLikeMatchingByUser(userA);
            expect(likeMatchings).to.be.an('array')
            && expect(likeMatchings[0]).to.haveOwnProperty('matching')
            .to.include.something.that.deep.equals({userId: userA})
        })
        it(`should delete one like matching ${userA} and ${userB}`, async()=>{
            await likeDb.deleteLikeMatching(userA, userB);
            const checkDelete = await likeDb.findLikeMatching(userA, userB);
            expect(checkDelete).to.be.undefined
        })
        it(`should delete all like matching by one user - ${userC}`, async()=>{
            await likeDb.deleteLikeMatchingByUser(userC);
            const checkDelete = await likeDb.findLikeMatchingByUser(userC);
            expect(checkDelete).to.be.null;
        })
    })
})