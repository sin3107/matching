import { expect, use } from "chai"
import chaiThings from 'chai-things'
import { like_use_case } from "../../use-cases/handle-like.js"
import errorMessage from '../../helper/error.js'
import { likeDb, mateListDb, userDb } from "../../db-handler/index.js"
import { MateList } from "../../models/index.js"
use(chaiThings)

const userA = `userA-userId-testing-for-like-use-case`,
userB = `userB-userId-testing-for-like-use-case`,
userC = `userC-userId-testing-for-like-use-case`,
userD = `userD-userId-testing-for-like-use-case`,
users = [userA, userB, userC, userD]
describe('친구해요 use-case testing', () => {
  before(async()=>{
    await Promise.all(users.map(user => userDb.deleteUser(user)))
      await Promise.all(users.map((user, i) => userDb.insertUser({
          _id: user, 
          basicProfile: {
              nickname: `nickname-${i}`,
              profilePic: `profile-${i}`,
              age: new Date(),
              gender: i%2 ===0? "man": "woman",
              address: {
                  sido: `sido-${i}`
              }
            }
        })))
        await Promise.all(users.map(user => likeDb.deleteLikeOfUser(user)))
  })
  after(async()=>{
      await Promise.all(users.map(user => userDb.deleteUser(user)))
  })
  describe('A-> B 크로스 좋아요 보내기 & B -> A 크로스 좋아요 답장 보내기', ()=>{
    before(async()=>{
        await mateListDb.insertMateList(MateList({users: [userA, userB]}))
        await like_use_case.sendLike({likeFrom: userA, likeTo: userB, type: 0})
        await like_use_case.sendLike({likeFrom: userB, likeTo: userA, type: 0})
    })
    after(async()=> {
        await Promise.all(users.map(user => likeDb.deleteLikeOfUser(user)))
        await mateListDb.deleteAllMateListByUser(userA)
    })
    it('likeDB 에서 A, B 둘 다 지워졌는지 확인', async()=>{
        const checkA = await likeDb.findAnyLike({from: userA, to: userB})
        const checkB = await likeDb.findAnyLike({from: userB, to: userA})
        expect(checkA).to.be.undefined
        && expect(checkB).to.be.undefined
    })
    it('mateListDb에 정상적으로 meet 매칭이 들어 있는지 확인', async()=>{
        const check = await mateListDb.getMateList(userA, userB)
        expect(check).to.be.an('object').to.have.property('matching').to.have.members(['meet'])
    })
    it('알림 보내기 테스트 - 소켓이나 push 정상적으로 가는지', ()=>{

    })
  })
  describe('A -> B 커뮤 친구해요 & B -> A 커뮤 친구해요 답장', () => {
    before(async()=>{
        await mateListDb.insertMateList(MateList({users: [userA, userB]}))
        await like_use_case.sendLike({likeFrom: userA, likeTo: userB, type: 1})
        await like_use_case.sendLike({likeFrom: userB, likeTo: userA, type: 1})
    })
    after(async()=>{
        await likeDb.deleteLikeOfUser(userA)
        await mateListDb.deleteAllMateListByUser(userA)
    })
    it('likeDB 에서 A, B 둘 다 지워졌는지 확인', async()=>{
        const checkA = await likeDb.findAnyLike({from: userA, to: userB})
        const checkB = await likeDb.findAnyLike({from: userB, to: userA})
        expect(checkA).to.be.undefined
        && expect(checkB).to.be.undefined
    })
    it("mateListDb에 community 매칭이 정상적으로 들어 있는지 확인", async()=>{
        const check = await mateListDb.getMateList(userA, userB)
        expect(check).to.be.an('object').to.have.property('matching').to.have.members(['community'])
    })
    it("알림 보내기 테스트 - 소켓이나 push 정상적으로 가는지", ()=>{})
  });
  describe('A -> B 크로스 친구해요 : B -> A 무시', () => {
    before(async()=>{
        await like_use_case.sendLike({likeFrom: userA, likeTo: userB, type: 0})
    })
    after(async()=>{
        await likeDb.deleteLikeOfUser(userA)
    })
    it('like db에서 A -> B만 있고 B -> A는 없기', async()=>{
        const checkA = await likeDb.findAnyLike({from: userA, to: userB}),
        checkB = await likeDb.findAnyLike({from: userB, to: userA})
        expect(checkA).to.be.an("object")
        && expect(checkB).to.be.undefined
    })
    it('mateList db에는 둘 다 정보 없기', async()=>{
        const check = await mateListDb.getMateList(userA, userB)
        expect(check).to.be.undefined
    })
  });
  describe('A -> B 크로스 친구해요 : B -> A 차단', () => {
    // NOTE 나중에 차단 하고 하기
  });
  describe('A -> B 크로스 친구해요 : A -> B 크로스 친구해요 다시 보냄', () => {
    let res;
    before(async()=>{
        await like_use_case.sendLike({likeFrom: userA, likeTo: userB, type: 0})
        res = await like_use_case.sendLike({likeFrom: userA, likeTo: userB, type: 0})
    })
    after(async()=> await likeDb.deleteLikeOfUser(userA))
    it('result는 status: false 랑 에러 메시지 return 하기', ()=>{
        expect(res).to.haveOwnProperty('status').to.be.false
        && expect(res).to.haveOwnProperty('body', errorMessage.dbError.likeResend)
    })
    it('like db에는 A -> B 1개만 있기', async()=>{
        const check = await likeDb.findLikeOfUser(userA)
        expect(check).to.be.an('array').to.be.lengthOf(1)
    })
    it('mate list db에는 아무것도 없기', async()=>{
        const check = await mateListDb.getAllMateListByUser(userA)
        expect(check).to.be.empty
    })
  });
  describe('A -> B 크로스 친구해요 : A -> B 커뮤 친구 해요 다시 보냄', () => {
    let res;
    before(async()=>{
        await like_use_case.sendLike({likeFrom: userA, likeTo: userB, type: 0})
        res = await like_use_case.sendLike({likeFrom: userA, likeTo: userB, type: 1})
    })
    it('status: false 랑 에러 메시지 return해야', async()=>{
        expect(res).to.haveOwnProperty('status', false)
        && expect(res).to.haveOwnProperty('body', errorMessage.dbError.likeResend)
    })
    it('like db에는 1개만 있어야 - meet', async()=>{
        const check = await likeDb.findLikeOfUser(userA)
        expect(check).to.be.an('array').to.be.lengthOf(1)
        && expect(check[0]).to.have.property('type', 0)
    })
    it("mate list db에는 아무도 없어야", async()=>{
        const check = await mateListDb.getAllMateListByUser(userA)
        expect(check).to.be.empty
    })
  });
  describe('A -> B 크로스 친구해요 : B -> A 커뮤 친구해요', () => {
      before(async()=>{
          await like_use_case.sendLike({likeFrom: userA, likeTo: userB, type: 0})
          await like_use_case.sendLike({likeFrom: userB, likeTo: userA, type: 1})
      })
      after(async()=> await likeDb.deleteLikeOfUser(userA))
      it('like db에 A -> B 크로스 친구해요 있어야', async()=>{
          const check = await likeDb.findLikeForMatching(userA, userB, 0)
          expect(check).to.be.an('object')
      })
      it('like db에 B -> A 커뮤 친구해요 있어야', async()=>{
          const check = await likeDb.findLikeForMatching(userB, userA, 1)
          expect(check).to.be.an('object')
      })
      it('mate list db에는 아무것도 없어야', async()=>{
          const check = await mateListDb.getMateList(userA, userB)
          expect(check).to.be.undefined
      })
  });
  describe('A -> B 크로스 친구해요. 이미 크로스 매칭 된 상대', () => {
      let res;
    before(async()=>{
        await mateListDb.insertMateList(MateList({users: [userA, userB], matching: ['meet']}))
        res = await like_use_case.sendLike({likeFrom: userA, likeTo: userB, type: 0})
    })
    after(async()=>{
        await mateListDb.deleteAllMateListByUser(userA)
    })
    it('result status: false랑 error message return', ()=>{
        expect(res).to.have.property('status', false)
        && expect(res).to.haveOwnProperty('body', errorMessage.dbError.alreadyLikeMatched)
    })
    it('like db에는 아무도 없어야', async()=>{
        const check = await likeDb.findAnyLike({from: userA, to: userB})
        expect(check).to.be.undefined
    })
  });
  describe('A -> B 크로스 친구해요. 이미 커뮤 매칭 된 상대', () => {
    before(async()=>{
        await mateListDb.insertMateList(MateList({users: [userA, userB], matching: ['community']}))
        await like_use_case.sendLike({likeFrom: userA, likeTo: userB, type: 0})
    })
    after(async()=>{
        await mateListDb.deleteAllMateListByUser(userA)
        await likeDb.deleteLikeOfUser(userA)
    })
    it('like db에는 A -> B 크로스 친구해요 있어야', async()=>{
        const check = await likeDb.findAnyLike({from: userA, to: userB})
        expect(check).to.be.an('object')
    })
    it('mate list db에는 커뮤 매칭만 있어야', async()=>{
        const check = await mateListDb.getMateList(userA, userB)
        expect(check).to.haveOwnProperty('matching').to.have.members(['community'])
    })
  });
  describe('에러 메시지 리턴하기', ()=>{
      it('like from 없음', async()=>{
        const {status, body} = await like_use_case.sendLike({})
        expect(status).to.be.false
        && expect(body).to.be.eq(errorMessage.nullError.likeFromMissing)
      })
      it('like to 없음', async()=>{
        const {status, body} = await like_use_case.sendLike({likeFrom: 'usra'})
        expect(status).to.be.false
        && expect(body).to.be.eq(errorMessage.nullError.likeToMissing)
      })
      it('type 없음', async()=>{
        const {status, body} = await like_use_case.sendLike({likeFrom: 'usra', likeTo: 'user'})
        expect(status).to.be.false
        && expect(body).to.be.eq(errorMessage.nullError.likeTypeMissing)
      })
      it('type이 db에 들어있는 타입이 아님', async()=>{
        const {status, body} = await like_use_case.sendLike({likeFrom: 'usra', likeTo: 'user', type: '0'})
        expect(status).to.be.false
        && expect(body).to.be.eq(errorMessage.nullError.likeTypeMissing)
      })
      it('like from user가 db에 없음', async()=>{
        const {status, body} = await like_use_case.sendLike({likeFrom: 'usra', likeTo: 'user', type: 0})
        expect(status).to.be.false
        && expect(body).to.be.eq(errorMessage.dbError.userNotFound)
      })
      it('like to 유저가 db에 없음', async()=>{
        const {status, body} = await like_use_case.sendLike({likeFrom: userA, likeTo: 'user', type: 0})
        expect(status).to.be.false
        && expect(body).to.be.eq(errorMessage.dbError.userNotFound)
      })
  })
  describe('친구해요 리스트 받기 테스트 - user A', () => {
    before(async()=>{
        await likeDb.deleteLikeOfUser(userA)
        // 내가 보낸 리스트
        await like_use_case.sendLike({likeFrom: userA, likeTo: userB, type: 0})
        await like_use_case.sendLike({likeFrom: userA, likeTo: userD, type: 1})

        // 내가 받은 리스트
        await like_use_case.sendLike({likeFrom: userB, likeTo: userA, type: 1})
        await like_use_case.sendLike({likeFrom: userC, likeTo: userA, type: 0})
    })
    after(async()=>{
        await likeDb.deleteLikeOfUser(userA)
    })
    describe('크로스 좋아요 리스트 받기', () => {
      let status, body, likeToList, likeFromList;
      before(async()=> {
          const res = await like_use_case.getLikes(userA, 0)
          status = res.status
          body = res.body
          likeToList = res.body.likeToList
          likeFromList = res.body.likeFromList
      })
      it("status true", ()=>
        expect(status).to.be.true)
      it('body - likeFromList랑 likeToList 있기', ()=>{
          expect(body).to.have.keys(['likeFromList', 'likeToList'])
      })
      it('likeToList length 검사 - 1', ()=>{
          expect(likeFromList).to.be.an('array').to.be.lengthOf(1)
      })
      it('likeToList에 userB 유저 정보 있는지 확인', ()=>{
          expect(likeToList[0]).to.have.keys(['likeTo', 'timestamp', 'type'])
          && expect(likeToList[0].likeTo).to.have.keys(['userId', 'nickname', 'profileImage', 'age', 'gender', 'sido'])
          && expect(likeToList[0].likeTo).to.haveOwnProperty('userId', userB)
      })
      it('likeFromList length 검사 -1', ()=>{
          expect(likeToList).to.be.an("array").to.be.lengthOf(1)
      })
      it("likeFromList에 userC 유저 정보 있는지 확인", ()=>{
        expect(likeFromList[0]).to.have.keys(['likeFrom', 'timestamp', 'type'])
        && expect(likeFromList[0].likeFrom).to.have.keys(['userId', 'nickname', 'profileImage', 'age', 'gender', 'sido'])
        && expect(likeFromList[0].likeFrom).to.haveOwnProperty('userId', userC)
      })
    });
    describe('커뮤 친구해요 리스트 받긴', () => {
        let status, body, likeToList, likeFromList
      before(async()=>{
          const res = await like_use_case.getLikes(userA, 1)
          status = res.status
          body = res.body
          likeToList = res.body.likeToList
          likeFromList = res.body.likeFromList
      })
      it("status true", ()=>
        expect(status).to.be.true)
      it('body - likeFromList랑 likeToList 있기', ()=>{
          expect(body).to.have.keys(['likeFromList', 'likeToList'])
      })
      it('likeToList length 검사 - 1', ()=>{
          expect(likeToList).to.be.an('array').to.be.lengthOf(1)
      })
      it('likeToList에 userD 유저 정보 있는지 확인', ()=>{
          expect(likeToList[0]).to.have.keys(['likeTo', 'timestamp', 'type'])
          && expect(likeToList[0].likeTo).to.have.keys(['userId', 'nickname', 'profileImage', 'age', 'gender', 'sido'])
          && expect(likeToList[0].likeTo).to.haveOwnProperty('userId', userD)
      })
      it('likeFromList length 검사 -1', ()=>{
          expect(likeFromList).to.be.an("array").to.be.lengthOf(1)
      })
      it("likeFromList에 userD 유저 정보 있는지 확인", ()=>{
        expect(likeFromList[0]).to.have.keys(['likeFrom', 'timestamp', 'type'])
        && expect(likeFromList[0].likeFrom).to.have.keys(['userId', 'nickname', 'profileImage', 'age', 'gender', 'sido'])
        && expect(likeFromList[0].likeFrom).to.haveOwnProperty('userId', userB)
      })
    });
    
   })
});