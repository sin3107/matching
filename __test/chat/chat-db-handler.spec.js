import { expect, use } from "chai"
import chaiThings from 'chai-things'
import { chatDb, makeDb, userDb } from "../../db-handler/index.js"
import { ChatConversation, ChatMessage } from "../../models/index.js"
use(chaiThings)


const userA = 'chat-db-handler-test-user1',
userB = 'chat-db-handler-test-user2',
userC = 'chat-db-handler-test-user3',
userD = 'chat-db-handler-test-user4',
users = [userA, userB, userC, userD],
conversationId = 'chat-db-handler-test-conversation'

describe('test chat db', () => {
  before(async()=>{
    await Promise.all([
        userDb.insertUser({_id: userA, basicProfile: {nickname: `01`, profilePic: 'a'}, test: 'test'}),
        userDb.insertUser({_id: userB, basicProfile: {nickname: `01`, profilePic: 'a'}, test: 'test'}),
        userDb.insertUser({_id: userC, basicProfile: {nickname: `011`, profilePic: 'a'}, test: 'test'}),
        userDb.insertUser({_id: userD, basicProfile: {nickname: `10`, profilePic: 'a'}, test: 'test'}),
    ])
  })
  after(async()=>{
      await Promise.all(users.map(_id => userDb.deleteUser(_id)))
  })
  describe('get joined at 테스트', () => {
    before(async()=>{
        const convDb = (await makeDb()).collection('conversation')
        await convDb.insertOne(ChatConversation({_id: conversationId, participants: [userA, userB]}))
    })
    after(async()=>{
        const convDb = (await makeDb()).collection('conversation')
        await convDb.deleteOne({participants: userA})
    })
    it("joinedAt 제대로 가져오기", async()=>{
        const joinedAt = await chatDb.getJoinedAt(userA, conversationId)
        expect(joinedAt).to.be.a("Date")
    })
    it('joinedAt 없음 - undefined return', async()=>{
        const joinedAt = await chatDb.getJoinedAt(userA, 'af')
        expect(joinedAt).to.be.undefined
    })
    it('joinedAt 업데이트 하기', async()=>{
        const {joinedAt} = await chatDb.updateJoinedAtConversation(conversationId, userA)
        expect(joinedAt).to.be.an('object')
        && expect(joinedAt).to.haveOwnProperty(userA).to.be.greaterThan(joinedAt[userB])
    })
  });
  describe('닉네임으로 검색하기', () => {
    before(async()=>{
        await Promise.all([
            chatDb.insertConversation(ChatConversation({participants: [userA, userB]})),
            chatDb.insertConversation(ChatConversation({participants: [userA, userC]})),
            chatDb.insertConversation(ChatConversation({participants: [userA, userD]}))
        ])
    })
    after(async()=>{
        await chatDb.deleteConversations(userA)
    })
    it('01 닉네임으로 검색 userb & userc', async()=>{
        const result = await chatDb.getConversationsByNickname(userA, '01', 1)
        expect(result).to.be.an('array').to.be.lengthOf(2)
        && expect(result).to.include.something.that.have.deep.property('participants', [userA, userB])
        && expect(result).to.include.something.that.have.deep.property('participants', [userA, userC])
    })
    it('10 닉네임 검색 user d', async()=>{
        const result = await chatDb.getConversationsByNickname(userA, '10', 1)
        expect(result).to.be.an('array').to.be.lengthOf(1)
        && expect(result).to.include.something.that.have.deep.property('participants', [userA, userD])
    })
    // it('otherUser field 확인', async()=>{
    //     const result = await chatDb.getConversations(userA, 1)
    //     expect(result).to.be.an('array')
    //     && expect(result).to.include.something.that.have.deep.keys(['otherUser.userId', 'otherUser.nickname'])
    // })
  });
  
});


// describe("test chat db", ()=>{
    // describe('get db', ()=>{
    //     it('should get message-temporarly db', async()=>{
    //         const db = await chatDb.getMessageDb(conversationId);
    //         expect(db.s.namespace).to.have.property('collection', conversationId)
    //     })
    //     it('should get conversation db', async()=>{
    //         const db = await chatDb.getConversationDb();
    //         expect(db.s.namespace).to.have.property('collection', 'conversation')
    //     })
    // })
    // describe('insert conversation', () => {
    //     const conversation = ChatConversation({participants: [userA, userB]});
    //     let insertedId;
    //     after(async()=> chatDb.deleteConversation({_id: insertedId}));
    //     it("should return inserted id after insert conversation", async()=>{
    //         insertedId = await chatDb.insertConversation(conversation)
    //         expect(insertedId).to.be.a('string', conversation._id)
    //     })
    // })
    
    // describe('isnert message', ()=>{
    //     let messageId;
    //     after(async()=>{
    //         const db = await chatDb.getMessageDb(conversationId);
    //         db.deleteOne({_id: messageId})
    //     })
    //     it('should insert message and return inserted id', async()=>{
    //         const message = ChatMessage({conversationId, from: '198', to: '833', contentType:'text', content: 'one step'})
    //         messageId = await chatDb.insertMessage(message, conversationId);
    //         expect(messageId).to.be.a('string', message._id)
    //     })
    // })
    // // describe('get message testing', ()=>{
    // //     let sampleMsgs = [],
    // //     lastMessage;
    // //     before(async()=>{
    // //         sampleMsgs[sampleMsgs.length] = await chatDb.insertMessage(ChatMessage({conversationId, from: userA, to: userB, contentType:'text', content: 'a'}), conversationId);
    // //         sampleMsgs[sampleMsgs.length] = await chatDb.insertMessage(ChatMessage({conversationId, from: userA, to: userB, contentType:'text', content: 'b'}), conversationId);
    // //         sampleMsgs[sampleMsgs.length] = await chatDb.insertMessage(ChatMessage({conversationId, from: userA, to: userB, contentType:'text', content: 'asdf'}), conversationId);
    // //         sampleMsgs[sampleMsgs.length] = await chatDb.insertMessage(ChatMessage({conversationId, from: userA, to: userB, contentType:'text', content: 'adsf'}), conversationId);
    // //     })
    // //     after(async()=>{
    // //         const db = await chatDb.getMessageDb(conversationId)
    // //         sampleMsgs.forEach(item => db.deleteOne({_id: item}))
    // //     })
    // //     it('should get joined at time', async()=>{
    // //         const joinedAt = await chatDb.getJoinedAt(userA, conversationId);
    // //         expect(joinedAt).to.be.a('Date')
    // //     })
    // //     it('should get messages of current 15', async()=>{
    // //         const messages = await chatDb.getMessages({userId: userA, conversationId});
    // //         lastMessage = messages[messages.length -1]
    // //         expect(messages).to.be.an('array').and.to.be.lengthOf(15)
    // //     })
    // //     it('should get current messages after 15', async()=>{
    // //         const messages2 = await chatDb.getMessages({userId: userA, conversationId, timestamp:lastMessage.timestamp})
    // //         expect(messages2).to.be.an('array').and.to.be.lengthOf(15)
    // //         && expect(messages2[0]).to.haveOwnProperty('timestamp').to.be.lessThan(lastMessage.timestamp)
    // //     })
    // // })
    // describe('get old messages testing', () => {
    //     before(async()=> {
    //         await chatDb.insertMessage(ChatMessage({conversationId, from: userA, to: userB, contentType: 'image', content: 'image path'}), conversationId)
    //         await chatDb.insertMessage(ChatMessage({conversationId, from: userA, to: userB, contentType: 'audio', content: 'audio path'}), conversationId)
    //         await chatDb.insertMessage(ChatMessage({conversationId, from: userA, to: userB, contentType: 'image', content: 'image path'}), conversationId)
    //     })
    //     after(async()=> (await chatDb.getMessageDb(conversationId)).drop())
    //     it('should return array with messages', async()=> {
    //         const mesages = await chatDb.getOldFileMessages(conversationId, new Date())
    //         expect(mesages).to.be.an('array').to.be.lengthOf(3)
    //         && expect(mesages).to.not.include.something.that.haveOwnProperty('contentType', 'text')
    //     })
    //     it('should return empty array if no match', async()=>{
    //         const mesages = await chatDb.getOldFileMessages(conversationId, new Date(new Date().setDate(new Date().getDate() - 1)))
    //         expect(mesages).to.be.an('array').to.be.lengthOf(0)
    //     })
    // })
    // describe('delete old mesages', () => {
    //     before(async()=> {
    //         await chatDb.insertMessage(ChatMessage({conversationId, from: userA, to: userB, contentType: 'image', content: 'image path'}), conversationId)
    //         await chatDb.insertMessage(ChatMessage({conversationId, from: userA, to: userB, contentType: 'audio', content: 'audio path'}), conversationId)
    //         await chatDb.insertMessage(ChatMessage({conversationId, from: userA, to: userB, contentType: 'text', content: 'text'}), conversationId)
    //     })
    //     after(async()=> (await chatDb.getMessageDb(conversationId)).drop())
    //     it("should delete all old messages", async()=> {
    //         await chatDb.deleteOldMessages(conversationId, new Date())
    //         const cursor = (await chatDb.getMessageDb(conversationId)).find()
    //         const count = await cursor.count()
    //         expect(count).to.be.equal(0)
    //     })
    // })
    
// })