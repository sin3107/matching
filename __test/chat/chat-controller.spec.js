import { expect, use } from "chai";
import chaiThings from 'chai-things'
import { deleteOldChat, getConversation, getConversationList, putConversation } from "../../controllers/chat-controller.js";
import { chatDb, makeDb, userDb } from "../../db-handler/index.js";
import errorMessage from '../../helper/error.js'
import { ChatConversation, ChatMessage } from "../../models/index.js";
use(chaiThings)

const userA = 'test-chat-controller-user-1',
userB = 'test-chat-controller-user-2',
userC = 'test-chat-controller-user-3',
userD = 'test-chat-controller-user-4',
userE = 'test-chat-controller-user-5',
users =[userA, userB, userC, userD, userE],
convId1 = 'test-chat-controller-conversationId-1',
convId2 = 'test-chat-controller-conversationId-2',
convid3 = 'test-chat-controller-conversationId-3',
convid4 = 'test-chat-controller-conversationId-4',
convid5 = 'test-chat-controller-conversationId-5',
startTime = new Date()
describe('chat controller test', () => {
  before(async()=>{
      await Promise.all(users.map(userId => userDb.deleteUser(userId)))
      await Promise.all(users.map((userId, i) => userDb.insertUser({
          _id: userId, 
          basicProfile: {
            nickname: `nick-${i}`, profilePic: `profile-${i}`}})))

  })
  after(async()=> await Promise.all(users.map(userId => userDb.deleteUser(userId))))
  describe('채팅방 리스트 받기 테스트', () => {
      let statusCode, body;
    before(async()=>{
        const convDb = await chatDb.getConversationDb(),
        ts1 = new Date(),
        ts2 = new Date(new Date().setHours(new Date().getHours() -2))
        await Promise.all([
            convDb.insertOne({
                // 걸리기 x -> 같은 날짜 걸리면 안됨
                participants: [userA, userB],
                lastMessage: {
                    timestamp: ts1
                },
                joinedAt: {
                    [userA]: ts1,
                    [userB]: new Date()
                },
                unread: 0
            }),
            // 걸리기 x 나간 후 메시지 없음
            convDb.insertOne({
                participants: [userA, userC],
                lastMessage: {
                    timestamp: ts2
                },
                joinedAt: {
                    [userA]: new Date(),
                    [userC]: new Date()
                },
                unread: 0
            }),
            // 걸리기 o 나간 후 새로운 메시지 있음
            convDb.insertOne({
                participants: [userA, userD],
                lastMessage: {
                    timestamp: new Date()
                },
                joinedAt: {
                    [userA]: ts2,
                    [userD]: new Date()
                },
                unread: 0
            }),
            // 걸리기 o 메시지 오간적 없음
            convDb.insertOne({
                participants: [userA, userE],
                lastMessage: {},
                joinedAt: {
                    [userA]: ts1,
                    [userE]: new Date()
                },
                unread: 0
            })
        ])
    })
    before(async()=> {
        const httpResponse = await getConversationList({body: {user: {_id: userA}}, params: {}, query: {pagination: 1}})
        statusCode = httpResponse.statusCode
        body = httpResponse.body
    })
    after(async()=> {
        const convDb = await chatDb.getConversationDb()
        await convDb.deleteMany({participants: userA})
    })
    it("statusCode: 200", async()=>{
        expect(statusCode).to.be.a("String", '200')
    })
    it('conversations array in body', ()=>{
        expect(body).to.be.an('object').to.have.property('conversations').to.be.an("Array")
    })
    it("conversations array - length 2, userD & userE", ()=>{
        expect(body.conversations).to.be.lengthOf(2)
        && expect(body.conversations).to.include.something.that.satisfy(conv=>conv.otherUser.userId === userD)
        && expect(body.conversations).to.include.something.that.satisfy(conv=>conv.otherUser.userId === userE)
    })
    it('프로필 가지고 있기', async()=>{
        expect(body.conversations).to.include.something.that.have.keys(['lastMessage', '_id', 'unread', 'otherUser'])
    })
  });
  describe('채팅방 리스트 받기 - pagination 용 테스트', () => {
    before(async()=>{
        const manyUsers = [...users, ...users, ...users].filter(x => x!==userA)
        await Promise.all(manyUsers.map((userId, i) => {
            return chatDb.insertConversation({
                participants: [userA, userId],
                lastMessage: { timestamp: new Date()},
                joinedAt: {[userA]: startTime, [userId]: startTime}})
        }))
    })
    after(async()=> {
        const convDb = await chatDb.getConversationDb()
        convDb.deleteMany({participants: userA})
    })
    it("총 12개의 채팅방이 존재해야 함", async()=>{
        const convDb = await chatDb.getConversationDb(),
        conversation = await convDb.find({participants: userA}).count()
        expect(conversation).to.eq(12)
    })
    it('1페이지 받아오기', async()=>{
        const {statusCode, body} = await getConversationList({params: {}, body: {user: {_id: userA}}, query: {pagination: 1}})
        expect(body).to.haveOwnProperty('conversations').to.be.an("array").to.be.lengthOf(10)
    })
    it('2페이지 받아오기 - 2명', async()=>{
        const {body} = await getConversationList({params: {}, body: {user: {_id: userA}}, query: {pagination: 2}})
        expect(body).to.haveOwnProperty('conversations').to.be.an('array').to.be.lengthOf(2)
    })
  });
  describe('방 나가기 및 옛날 파일 지우기', () => {
      // 이거 파일 다 지워지니까 무조건 잘 관리하기
      const files = [
        "https://meet-testing1.s3.ap-northeast-2.amazonaws.com/1644299772631-aaccd98fdd1842a5ac86fbd283e2a07c.jpg",
        "https://meet-testing1.s3.ap-northeast-2.amazonaws.com/1644299772632-60a6b9743c444914a817a93a153dafa8.jpg",
        "https://meet-testing1.s3.ap-northeast-2.amazonaws.com/1644299772638-b9e6ff9f6e284e70913c7700984ea2e6.jpg"
    ]
    let statusCode, body;
    before(async()=>{
        // 메시지
        await Promise.all(files.map(content => chatDb.insertMessage(ChatMessage({conversationId: convId1, from: userA, to: userB, contentType: 'image', content}))))
        await Promise.all([
            chatDb.insertMessage(ChatMessage({conversationId: convId1, from: userA, to: userB, contentType: 'text', content: '1'})),
            chatDb.insertMessage(ChatMessage({conversationId: convId1, from: userA, to: userB, contentType: 'text', content: '1'})),
            chatDb.insertMessage(ChatMessage({conversationId: convId1, from: userA, to: userB, contentType: 'text', content: '1'}))
        ])
        // 채팅방
        // NOTE 채팅방을 먼저 저장하면 채팅방에서 제일 오래된 날짜를 가지고 와서 그것보다 오래된 메시지들을 지우는 것인데
        // 오래된 날짜보다 메시지 저장 날짜가 더 오래되지 않아서 마지막에 저장해 줌
        await chatDb.insertConversation(ChatConversation({_id: convId1, participants: [userA, userB]}))
        const res = await putConversation({params: {conversationId: convId1}, body: {user: {_id: userA}}})
        statusCode = res.statusCode
        body = res.body
    })
    after(async()=>{
        const convDb = await chatDb.getConversationDb()
        convDb.deleteMany({participants: userA})
    })
    it('statusCode: 200', ()=>{
        expect(statusCode).to.be.a('string', '200')
    })
    it('body: updatedObject', ()=>{
        expect(body.updated).to.be.an('object').to.haveOwnProperty('joinedAt').to.haveOwnProperty(userA).to.be.greaterThan(body.updated.joinedAt[userB])
    })
    it('should have deleted old messages', async()=>{
        const mDb = await chatDb.getMessageDb()
        const count = await mDb.find().count()
        expect(count).to.eql(0)
    })
  });
  describe('메시지 리스트 받기', () => {
      let timestamp
      const user1 = 'test-get-message-list-user-1',
      user2 = 'test-get-message-list-user-2'
    before(async()=>{
        const messages = []
        messages.length = 20
        messages.fill('i')
        await chatDb.insertConversation(ChatConversation({_id: convid5, participants: [user1, user2]}))
        for(let i =0; i < messages.length; i++){
            await chatDb.insertMessage({
                conversationId: convid5,
                from: user1, 
                to: user2,
                contentType: 'text',
                content: 'test1',
                timestamp: new Date()
            })
        }
        await chatDb.updateJoinedAtConversation(convid5, user1)
        messages.length = 5
        for(let i =0; i < messages.length; i++){
            await chatDb.insertMessage({
                conversationId: convid5,
                from: user1, 
                to: user2,
                contentType: 'text',
                content: 'test2',
                timestamp: new Date()
            })
        }
    })
    after(async()=>{
        const convDb = await chatDb.getConversationDb(),
        msgDb = await chatDb.getMessageDb()
        await convDb.deleteOne({_id: convid5})
        await msgDb.deleteMany({conversationId: convid5})
    })
    it('메시지 총 25개 저장되어 있어야 함', async()=>{
        const msgDb = await chatDb.getMessageDb(),
        messages = await msgDb.find({conversationId: convid5}).sort({timestamp: -1}).toArray(),
        conversation = await (await chatDb.getConversationDb()).findOne({_id: convid5})
        expect(messages).to.be.lengthOf(25)
        && expect(conversation).to.be.an('object')
    })
    it('user b 1페이지 받기 - 15개', async()=>{
        const {body} = await getConversation({params: {conversationId: convid5}, query: {}, body: {user: {_id: user2}}})
        timestamp = body.messages[body.messages.length -1].timestamp
        expect(body).to.haveOwnProperty('messages').to.be.an('array').to.be.lengthOf(15)
    })
    it('user b 2페이지 받기 - 10개', async()=>{
        console.log(`timestamp: ${timestamp}`)
        const {body} = await getConversation({params: {conversationId: convid5}, query: {timestamp}, body: {user: {_id: user2}}})
        expect(body).to.haveOwnProperty('messages').to.be.an('array').to.be.lengthOf(10)
    })
    it('user a 방 나갔다 오기 - 1페이지 - 5개', async()=>{
        const {body} = await getConversation({params: {conversationId: convid5}, query: {}, body: {user: {_id: user1}}})
        expect(body).to.haveOwnProperty('messages').to.be.an('array').to.be.lengthOf(5)
    })
  });
  describe('오래된 메시지 지우기', () => {
      const user1 = 'delete-old-chat-user-1',
      user2 = 'delete-old-chat-user-2'
    before(async()=>{
        const conversationId = await chatDb.insertConversation({
            participants: [user1, user2],
            lastMessage: {timestamp: new Date(new Date().setDate(new Date().getDate() - 31))}
        })
        await chatDb.insertMessage({conversationId})
        await deleteOldChat()
    })
    it('30일 전 메시지 기록 지우기', async()=>{
        const check = await chatDb.getConversations(user1)
        expect(check).to.be.empty
    })
  });
  
});