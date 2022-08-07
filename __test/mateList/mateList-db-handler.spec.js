import { expect, use } from "chai";
import chaiThings from "chai-things";
import { mateListDb } from "../../db-handler/index.js"
import { MateList } from "../../models/index.js";
use(chaiThings)

const meetMatchingCountField = 'meetMatchingCount',
matchingField = 'matching',
meetStr = 'meet',
communityStr = 'community',
idField = '_id',
usersField = 'users'
describe('mate list db testing', () => {
    const user1 = 'a',
    user2 = 'b'
    after(async()=> {
        const db = await mateListDb.getMateListDb()
        await db.deleteMany({users: user1})
    })
    it('should get mate lsit db', async()=>{
        const db = await mateListDb.getMateListDb();
        expect(db.s.namespace).to.have.property("collection", "mateList");
    })
    it('should inset mate list and return inserted id', async()=>{
        const mateList = MateList({users: [user1, user2], meetMatchingCount: 1}),
        insertedId = await mateListDb.insertMateList(mateList)
        expect(insertedId).to.be.a('string').to.be.equal(mateList._id)
    })
    it('should inc meet matching count', async()=> {
        const value = await mateListDb.incMeetMatchingCount(user1, user2)
        expect(value).to.haveOwnProperty(meetMatchingCountField, 2)
    })
    it('should add meet matching', async()=>{
        const value = await mateListDb.addMeetMatching(user1, user2);
        expect(value).to.haveOwnProperty(matchingField).to.include(meetStr)
    })
    it('should add another meet matching count, but in the matching there is only one meet', async()=> {
        const value = await mateListDb.addMeetMatching(user2, user1);
        expect(value).to.haveOwnProperty(matchingField).to.have.members([meetStr])
    })
    it('should add community matching', async()=>{
        const value = await mateListDb.addCommunityMatching(user1, user2)
        expect(value).to.haveOwnProperty(matchingField).to.include(communityStr)
    })
    it('should add another community matching, but in the array only one community', async()=>{
        const value = await mateListDb.addCommunityMatching(user2, user1)
        expect(value).to.haveOwnProperty(matchingField).to.have.members([meetStr, communityStr])
    })
    it('should get meet matching cont between two user', async()=>{
        const meetMatchingCount = await mateListDb.getMeetMatchingCount(user1, user2)
        expect(meetMatchingCount).to.be.a("Number", 2)
    })
    it('should get undefined when find meet matching count between two user', async()=>{
        const noMatch = await mateListDb.getMeetMatchingCount(user1, 'AF')
        expect(noMatch).to.be.undefined
    })
    it('should find matelist document between two user', async()=>{
        const mateList = await mateListDb.getMateList(user2, user1)
        expect(mateList).to.be.an('object').to.have.keys([idField, usersField,matchingField, meetMatchingCountField ])
        && expect(mateList).to.haveOwnProperty(usersField).to.have.members([user1, user2])
    })
    it('should not get any document since there is no match', async()=> {
        const noMateList = await mateListDb.getMateList('asdfa', user1)
        expect(noMateList).to.be.undefined
    })
    it('should get all mate list by one user', async()=>{
        const mateListArr = await mateListDb.getAllMateListByUser(user1)
        expect(mateListArr).to.be.an("Array")
        && expect(mateListArr).to.include.something.that.haveOwnProperty(usersField)
        && expect(mateListArr[0]).to.haveOwnProperty(usersField).to.include(user1)
    })
    it('should get empty array if user does not have any matching list', async()=>{
        await mateListDb.insertMateList({users: [user1, 'test'], matching: []})
        const noMatch = await mateListDb.getAllMateListByUser('test')
        expect(noMatch).to.be.an("Array").to.be.empty
    })
    it('should delete document between two user', async()=>{
        await mateListDb.deleteOneMateList(user1, user2)
        const checkValue = await mateListDb.getMateList(user1, user2)
        expect(checkValue).to.be.undefined
    })
    it('should delete all document related to one user', async()=>{
        await mateListDb.insertMateList({users: [user1]})
        await mateListDb.insertMateList({users: [user1, user2]})
        await mateListDb.insertMateList({users: [user1, 'adfsj']})
        await mateListDb.deleteAllMateListByUser(user1)
        const checkValue = await mateListDb.getAllMateListByUser(user1)
        expect(checkValue).to.be.an('Array').to.be.empty
    })
})