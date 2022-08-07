import { expect, should, use } from "chai";
import chaiThings from 'chai-things'
import chaiLike from 'chai-like'
import { meet_use_case } from "../../use-cases/handle-meet.js";
import errorMessage from '../../helper/error.js'
import { blockDb, mateListDb, userDb, meetDb } from "../../db-handler/index.js";
import { Block } from "../../models/index.js";
import { redis_handler } from "../../helper/redis-handler.js";
import { generateId } from "../../helper/id-generator.js";
use(chaiThings)
use(chaiLike)

const user1=`user1-${Date.now()}`, 
user2=`user2-${Date.now()}`, 
user3=`user3-${Date.now()}`, 
user4=`user4-${Date.now()}`, 
maxLong = 129.671630859375,
minLong = 125.584716796875,
maxLat = 38.71123253895224,
minLat = 33.0178760185549;
// describe('meet use case testing', () => {
//     const users = [user1, user2, user3, user4]
//     before(async()=>{
//         await Promise.all(users.map(user=> userDb.insertUser({_id: user, basicProfile: {nickname: user, profilePic: user}})))
//     })
//     after(async()=>{
//         await Promise.all(users.map(user => userDb.deleteUser(user)))
//     })

//     describe('크로스 계산 시 차단 관련 function 테스트', () => {
//       before(async()=>{
//         await blockDb.insertBlock(Block({blockBy: user1, blockToUserId: user2}))
//         await blockDb.insertBlock(Block({blockBy: user1, blockToUserId: user3}))
//         await blockDb.insertBlock(Block({blockBy: user4, blockToUserId: user1}))
//       })
//       after(async()=>{
//         await blockDb.delteManyBlock(user1)
//       })
//       it('차단 정보 레디스에 저장 - 차단 정보 가져올 시 각자 필요한 것 다 가지고 있기', async()=>{
//           await meet_use_case.saveBlockToRedis();
//           const user1Block = await redis_handler.getAllBlockByUser(user1);
//           const user2Block = await redis_handler.getAllBlockByUser(user2),
//           user3Block = await redis_handler.getAllBlockByUser(user3),
//           user4Block = await redis_handler.getAllBlockByUser(user4)
//           expect(user1Block).to.be.an('array').to.be.lengthOf(3).to.have.members([user2, user3, user4])
//           && expect(user2Block).to.be.an('array').to.be.lengthOf(1).to.have.members([user1])
//           && expect(user3Block).to.be.an("array").to.be.lengthOf(1).to.have.members([user1])
//           && expect(user4Block).to.be.an("array").to.be.lengthOf(1).to.have.members([user1])
//       })
//       it('차단된 유저 거르기 - filtering check', async()=>{
//           const closeUsers = [user1, user3, user4],
//           filteredBlock = await meet_use_case.filterBlock(user2, closeUsers)
//           expect(filteredBlock).to.be.an('array').to.be.lengthOf(2).to.have.members([user3, user4])
//       })
//       it('레디스에 저장 된 차단 정보 지우기 - 차단 정보 가져 올 시 empty인 것 확인', async()=>{
//           await meet_use_case.deleteBlockInRedis();
//           const user1Block = await redis_handler.getAllBlockByUser(user1),
//           user2Block = await redis_handler.getAllBlockByUser(user2),
//           user3Block = await redis_handler.getAllBlockByUser(user3),
//           user4Block = await redis_handler.getAllBlockByUser(user4)
//           expect(user1Block).to.be.empty
//           && expect(user2Block).to.be.empty
//           && expect(user3Block).to.be.empty
//           && expect(user4Block).to.be.empty
//       })
//     });
    
//     describe("find meet 테스팅 - user2 & user3 매칭 되어야 함, ", ()=>{
//         const groupKey = meet_use_case.currentGroupKey,
//         matchingKey = meet_use_case.currentMatchingKey,
//         matching = [],
//         timestamp = meet_use_case.currentTime
//         before(async()=>{
//             // block
//             await Promise.all([
//                 blockDb.insertBlock(Block({blockBy: user1, blockToUserId: user2})),
//                 blockDb.insertBlock(Block({blockBy: user1, blockToUserId: user3})),
//                 blockDb.insertBlock(Block({blockBy: user4, blockToUserId: user1}))
//             ])
//             await meet_use_case.saveBlockToRedis();

//             // 군집 저장
//             const groupId = ['test1', 'test2']
//             await Promise.all(groupId.map((groupId, i) => redis_handler.upsertGroupToList(groupKey, groupCoordinates[i], groupId)))
//             // 군집 내 
//             await Promise.all([
//                 redis_handler.insertUserToGroup(randomCoordinates[0], groupId[0], user1),
//                 redis_handler.insertUserToGroup(randomCoordinates[1], groupId[0], user2),
//                 redis_handler.insertUserToGroup(randomCoordinates[2], groupId[0], user3),
//                 redis_handler.insertUserToGroup(randomCoordinates[3], groupId[1], user4)
//             ])
//         })
//         before(async()=> {
//             await meet_use_case.findMeetMatching(groupKey, matchingKey)
//             const matchingArr = await redis_handler.getMatchingList(matchingKey)
//             matchingArr.map(m => matching.push(JSON.parse(m)))
//         })
//         after(async()=> {
//             await meet_use_case.deleteBlockInRedis();
//             await blockDb.delteManyBlock(user1)
//             await (await meetDb.getMeetMatchingDb()).deleteOne({userId: user2})
//             await (await meetDb.getMeetMatchingDb()).deleteOne({userId: user3})
//             await mateListDb.deleteAllMateListByUser(user2)
//             matching.length = 0;
//         })
//         it('매칭 정보 - array, length 2(user2, user3)', ()=>{
//             expect(matching).to.be.an('array').to.be.lengthOf(2)
//         })
//         it('매칭 정보 - user2와 user3 가지고 있기', ()=>{
//             expect(matching).to.satisfies(()=>matching.find(x => x.userId === user2 && x.otherUserId === user3))
//             .and.to.satisfy(()=> matching.find(x => x.userId === user3 && x.otherUserId === user2))
//         })
//         it('매칭 정보 - user1 없기 - 차단으로 걸러짐', ()=>{
//             expect(matching).to.satisfy(()=> matching.find(x => x.userId !==user1 || x.otherUserId !== user1))
//         })
//         it('매칭 정보 - user 4 없기 - 다른 군집에 있음', ()=> {
//             expect(matching).to.satisfy(()=> matching.find(x => x.userId !==user4 || x.otherUserId !== user4))
//         })
//         it('매칭 정보 몽고에 저장하기', async()=>{
//             await meet_use_case.saveMatchingToMongo(matchingKey, timestamp);
//             // NOTE 1시간 전 옵션 때문에 직접 가져오기
//             const db= await meetDb.getMeetMatchingDb()
//             const check1 = await db.find({userId: user2}).toArray(),
//             check2 = await db.find({userId: user3}).toArray();
//             expect(check1).to.be.an('array').to.be.lengthOf(1)
//             && expect(check1[0]).to.include({userId: user2, otherUserId: user3})
//             && expect(check2).to.be.an('array').to.be.lengthOf(1)
//             && expect(check2[0]).to.include({userId: user3, otherUserId: user2})
//         })
//         it('누적 크로스 올리기', async()=>{
//             await meet_use_case.incMeetMatchingCount(matchingKey);
//             const checkMateList = await mateListDb.getMateList(user2, user3)
//             expect(checkMateList).to.be.an('object')
//             && expect(checkMateList).to.haveOwnProperty('users').to.have.members([user3, user2])
//             && expect(checkMateList).to.haveOwnProperty('matching').to.be.empty
//             && expect(checkMateList).to.haveOwnProperty('meetMatchingCount', 1)
//         })
//         it('geo 정보 지우기 - test 1이랑 test2 string으로 입력', async()=>{
//             await meet_use_case.deleteGeoInRedis(groupKey);
//             const checkGroupList = await redis_handler.getAllGroupList(groupKey),
//             userGroup = await redis_handler.getAllUserInGroup('test1'),
//             userGroup2 = await redis_handler.getAllUserInGroup('test2')
//             expect(checkGroupList).to.be.empty
//             && expect(userGroup).to.be.empty
//             && expect(userGroup2).to.be.empty
//         })
//         it('매칭 정보 지우기', async()=>{
//             await meet_use_case.deleteMatchingInRedis(matchingKey);
//             const checkMatching = await redis_handler.getMatchingList(matchingKey)
//             expect(checkMatching).to.be.empty
//         })
//     }) 
//     describe('calculate meet 전체 테스트 user 2& user3만 매칭', () => {
//         const groupId1 = 'test1', 
//         groupId2 = 'test2',
//         groupKey = meet_use_case.currentGroupKey
//         before(async()=>{
//             // block
//             await Promise.all([
//                 blockDb.insertBlock(Block({blockBy: user1, blockToUserId: user2})),
//                 blockDb.insertBlock(Block({blockBy: user1, blockToUserId: user3})),
//                 blockDb.insertBlock(Block({blockBy: user4, blockToUserId: user1}))
//             ])
//             await meet_use_case.saveBlockToRedis();

//             // 군집 저장
//             const groupId = [groupId1, groupId2]
//             await Promise.all(groupId.map((groupId, i) => redis_handler.upsertGroupToList(groupKey, groupCoordinates[i], groupId)))
//             // 군집 내 
//             await Promise.all([
//                 redis_handler.insertUserToGroup(randomCoordinates[0], groupId[0], user1),
//                 redis_handler.insertUserToGroup(randomCoordinates[1], groupId[0], user2),
//                 redis_handler.insertUserToGroup(randomCoordinates[2], groupId[0], user3),
//                 redis_handler.insertUserToGroup(randomCoordinates[3], groupId[1], user4)
//             ])
//         })
//         before(async()=> await meet_use_case.calculateMeet())
//         after(async()=>{
//             await meet_use_case.deleteBlockInRedis();
//             await blockDb.delteManyBlock(user1)
//             await (await meetDb.getMeetMatchingDb()).deleteOne({userId: user2})
//             await (await meetDb.getMeetMatchingDb()).deleteOne({userId: user3})
//             await mateListDb.deleteAllMateListByUser(user2)
//         })
//         it('몽고 매칭 정보 있는지 확인 - user2', async()=>{
//             // NOTE 1시간 전 옵션 때문에 직접 가져오기
//             const db= await meetDb.getMeetMatchingDb()
//             const check = await db.find({userId: user2}).toArray()
//             expect(check).to.be.an('array').to.be.lengthOf(1)
//             && expect(check[0]).to.include({userId: user2, otherUserId: user3})
//         })
//         it('몽고 매칭 정보 있는지 확인 - user3', async()=>{
//             const db= await meetDb.getMeetMatchingDb()
//             const check = await db.find({userId: user3}).toArray();
//             expect(check).to.be.an('array').to.be.lengthOf(1)
//             && expect(check[0]).to.include({userId: user3, otherUserId: user2}) 
//         })
//         it('몽고 매칭 정보 없는지 확인 - user1', async()=>{
//             const db = await meetDb.getMeetMatchingDb(),
//             check = await db.find({userId: user1}).toArray()
//             expect(check).to.be.empty
//         })
//         it('몽고 매칭 정보 없는지 확인 - user4', async()=>{
//             const db = await meetDb.getMeetMatchingDb(),
//             check = await db.find({userId: user4}).toArray()
//             expect(check).to.be.empty
//         })
//         it('몽고 누적 크로스 있는지 확인 - user2 & user3', async()=>{
//             const checkMateList = await mateListDb.getMateList(user2, user3)
//             expect(checkMateList).to.be.an('object')
//             && expect(checkMateList).to.haveOwnProperty('users').to.have.members([user3, user2])
//             && expect(checkMateList).to.haveOwnProperty('matching').to.be.empty
//             && expect(checkMateList).to.haveOwnProperty('meetMatchingCount', 1)
//         })
//         it('몽고 누적 크로스 없는지 확인 - user1', async()=>{
//             // NOTE 매칭된 것만 돌아오기 때문에 직접 가져오기
//             const db = await mateListDb.getMateListDb(),
//             checkMateList = await db.find({users: user1}).toArray()
//             expect(checkMateList).to.be.empty
//         })
//         it('몽고 누적 크로스 없는지 확인 - user4', async()=>{
//             const db = await mateListDb.getMateListDb(),
//             checkMateList = await db.find({users: user4}).toArray()
//             expect(checkMateList).to.be.empty
//         })
//     });
// });
describe('calculate meet matching ranking', () => {
    before(async () => {
    })
    after(async()=>{
        // await redis_handler.deleteAllDataInRedis()
        // await Promise.all(users.map(async(userId) => (await meetDb.getMeetMatchingDb()).deleteOne({userId})))
    })
    it('should do something', async ()=>{
        
    })
});
describe('get meet ranking list', () => {
  before(async()=>{

  })
  after(async()=>{

  })
  it('')
});

// describe("add geo json to", ()=>{
//     before(async()=>{
//         // NOTE 진짜 user id 를 user database에서 가져오기
//         const db = await makeDb(),
//         cursor = db.collection('user').aggregate([{$sample: {size: 4}}])
//         const ids = [];
//         await cursor.forEach(({_id}) => ids.push(_id));
//         user1 = ids[0]
//         user2 = ids[1]
//         user3 = ids[2] ? ids[2] : ids[0]
//         user4 = ids[3] ? ids[3] : ids[1]
//     })
//     describe("return true: successfully added geo json", ()=>{
//         let result;
//         before(async()=> 
//             result = await meet_use_case.addGeoJson({geoJson: {userId: user1, coordinates: randomCoordinates[0]}}))
//         after(async()=> {
//             await meetDb.dropTempGeoJson(meet_use_case.currentCollectionName)
//             await meetDb.deleteMyGeoJson(user1)
//         })
//         it("must return true status", ()=>{
//             expect(result).to.haveOwnProperty("status", true)
//         })
//         it("must return body nothing", ()=> 
//             expect(result).to.haveOwnProperty('body').to.be.null)
//     })
//     describe("unhappy path", ()=>{
//         it("must return false: no userId", async()=>{
//             const result = await meet_use_case.addGeoJson({geoJson: {}});
//             expect(result).to.haveOwnProperty('status', false)
//             && expect(result).to.haveOwnProperty('body', errorMessage.nullError.idMissing.message)
//         })
//         it("must return false: no coordinate", async()=>{
//             const result = await meet_use_case.addGeoJson({geoJson: {userId: user1}})
//             expect(result).to.haveOwnProperty('status', false)
//             && expect(result).to.haveOwnProperty('body', errorMessage.nullError.coordinatesMissing.message)
//         })
//         it("must return false: user not exist in db", async()=>{
//             const result = await meet_use_case.addGeoJson({geoJson: {userId: 'userId', coordinates: randomCoordinates[0]}})
//             expect(result).to.haveOwnProperty('status', false)
//             && expect(result).to.haveOwnProperty('body', errorMessage.dbError.userNotFound)
//         })
//         it('must return false: wrong geo json-longtitude', async()=>{
//             const result = await meet_use_case.addGeoJson({geoJson: {userId: user1, coordinates: [-181, 0]}})
//             expect(result).to.haveOwnProperty('status', false)
//             && expect(result).to.haveOwnProperty('body', errorMessage.syntaxError.wrongGeoJson.message)
//         })
//         it("must return false: wrong latitude", async()=>{
//             const result = await meet_use_case.addGeoJson({geoJson: {userId: user1,coordinates: [-180, 91]}})
//             expect(result).to.haveOwnProperty('status',false)
//             && expect(result).to.haveOwnProperty('body', errorMessage.syntaxError.wrongGeoJson.message)
//         })
//     })
// })
// describe("get my meet and my points", ()=>{
//     describe("happy path - both list exist", ()=>{
//         before(async()=> {
//             // NOTE to avoid one hour ago
//             await meetDb.insertAllGeoJson({
//                 userId: user1,
//                 timestamp: new Date(new Date().setHours(new Date().getHours()-2))
//             })
//             await meetDb.insertAllGeoJson({
//                 userId: user1,
//                 timestamp: new Date(new Date().setHours(new Date().getHours()-3))
//             })
//             await meetDb.insertMeetMatching({
//                 userId: user1,
//                 timestamp: new Date(new Date().setHours(new Date().getHours()-2)),
//                 location: {
//                     type: "Point",
//                     coordinates: randomCoordinates[0]
//                 },
//                 meet: [{
//                     userId: user2,
//                     timestamp: new Date(new Date().setHours(new Date().getHours()-2)),
//                     location: {
//                         type: "Point",
//                         coordinates: randomCoordinates[1]
//                     }
//                 }]
//             })
//             await meetDb.insertMeetMatching({
//                 userId: user1,
//                 timestamp: new Date(new Date().setHours(new Date().getHours()-3)),
//                 meet: [{
//                     userId: user2,
//                     timestamp: new Date(new Date().setHours(new Date().getHours()-3)),
//                     location: {
//                         type: "Point",
//                         coordinates: randomCoordinates[1]
//                     }
//                 }]
//             })
//         })
//         after(async()=> {
//             await meetDb.deleteMyGeoJson(user1);
//             await meetDb.deleteMeetMatchingByUser(user1)
//         })
//         let result;
//         before(async()=> result = await meet_use_case.getMeetList(user1))
//         it("must return true", ()=> {
//             expect(result).to.haveOwnProperty('status', true)
//         })
//         it("must return body with two list", ()=>
//             expect(result).to.haveOwnProperty('body').to.have.keys(['myGeoJsonList', 'meetList']))
//         it("must have two elements in my geo json list", ()=>
//             expect(result.body).to.haveOwnProperty('myGeoJsonList').to.be.lengthOf(2))
//         it("must have two elements in meet list", ()=>
//             expect(result.body).to.haveOwnProperty('meetList').to.be.lengthOf(2))
//         it("must have meetlist with all keys", ()=>
//             expect(result.body).to.haveOwnProperty('meetList')
//             .to.include.something.that.have.any.keys(['location', 'userId', 'timestamp', 'meet']))
//         it("must have meet as array in meetList", ()=>
//             expect(result.body.meetList)
//             .to.haveOwnProperty('0').to.haveOwnProperty('meet')
//             .to.be.an('array'))
//         it('must have all user info keys: userId, nickname, profileImage, age, gender', ()=>{
//             expect(result.body.meetList[0].meet[0])
//             .to.haveOwnProperty('userInfo')
//             .to.have.keys(['userId', 'nickname', 'profileImage', 'age', 'gender', 'count'])
//         })
//     })
//     describe('happy path - none of the list exist', () => {
//         let result;
//         before(async()=> result = await meet_use_case.getMeetList(user1))
//         it('should return true', ()=> 
//             expect(result).to.haveOwnProperty('status', true))
//         it('should have body with two list', ()=>
//             expect(result).to.haveOwnProperty('body')
//             .to.have.keys(['meetList', 'myGeoJsonList']))
//         it('should be null - my geo json list', ()=>
//             expect(result.body).to.haveOwnProperty('myGeoJsonList').to.be.null)
//         it('should be null - meet list', ()=>
//             expect(result.body).to.haveOwnProperty('meetList').to.be.null)
//     })
    
//     describe("unhappy path", ()=>{
//         it('must return false: no user id', async()=>{
//             const result = await meet_use_case.getMeetList();
//             expect(result).to.haveOwnProperty('status', false)
//             && expect(result).to.haveOwnProperty('body', errorMessage.nullError.idMissing)
//         })
//         it('must return false: no user found in db', async()=>{
//             const result = await meet_use_case.getMeetList('afdfds');
//             expect(result).to.haveOwnProperty('status', false)
//             && expect(result).to.haveOwnProperty('body', errorMessage.dbError.userNotFound)
//         })
//     })
// })
// describe('testing updating meet user info', () => {
//     let updatedMeet;
//     before(async()=> {
//         const meet = [
//             {userId: user1,
//                 location: {
//                     type:"Point",
//                     coordinates: randomCoordinates[0]
//                 },
//                 timestamp: new Date()
//             },
//             {userId: user2,
//             location: {
//                 type: "Point",
//                 coordinates: randomCoordinates[1]
//             },
//             timestamp: new Date()}
//         ]
//         updatedMeet = await meet_use_case.updateMeetUserInfo(user1, meet);
//     })
//     it('should be an array', ()=>
//         expect(updatedMeet).to.be.an('array'))
//     it("should have location with coordinates in updated meet", ()=>{
//         expect(updatedMeet).to.include.something.that.haveOwnProperty('location')
//     })
//     it('should have timestamp as date type', ()=>{
//         expect(updatedMeet).to.include.something.that.haveOwnProperty('timestamp')
//         .to.haveOwnProperty('0').to.haveOwnProperty('timestamp').to.be.a('date')
//     })
//     it('should have userInfo', ()=>
//         expect(updatedMeet).to.include.something.that.haveOwnProperty('userInfo'))
//     it('should have all keys in user info', ()=>
//         expect(updatedMeet).to.include.something.that.haveOwnProperty('userInfo')
//         .to.haveOwnProperty('0').to.haveOwnProperty('userInfo')
//         .to.have.keys(['userId', 'nickname', 'profileImage', 'age', 'gender', 'count']))
//     it('should be a number - count', ()=>
//         expect(updatedMeet[0].userInfo)
//         .to.haveOwnProperty('count').to.be.a('number'))
// })
const groupCoordinates = [
    // user 1, user2, user3
    [
        129.08357128500938,
        35.137544072750465
      ],
      // user4
      [
        129.08357128500938,
        35.137544072750465
      ],
]
const randomCoordinates = [
    // user1
    [
        129.08365041017532,
        35.137651002756805
      ],
      // user2
      [
        129.0833795070648,
        35.13750184906828
      ],
      // user3
      [
        129.08372819423676,
        35.13748649499658
      ],
      // user4
      [
        128.902587890625,
        35.22052059481265
      ],
    ]
function getRandPointInKorea(){
    const randLong = Math.random() * (maxLong - minLong +1) + minLong,
    randLat = Math.random() * (maxLat - minLat +1) + minLat
    return [randLong, randLat]
}
function getRandPointIn서면(){
    const maxLong = 129.06968525017,
    minLong = 129.0578125095506,
    maxLat = 35.16598913536852,
    minLat =35.144775190930226,
    randLong = Math.random() * (maxLong - minLong) + minLong,
    randLat = Math.random() * (maxLat - minLat) + minLat
    console.log([randLong, randLat])
    return [randLong, randLat]
}