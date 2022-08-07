import { expect, use } from "chai"
import chaiThings from "chai-things"
import { getMateList } from "../../controllers/mateList-controller.js"
import { blockDb, chatDb, likeDb, makeDb, mateListDb, meetDb } from "../../db-handler/index.js"
import { ChatConversation, Like, MateList, MeetMatching } from "../../models/index.js"
import { block_use_case } from "../../use-cases/handle-block.js"
import { like_use_case } from "../../use-cases/handle-like.js"
import { meet_use_case } from "../../use-cases/handle-meet.js"
use(chaiThings)

const user1 = 'userid1', user2 = 'userId2', user3 = 'userId3'
const meetMatchingCountField = 'meetMatchingCount',
matchingField = 'matching',
meetStr = 'meet',
communityStr = 'community',
idField = '_id',
usersField = 'users'

describe('mate list use case testing', () => {
    before(async()=> {
        const db = (await makeDb()).collection('user')
        await db.insertMany([{
            _id: user1,
            basicProfile:{
                nickname: 'nick1',
                profilePic: 'profilePic1'
            }
        }, {
            _id: user2,
            basicProfile:{
                nickname: 'nick2',
                profilePic: 'profilePic2'
            }
        }, {
            _id: user3,
            basicProfile:{
                nickname: 'nick3'
            }
        }])
    })
    after(async()=>{
        const db = (await makeDb()).collection('user')
        await db.deleteOne({_id: user1})
        await db.deleteOne({_id: user2})
        await db.deleteOne({_id: user3})
    })
    describe('inc meet matching', () => {
        before(async()=> {
            await mateListDb.insertMateList(MateList({users: [user1, user2]}))
            const userId = user1,
            meetArr = [
                {userId: user2},
                {userId: user3}
            ]
            await meet_use_case.incCount(userId, meetArr)
        })
        after(async()=> {
            await mateListDb.deleteAllMateListByUser(user1)
        })
        it('should have inclemented meet matching count by 2- user2', async()=>{
            const check = await mateListDb.getMateList(user1, user2)
            expect(check).to.haveOwnProperty(meetMatchingCountField, 2)
        })
        it('should have meet matching of user1 and user2 - count 1', async()=>{
            const check = await mateListDb.getMateList(user1, user3)
            expect(check).to.haveOwnProperty(meetMatchingCountField, 1)
        })
    })
    describe('add meet like matching', () => {
        before(async()=>{
            await mateListDb.insertMateList(MateList({users: [user1, user2]}))
            await likeDb.insertLike(Like({likeFrom: user1, likeTo: user2}))
            const body = {likeFrom: user2, likeTo: user1}
            await like_use_case.sendLike(body)
        })
        after(async()=>{
            await likeDb.deleteLikeOfUser(user1)
            await mateListDb.deleteOneMateList(user1, user2)
        })
        it('should have meet like matching in mate list', async()=>{
            const check = await mateListDb.getMateList(user1, user2)
            expect(check).to.haveOwnProperty(matchingField).to.have.members([meetStr])
        })
    })
    describe('add community like matching', () => {
        
    })
    describe('get mate list', () => {
        let httpResponse;
        before(async()=>{
            await mateListDb.insertMateList(MateList({users: [user1, user2], matching: [meetStr], meetMatchingCount: 3}))
            await mateListDb.insertMateList(MateList({users: [user1, user3]}))
            httpResponse = await getMateList({body: {user: {_id: user1}}, params: {userId: user1}})
        })
        after(async()=>{
            await mateListDb.deleteAllMateListByUser(user1)
        })
        it('should get status code of 200', async()=>{
            expect(httpResponse).to.haveOwnProperty('statusCode', '200')
        })
        it('should have mate list in body', async()=>{
            expect(httpResponse).to.haveOwnProperty('body').to.haveOwnProperty('mateList').to.be.an("array")
        })
        it('should have mateList object in array with userInfo', async()=>{
            expect(httpResponse.body.mateList).to.include.something.that.have.keys(['matching', 'userInfo'])
        })
    })
    describe('block - delete mate list', () => {
        before(async()=>{
            await meetDb.insertMeetMatching(MeetMatching({userId: user1, location: {type: "point", coordinates: [10, 20]}, timestamp: new Date(), meet: [{userId: user2}, {userId: user3}]}))
            await meetDb.insertMeetMatching(MeetMatching({userId: user2, location: {type: "point", coordinates: [10, 20]}, timestamp: new Date(), meet: [{userId: user1}]}))
            await mateListDb.insertMateList(MateList({users: [user1, user2], matching: [meetStr]}))
            await chatDb.insertConversation(ChatConversation({participants: [user1, user2]}))

            await block_use_case.addBlock({blockBy: user1, blockToUserId: user2})
        })
        after(async()=>{
            await blockDb.unBlockUserId(user1, user2)
            await meetDb.deleteMeetMatchingByUser(user1)
        })
        it('should have deleted mate list', async()=>{
            const check = await mateListDb.getMateList(user1, user2)
            expect(check).to.be.undefined
        })
    })
})


/**
 * like matching 완료 시 추가하기
 * meet 만날 시 마다 누적 추가하기
 * 게시판 매칭 완료 시 추가하기
 * 
 * 그런데 이미 크로스에서 좋아요 서로 주고 받은 사람이 게시판에서 뭔가 또 좋아요를 주고 받는 거.. 안 이상한가?
 * 허... 그냥 그래라 해...
 */