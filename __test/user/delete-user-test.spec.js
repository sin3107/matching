import { expect } from "chai"
import { makeDb, articleDb, blockDb, chatDb, likeDb, mateListDb, meetDb, deletedUserDb } from "../../db-handler/index.js"
import { cryptoHandler } from "../../helper/crypto.js"
import { Block, GeoJson, MateList, MeetHidden, MeetMatching, MeetRanking } from "../../models/index.js"
import { user_use_cases } from "../../use-cases/handle-user.js"

const _id = 'delete-user-test',
phoneNumber = '00011112222',
phoneEncrypted = cryptoHandler.encrypt(phoneNumber),
otherPhone = '00012121212',
otherPhoneEncrypted = cryptoHandler.encrypt(otherPhone),

user1 = 'delete-user-test-user-1',
user2 = 'delete-user-test-user-2',
user3 = 'delete-user-test-user-3',
user4 = 'delete-user-test-user-4',
users = [ _id, user1, user2, user3, user4]

const myMatchingArticle = 'delete-user-testing-article-1',
myCommArticle = 'delete-user-testing-article-2',
otherMatchingArticle = 'delete-user-testing-article-3',
otherCommArticle = 'delete-user-testing-article-4'

const articleMatchingType = 'matching',
articleCommunityType = 'community'

const conv1 = 'delete-user-testing-conv1',
conv2 = 'delete-user-testing-conv2'

describe('유저 탈퇴하기 테스트', () => { 
    before(async()=>{
        await deleteAllData()
        const userDb = (await makeDb()).collection('user')
        await userDb.insertMany([
            {
                _id: _id,
                phoneNumber: phoneEncrypted,
                basicProfile: { profilePic: 'https://meet-testing1.s3.ap-northeast-2.amazonaws.com/1645684137076-b338c1b1262c43e88dc71cbe3a5b7722.jpg'},
                detailProfile: {
                    mainPic: 'https://meet-testing1.s3.ap-northeast-2.amazonaws.com/1645684171852-a6fa2ff9f3e844b0ba2ea2456ba69b1f.jpg',
                    subPic: 'https://meet-testing1.s3.ap-northeast-2.amazonaws.com/1645684171853-cd9d6266c1744d41a63db0e29c68c27e.jpg',
                    pictures: [
                        'https://meet-testing1.s3.ap-northeast-2.amazonaws.com/1645684171854-2137f3e7a08444088c5623256df2f93c.jpg',
                        'https://meet-testing1.s3.ap-northeast-2.amazonaws.com/1645684171858-2ce09a5416fd48fd9a67006053a3ddfc.jpg',
                        'https://meet-testing1.s3.ap-northeast-2.amazonaws.com/1645684171859-6e8b78c6f9b847cfaa6bd04524d716c4.png'
                    ]
                },
                toonify: [
                    [   'https://meet-testing1.s3.ap-northeast-2.amazonaws.com/1645684171860-ca2025373813426da2dc08a3521de0a7.png',
                        'https://meet-testing1.s3.ap-northeast-2.amazonaws.com/1645684171863-5556bb8fe8964c458e8f39ad9dd6e177.png',
                        'https://meet-testing1.s3.ap-northeast-2.amazonaws.com/1645684171863-841d0fd016c24751b5b89f25b1f2bfc3.png',
                        'https://meet-testing1.s3.ap-northeast-2.amazonaws.com/1645684171866-c2c6de60994f4578a81e4860e01edb1b.png',
                    ],
                ]
            },
            { _id: user1 },
            { _id: user2 },
            { _id: user3 },
            { _id: user4 }
        ])

        // 샘플 데이터 넣기
        await Promise.all([
            // 게시글
            insertArticleData(myMatchingArticle, myCommArticle, otherMatchingArticle, otherCommArticle),
            // 차단
            insertBlockData(),
            // 채팅
            insertChatData(),
            // 친구해요
            insertLikeData(),
            // 메이트리스트
            insertMateListData(),
            // 크로스
            insertMeetData(),
        ])

        await user_use_cases.deleteUser(_id);
    })

    after(async()=>await deleteAllData())
    describe('유저 지우기 및 옮기기 테스트', () => { 
        it("유저 디비에서 유저 지우기", async()=>{
            const user = await ((await makeDb()).collection('user')).findOne({_id})

            expect(user).to.be.undefined;
        })

        it('탈퇴 유저 db에서 유저 찾기', async()=>{
            const user = await (await deletedUserDb.getDb()).findOne({_id})
            
            expect(user).to.be.an("Object")
            .to.haveOwnProperty("_id", _id)
            && expect(user).to.haveOwnProperty('phoneNumber', phoneEncrypted)
        })
     })

    describe('크로스 지우기 테스트', () => { 
        it("내 동선 다 지우기", async()=>{
            const myGeoData = await (await meetDb.getAllGeoJsonDb()).find({userId: _id}).count()
            
            expect(myGeoData).to.be.equal(0)
        })

        it("매칭 데이터 다 지우기", async()=>{
            const meetMatchings = await (await meetDb.getMeetMatchingDb()).find({$or: [{userId: _id}, {otherUserId: _id}]}).count()

            expect(meetMatchings).to.be.equal(0)
        })

        it("랭킹 데이터 다 지우기", async()=>{
            const rankings = await (await meetDb.getRankingDb()).find({$or: [{userId: _id}, {otherUserId: _id}]}).count()

            expect(rankings).to.be.equal(0)
        })

        it('히든 데이터 다 지우기', async()=>{
            const hiddens = await (await meetDb.getHiddenDb()).find({$or: [{userId: _id}, {otherUserId: _id}]}).count();

            expect(hiddens).to.be.equal(0)
        })
     })
    
    describe('메이트 리스트 지우기 테스트', () => { 
        it('모든 메이트리스트 지우기', async()=>{
            const mateList = await (await mateListDb.getMateListDb()).find({users: _id}).count()

            expect(mateList).to.be.equal(0);
        })       
     })

    describe('친구해요 지우기 테스트', ()=>{
        it('모든 친구해요 지우기', async()=>{
            const likes = await (await likeDb.getLikeDb()).find({$or: [ {likeFrom: _id}, {likeTo: _id} ]}).count()

            expect(likes).to.be.equal(0);
        })
    })

    describe('채팅 지우기 테스트', () => { 
        it('s3 파일 다 지우기 -> 직접 확인하기', ()=>{})

        it('모든 채팅방 다 지우기', async()=>{
            const convs = await (await chatDb.getConversationDb()).find({participants: _id}).count()
            
            expect(convs).to.be.equal(0)
        })

        it('모든 메시지 다 지우기', async()=>{
            const msgs = await (await chatDb.getMessageDb()).find({conversationId: {$in: [conv1, conv2]}}).count()

            expect(msgs).to.be.equal(0)
        })
     })

    describe('차단 지우기 테스트', () => { 
        it("내가 차단한 block 다 지우기", async()=>{
            const blocks = await (await blockDb.getBlockDb()).find({blockBy: _id}).count()

            expect(blocks).to.be.equal(0)
        })

        it('내가 차단된 유저 차단 다 지우기', async()=>{
            const blocks = await (await blockDb.getBlockDb()).find({blockToUserId: _id, blockToPhone: null}).count()

            expect(blocks).to.be.equal(0)
        })

        it("내가 차단된 지인 차단 -> userId만 지우고 남기기", async()=>{
            const blocks = await (await blockDb.getBlockDb()).find({blockToPhone: phoneEncrypted}).toArray()

            expect(blocks).to.be.lengthOf(1)
            && expect(blocks[0]).to.haveOwnProperty('blockToPhone', phoneEncrypted)
            && expect(blocks[0]).to.haveOwnProperty('blockToUserId', null)
        })
     })

    describe('게시판 지우기 테스트', () => {
        it('게시판 관련 s3 파일 지우기 테스트', ()=>{
            // 손수 확인 하기
        })

        it('내가 쓴 게시글 관련 댓글 다 지우기', async()=>{
            const cdb1 = await articleDb.getCommentDbByType(articleMatchingType),
            cdb2 = await articleDb.getCommentDbByType(articleCommunityType),

            comments1 = await cdb1.find({postId: myMatchingArticle}).count(),
            comments2 = await cdb2.find({postId: myCommArticle}).count()

            expect(comments1).to.be.equal(0)
            && expect(comments2).to.be.equal(0)
        })

        it("내가 쓴 게시글 관련 좋아요 다 지우기", async()=>{
            const ldb1 = await articleDb.getLikeDbByType(articleMatchingType),
            ldb2 = await articleDb.getLikeDbByType(articleCommunityType),

            likes1 = await ldb1.find({postId: myMatchingArticle}).count(),
            likes2 = await ldb2.find({postId: myCommArticle}).count()

            expect(likes1).to.be.equal(0)
            && expect(likes2).to.be.equal(0)
        })

        it('내가 쓴 게시글 다 지우기', async()=>{
            const article1 = await articleDb.getAllArticleByUser(_id, articleMatchingType),
            article2 = await articleDb.getAllArticleByUser(_id, articleCommunityType)

            expect(article1).to.be.lengthOf(0)
            && expect(article2).to.be.lengthOf(0)
        })

        it('내가 쓴 게시글 - 인기 게시글 다 지우기', async()=>{
            const pArticle = await (await articleDb.getPopularDbByType(articleMatchingType)).findOne({_id: myMatchingArticle})
            
            expect(pArticle).to.be.undefined
        })

        it("내가 쓴 댓글 다 지우기 및 댓글 개수 조정 완료", async()=>{
            const comments1 = await articleDb.getAllCommentsByUser(_id, articleMatchingType),
            comments2 = await articleDb.getAllCommentsByUser(_id, articleCommunityType),
            article1 = await articleDb.getOneArticle(otherMatchingArticle, articleMatchingType),
            article2 = await articleDb.getOneArticle(otherCommArticle, articleCommunityType)

            expect(comments1).to.be.lengthOf(0)
            && expect(comments2).to.be.lengthOf(0)
            && expect(article1).to.haveOwnProperty('comments', 10)
            && expect(article2).to.haveOwnProperty('comments', 2)
        })

        it("내가 좋아요 한 좋아요 다 삭제 및 숫자 조정 완료", async()=>{
            const like1 = await articleDb.getAllLikeByUser(_id, articleMatchingType),
            like2 = await articleDb.getAllLikeByUser(_id, articleCommunityType),
            article1 = await articleDb.getOneArticle(otherMatchingArticle, articleMatchingType),
            article2 = await articleDb.getOneArticle(otherCommArticle, articleCommunityType)

            expect(like1).to.be.lengthOf(0)
            && expect(like2).to.be.lengthOf(0)
            && expect(article1).to.haveOwnProperty('like', 3)
            && expect(article2).to.haveOwnProperty('like', 500)
        })
     })
 })

async function insertArticleData(mine1, mine2, other1, other2){
    const mType = 'matching',
    cType = 'community'

    // popular article
    await (await articleDb.getPopularDbByType(mType)).insertOne({_id: mine1})

    return Promise.all([
        // 내 게시글 2개
        articleDb.insertArticle({_id: mine1, userId: _id, files: ['https://meet-testing1.s3.ap-northeast-2.amazonaws.com/1645666372588-fa30a8df6cc64c5db064006a1afa826f.jpg']}, mType),
        articleDb.insertComment({postId: mine1}, mType),
        articleDb.insertComment({postId: mine1}, mType),
        articleDb.insertComment({postId: mine1}, mType),
        articleDb.addLike({postId: mine1}, mType),
        articleDb.addLike({postId: mine1}, mType),

        articleDb.insertArticle({_id: mine2, userId: _id, files: []}, cType),
        articleDb.insertComment({postId: mine2}, cType),
        articleDb.insertComment({postId: mine2}, cType),
        articleDb.insertComment({postId: mine2}, cType),
        articleDb.addLike({postId: mine2}, cType),
        articleDb.addLike({postId: mine2}, cType),

        // 남 게시글 2개
        articleDb.insertArticle({_id: other1, userId: user1, like: 3, comments: 10, files: []}, mType),
        articleDb.insertComment({postId: other1, userId: _id}, mType),
        articleDb.addLike({postId: other1, userId: _id}, mType),

        articleDb.insertArticle({_id: other2, userId: user2, like: 500, comments: 2, files: []}, cType),
        articleDb.insertComment({postId: other2, userId: _id}, cType),
        articleDb.addLike({postId: other2, userId: _id}, cType),

    ])
 }
function insertBlockData(){
    try {
        return Promise.all([
            // 내가 차단한 유저 차단
            blockDb.insertBlock(Block({blockBy: _id, blockToUserId: user1})),
            // 내가 차단한 지인 차단
            blockDb.insertBlock(Block({blockBy: _id, blockToPhone: otherPhoneEncrypted})),
            // 내가 차단된 유저 차단
            blockDb.insertBlock(Block({blockBy: user2, blockToUserId: _id})),
            // 내가 차단된 지인 차단
            blockDb.insertBlock(Block({blockBy: user3, blockToUserId: _id, blockToPhone: phoneEncrypted}))
        ])
    } catch (err) {
        console.log(err)
        throw err;
    }
}
function insertChatData(){
    return Promise.all([
        chatDb.insertConversation({_id: conv1, participants: [_id, user1]}),
        chatDb.insertMessage({conversationId: conv1, from: _id, to: user1, contentType:'text'}),
        chatDb.insertMessage({conversationId: conv1, from: user1, to: _id, contentType:'text'}),
        chatDb.insertMessage({conversationId: conv1, from: _id, to: user1, contentType:'text'}),
        chatDb.insertMessage({conversationId: conv1, from: _id, to: user1, contentType:'text'}),
        chatDb.insertMessage({conversationId: conv1, from: user1, to: _id, contentType: 'image', content: 'https://meet-testing1.s3.ap-northeast-2.amazonaws.com/1645676958990-acb50c85ac9441079707692586c2c536.jpg'}),

        chatDb.insertConversation({_id: conv2, participants: [_id, user2]}),
        chatDb.insertMessage({conversationId: conv2, from: user2, to:_id, contentType: 'text'}),
        chatDb.insertMessage({conversationId: conv2, from: user2, to:_id, contentType: 'text'}),
        chatDb.insertMessage({conversationId: conv2, from: _id, to:user2, contentType: 'text'}),
    ])
}
function insertLikeData(){
    return Promise.all([
        likeDb.insertLike({likeFrom: _id, likeTo: user1, type: 0}),
        likeDb.insertLike({likeFrom: _id, likeTo: user2, type: 1}),
        likeDb.insertLike({likeFrom: user3, likeTo: _id, type: 0}),
        likeDb.insertLike({likeFrom: user4, likeTo: _id, type: 1})
    ])
}
function insertMateListData(){
    return Promise.all([
        mateListDb.insertMateList(MateList({users: [_id, user1]})),
        mateListDb.insertMateList(MateList({users: [_id, user2]})),
        mateListDb.insertMateList(MateList({users: [_id, user3]}))
    ])
}
function insertMeetData(){
    return Promise.all([
        meetDb.insertAllGeoJson(GeoJson({userId: _id, coordinates: [10,20], timestamp: new Date()})),
        meetDb.insertAllGeoJson(GeoJson({userId: _id, coordinates: [10,20], timestamp: new Date()})),
        meetDb.insertAllGeoJson(GeoJson({userId: _id, coordinates: [10,20], timestamp: new Date()})),

        meetDb.insertManyMeetMatching([
            MeetMatching({userId: _id, otherUserId: user1, timestamp: new Date(), coordinates: [10,20]}),
            MeetMatching({userId: user1, otherUserId: _id, timestamp: new Date(), coordinates: [10,20]}),
            MeetMatching({userId: user1, otherUserId: _id, timestamp: new Date(), coordinates: [10,20]}),
            MeetMatching({userId: _id, otherUserId: user1, timestamp: new Date(), coordinates: [10,20]})
        ]),

        meetDb.insertRanking(MeetRanking({userId: _id, otherUserId: user2, meet: 1, spots:1, meetCount: 2, score: 3, age: 2, gender: 'man', updatedAt: Date.now()})),
        meetDb.insertRanking(MeetRanking({userId: user2, otherUserId: _id, meet: 1, spots:1, meetCount: 2, score: 3, age: 2, gender: 'man', updatedAt: Date.now()})),
        meetDb.insertRanking(MeetRanking({userId: user3, otherUserId: _id, meet: 1, spots:1, meetCount: 2, score: 3, age: 2, gender: 'man', updatedAt: Date.now()})),

        meetDb.insertHidden(MeetHidden({userId: _id, otherUserId: user4, meet: 2, spots: 3, day_ago: 1, date: new Date()})),
        meetDb.insertHidden(MeetHidden({userId: _id, otherUserId: user4, meet: 2, spots: 3, day_ago: 3, date: new Date()})),
        meetDb.insertHidden(MeetHidden({userId: _id, otherUserId: user4, meet: 2, spots: 3, day_ago: 6, date: new Date()})),
    ])
}
async function deleteAllData(){
    const userDb = (await makeDb()).collection('user'),
    dUserDb = await deletedUserDb.getDb(),
    geoDb = await meetDb.getAllGeoJsonDb(),
    mdb = await meetDb.getMeetMatchingDb(),
    rdb = await meetDb.getRankingDb(),
    hdb = await meetDb.getHiddenDb(),
    mateDb = await mateListDb.getMateListDb(),
    ldb = await likeDb.getLikeDb(),
    convDb = await chatDb.getConversationDb(),
    msgDb = await chatDb.getMessageDb(),
    bDb = await blockDb.getBlockDb(),
    articleDb1 = await articleDb.getArticleDbByType(articleMatchingType),
    articleDb2 = await articleDb.getArticleDbByType(articleCommunityType),
    articleDbPopular = await articleDb.getPopularDbByType(articleMatchingType)

    await Promise.all([
        userDb.deleteMany({_id: { $in: users }}),
        dUserDb.deleteOne({_id}),
        geoDb.deleteMany({userId: _id}),
        mdb.deleteMany({$or: [{userId: _id}, {otherUserId: _id}]}),
        rdb.deleteMany({$or: [{userId: _id}, {otherUserId: _id}]}),
        hdb.deleteMany({$or: [{userId: _id}, {otherUserId: _id}]}),
        mateDb.deleteMany({users: _id}),
        ldb.deleteMany({$or: [{likeFrom: _id}, {likeTo: _id}]}),
        convDb.deleteMany({participants: _id}),
        msgDb.deleteMany({conversationId: { $in: [conv1, conv2] }}),
        bDb.deleteMany({ blockToPhone: phoneEncrypted }),
        articleDb1.deleteMany({_id: { $in: [myMatchingArticle, otherMatchingArticle] } } ),
        articleDb2.deleteMany({_id: { $in: [myCommArticle, otherCommArticle] } } ),
        articleDbPopular.deleteOne({_id: myMatchingArticle})
    ])
}