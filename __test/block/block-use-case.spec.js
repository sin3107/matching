import { expect, use } from"chai";
import chaiThings from 'chai-things'
import errMsg from '../../helper/error.js'
import { block_use_case } from "../../use-cases/handle-block.js";
import { blockDb, chatDb, likeDb, makeDb, mateListDb, meetDb } from "../../db-handler/index.js";
import { Block, ChatConversation, ChatMessage, Like, MateList, MeetMatching, MeetRanking } from "../../models/index.js";
import { cryptoHandler } from "../../helper/crypto.js";
use(chaiThings)

const user1 ='testing-block-usecase-user1' , 
user2= 'testing-block-usecase-user2', 
user3= 'testing-block-usecase-user3', 
user4= 'testing-block-usecase-user4',
user5= 'testing-block-usecase-user5',
user6= 'testing-block-usecase-user6',
user7= 'testing-block-usecase-user7',
phoneNumber = '01055555555',
userNotExist = 'testing-not-exist-block-usecase',
phoneNotExist = '00011111111',
convId1 = 'testing-block-usecase-conv1',
convId2 = 'testing-block-usecase-conv2',
convId3 = 'testing-block-usecase-conv3'
describe('차단 테스트', ()=>{
    before(async()=>{
        const phoneEncrypted = cryptoHandler.encrypt(phoneNumber),
        userDb = (await makeDb()).collection("user"),
        users = [user1, user2, user3, user4, user6, user7]
        await userDb.deleteMany({_id: {$in: [user1, user2, user3, user4, user5, user6, user7]}})
        await Promise.all([
            userDb.insertOne({_id: user5, phoneNumber: phoneEncrypted, basicProfile: {nickname: 'user5n', profilePic: 'user5p'}}),
            userDb.insertMany(users.map(_id => {return {_id, basicProfile: {nickname: 'nicknick', profilePic: 'picpic'}}}))
        ])
    })
    after(async()=>{
        const userDb = (await makeDb()).collection('user')
        await userDb.deleteMany({_id: {$in: [user1, user2, user3, user4, user5, user6, user7]}})
    })
    describe("차단하기 테스트 - 유저 차단", ()=>{
        before(async()=> await insertData(user1, user2, convId1))
        before(async ()=> await block_use_case.addBlock([{blockBy: user1, blockToUserId: user2}]))
        after(async()=> await deleteData(user1, user2, convId1))
        
        it('차단 기록이 저장되어 짐', async()=>{
            const block = await blockDb.getAllBlockListByUser(user1)
            expect(block).to.be.an("array").to.be.lengthOf(1)
            && expect(block).to.include.something.that.have.property('blockBy', user1)
            && expect(block).to.include.something.that.have.property('blockToUserId', user2)
            && expect(block).to.include.something.that.have.property('blockToPhone', null)
        })
        it('크로스 기록 다 지워졌는지 확인', async()=>{
            const meetMatchingUser1 = await meetDb.getMatchingUsers(user1),
            meetMatchingUser2 = await meetDb.getMatchingUsers(user2)
            expect(meetMatchingUser1).to.be.empty
            && expect(meetMatchingUser2).to.be.empty
        })
        it('랭킹 기록 다 지워졌는지 확인', async()=>{
            const ranking1 = await meetDb.getRankingUsers(user1, 'meet'),
            ranking2 = await meetDb.getRankingUsers(user2, 'meet')
            expect(ranking1).to.be.empty
            && expect(ranking2).to.be.empty
        })
        it('친구해요 기록 다 지워졌는지', async()=>{
            const like1 = await likeDb.findAnyLike({from: user1, to: user2}),
            like2 = await likeDb.findAnyLike({from: user2, to: user1})
            expect(like1).to.be.undefined
            && expect(like2).to.be.undefined
        })
        it('채팅 기록 다 지워졌는지', async()=>{
            const conv = await chatDb.getAConversation(convId1),
            messages1 = await chatDb.getMessages({userId: user1, conversaionId: convId1, timestamp: new Date()}),
            messages2 = await chatDb.getMessages({userId: user2, conversaionId: convId1, timestamp: new Date()})
            expect(conv).to.be.undefined
            && expect(messages1).to.be.empty
            && expect(messages2).to.be.empty
        })
        it('메이트리스트 status: false 인지', async()=>{
            const db = await mateListDb.getMateListDb(),
            query = { users: { $all: [user1, user2] } },
            mate = await db.findOne(query)
            expect(mate).to.haveOwnProperty('status', false)
        })
    })
    describe('차단하기 테스트 - 폰 번호 차단, 유저 없음', ()=>{
        before(async()=> await block_use_case.addBlock([{blockBy: user3, blockToPhone: phoneNotExist}]))
        after(async()=> {
            const phoneEncrypted = cryptoHandler.encrypt(phoneNotExist)
            await blockDb.unBlockPhone(user3, phoneEncrypted)
        })

        it('차단 기록 저장 - user id empty여야 함', async()=>{
            const block = await blockDb.getAllBlockListByUser(user3),
            phoneEncrypted = cryptoHandler.encrypt(phoneNotExist)
            expect(block).to.be.an("array").to.be.lengthOf(1)
            && expect(block[0]).to.have.property('blockBy', user3)
            && expect(block[0]).to.have.property('blockToUserId', null)
            && expect(block[0]).to.have.property('blockToPhone', phoneEncrypted)
        })
    })
    describe('차단하기 테스트 - 폰 번호 차단, 유저 존재', () => { 
        before(async()=> await insertData(user4, user5, convId2))
        before(async()=> await block_use_case.addBlock([{blockBy: user4, blockToPhone: phoneNumber}]))
        after(async()=> await deleteData(user4, user5, convId2))

        it('차단 저장되어 있음, user Id & phone number', async()=>{
            const block = await blockDb.getAllBlockListByUser(user4),
            phoneEncrypted = cryptoHandler.encrypt(phoneNumber)
            expect(block).to.be.an("array").to.be.lengthOf(1)
            && expect(block[0]).to.haveOwnProperty('blockBy', user4)
            && expect(block[0]).to.have.property('blockToUserId', user5)
            && expect(block[0]).to.have.property('blockToPhone', phoneEncrypted)
        })
        it('크로스 기록 다 지워졌는지 확인', async()=>{
            const meetMatchingUser1 = await meetDb.getMatchingUsers(user4),
            meetMatchingUser2 = await meetDb.getMatchingUsers(user5)
            expect(meetMatchingUser1).to.be.empty
            && expect(meetMatchingUser2).to.be.empty
        })
        it('랭킹 기록 다 지워졌는지 확인', async()=>{
            const ranking1 = await meetDb.getRankingUsers(user4, 'meet'),
            ranking2 = await meetDb.getRankingUsers(user5, 'meet')
            expect(ranking1).to.be.empty
            && expect(ranking2).to.be.empty
        })
        it('친구해요 기록 다 지워졌는지', async()=>{
            const like1 = await likeDb.findAnyLike({from: user4, to: user5}),
            like2 = await likeDb.findAnyLike({from: user5, to: user4})
            expect(like1).to.be.undefined
            && expect(like2).to.be.undefined
        })
        it('채팅 기록 다 지워졌는지', async()=>{
            const conv = await chatDb.getAConversation(convId1),
            messages1 = await chatDb.getMessages({userId: user4, conversaionId: convId1, timestamp: new Date()}),
            messages2 = await chatDb.getMessages({userId: user5, conversaionId: convId1, timestamp: new Date()})
            expect(conv).to.be.undefined
            && expect(messages1).to.be.empty
            && expect(messages2).to.be.empty
        })
        it('메이트리스트 status: false 인지', async()=>{
            const db = await mateListDb.getMateListDb(),
            query = { users: { $all: [user4, user5] } },
            mate = await db.findOne(query)
            expect(mate).to.haveOwnProperty('status', false)
        })
     })
    describe('차단 풀기 테스트', () => { 
        before(async()=>{
            await mateListDb.insertMateList(MateList({users: [user6, user7]}))
            await blockDb.insertBlock(Block({blockBy: user6, blockToUserId: user7}))
            await block_use_case.unblock([{blockBy: user6, blockToUserId: user7}])
        })
        // after(async()=> await blockDb.unBlockUserId(user6, user7))
        it('차단 풀어야', async()=>{
            const block = await blockDb.getAllBlockListByUser(user6)
            expect(block).to.be.null
        })
        it('메이트리스트 복구 되어야', async()=>{
            const mate = await mateListDb.getMateList(user6, user7)
            expect(mate).to.haveOwnProperty('status', true)
        })
     })
     describe('차단 리스트 받기', ()=>{
         before(async()=>{
            await Promise.all([
                blockDb.insertBlock(Block({blockBy: user1, blockToUserId: user2})),
                blockDb.insertBlock(Block({blockBy: user1, blockToPhone: cryptoHandler.encrypt(phoneNotExist)})),
                blockDb.insertBlock(Block({blockBy: user1, blockToPhone: cryptoHandler.encrypt(phoneNumber), blockToUserId: user2})),
                blockDb.insertBlock(Block({blockBy: user1, blockToUserId: user3})),
            ])
         })
         after(async()=>{
            await blockDb.delteManyBlock(user1)
         })
         it("유저 차단 리스트 받아와야 함", async()=>{
             const {status, body: {blockUserList}} = await block_use_case.getBlockList(user1, 'user', 1)
             expect(blockUserList).to.be.an("Array").to.be.lengthOf(2)
             && expect(blockUserList).to.include.something.that.have.keys(["_id", 'userId', 'nickname', 'profileImage'])
             && expect(blockUserList).to.include.something.that.have.property('userId', user3)
         })
         it('지인 차단 리스트 받아와야 함', async()=>{
             const {status, body: {blockToPhoneList}} = await block_use_case.getBlockList(user1, 'phoneNumber', 1)
             expect(blockToPhoneList).to.be.an("Array").to.be.lengthOf(2)
             && expect(blockToPhoneList).to.include.something.that.eq(phoneNumber)
         })
     })
     describe("차단 하기 에러", ()=>{
         describe('전부 실패', ()=>{
            before(async()=>{
                // 이중차단용 데이터 넣기
                await block_use_case.addBlock([{blockBy: user1, blockToUserId: user2}, {blockBy: user1, blockToPhone: phoneNumber}])
            })
            after(async()=>{
                // 이중차단 데이터 지우기
                await blockDb.delteManyBlock(user1)
            })
             it('실패하기', async()=>{
                const blocks = [
                    {blockBy: userNotExist, blockToUserId: user2}, 
                    {blockToPhone: phoneNotExist},
                    {blockBy: user1},
                    {blockBy: user1, blockToUserId: user2},
                    {blockBy: user1, blockToPhone: phoneNumber}
                 ]
                const {status, body} = await block_use_case.addBlock(blocks)
                expect(body).to.haveOwnProperty('failed').to.be.an("array").to.be.lengthOf(5)
             })
         })
         describe("부분 실패", ()=>{
             let body;
            before(async()=> {
                await insertData(user1, user4, convId1)
                const res = await block_use_case.addBlock([
                    {blockBy: user4, blockToUserId: user1},
                    {blockBy: user1, blockToUserId: userNotExist}
                ])
                body = res.body;
            })
            after(async()=> await deleteData(user1, user4, convId1))
            it('failed array 확인 - 1개', ()=>{
                expect(body).to.haveOwnProperty('failed').to.be.an("array").to.be.lengthOf(1)
                .to.include.something.that.deep.equal({
                    block: {blockBy: user1, blockToUserId: userNotExist},
                    err: errMsg.nullError.blockToMissing
                })
            })
            it('크로스 기록 다 지워졌는지 확인', async()=>{
                const meetMatchingUser1 = await meetDb.getMatchingUsers(user4),
                meetMatchingUser2 = await meetDb.getMatchingUsers(user1)
                expect(meetMatchingUser1).to.be.empty
                && expect(meetMatchingUser2).to.be.empty
            })
            it('랭킹 기록 다 지워졌는지 확인', async()=>{
                const ranking1 = await meetDb.getRankingUsers(user4, 'meet'),
                ranking2 = await meetDb.getRankingUsers(user1, 'meet')
                expect(ranking1).to.be.empty
                && expect(ranking2).to.be.empty
            })
            it('친구해요 기록 다 지워졌는지', async()=>{
                const like1 = await likeDb.findAnyLike({from: user4, to: user1}),
                like2 = await likeDb.findAnyLike({from: user1, to: user4})
                expect(like1).to.be.undefined
                && expect(like2).to.be.undefined
            })
            it('채팅 기록 다 지워졌는지', async()=>{
                const conv = await chatDb.getAConversation(convId1),
                messages1 = await chatDb.getMessages({userId: user4, conversaionId: convId1, timestamp: new Date()}),
                messages2 = await chatDb.getMessages({userId: user1, conversaionId: convId1, timestamp: new Date()})
                expect(conv).to.be.undefined
                && expect(messages1).to.be.empty
                && expect(messages2).to.be.empty
            })
            it('메이트리스트 status: false 인지', async()=>{
                const db = await mateListDb.getMateListDb(),
                query = { users: { $all: [user4, user1] } },
                mate = await db.findOne(query)
                expect(mate).to.haveOwnProperty('status', false)
            })
         })
     })
})
function insertData(userId1, userId2, conversationId){
    return Promise.all([
        // 크로스 기록
        meetDb.insertMeetMatching(MeetMatching({userId: userId1, otherUserId: userId2, timestamp: new Date(), coordinates: [0,1]})),
        meetDb.insertMeetMatching(MeetMatching({userId: userId2, otherUserId: userId1, timestamp: new Date(), coordinates: [0, 1]})),
        // 랭킹 기록
        meetDb.insertRanking(MeetRanking({userId: userId1, otherUserId: userId2, meet: 1, spots: 1, meetCount: 2, score: 10, age: 20, gender: 'f', updatedAt: Date.now()})),
        meetDb.insertRanking(MeetRanking({userId: userId2, otherUserId: userId1, meet: 1, spots: 1, meetCount: 2, score: 10, age: 21, gender: 'f', updatedAt: Date.now()})),
        // 친구해요 기록
        likeDb.insertLike(Like({likeFrom: userId1, likeTo: userId2, type: "community"})),
        // 채팅 기록
        chatDb.insertConversation(ChatConversation({_id: conversationId, participants: [userId1, userId2]})),
        chatDb.insertMessage(ChatMessage({conversationId, from: userId1, to: userId2, contentType: 'text', content: "hi"})),
        chatDb.insertMessage(ChatMessage({conversationId, from: userId2, to: userId1, contentType: 'image', content: "https://meet-testing1.s3.ap-northeast-2.amazonaws.com/1644889095250-6dbe706201ef44a79dd9a143e5e985bf.jpg"})),
        // 메이트 기록
        mateListDb.insertMateList(MateList({users: [userId1, userId2]})),
    ])
}
async function deleteData(userId1, userId2, conversaionId){
    const xDb = await meetDb.getMeetMatchingDb(),
    rDb = await meetDb.getRankingDb(),
    lDb = await likeDb.getLikeDb(),
    cDb = await chatDb.getConversationDb(),
    mDb = await chatDb.getMessageDb(),
    mtDb = await mateListDb.getMateListDb(),
    bDb = await blockDb.getBlockDb()
    return Promise.all([
        xDb.deleteMany({$or: [{userId: userId1, otherUserId: userId2}, {userId: userId2, otherUserId: userId1}]}),
        rDb.deleteMany({$or: [{userId: userId1, otherUserId: userId2}, {userId: userId2, otherUserId: userId1}]}),
        lDb.deleteMany({$or: [{likeFrom: userId1, likeTo: userId2}, {likeFrom: userId2, likeTo: userId1}]}),
        cDb.deleteOne({_id: conversaionId}),
        mDb.deleteMany({conversaionId}),
        mtDb.deleteMany({users: {$all: [userId1, userId2]}}),
        bDb.deleteMany({$or: [{blockBy: userId1}, {blockBy: userId2}]})
    ])
}