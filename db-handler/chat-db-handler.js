export default function makeChatDb(makeDb) {
  return Object.freeze({
    getMessageDb,
    getConversationDb,
    insertMessage,
    getJoinedAt,
    getMessages,
    getConversations,
    getAConversation,
    getConversationsByNickname,
    getConversationByUsers,
    insertConversation,
    readConversation,
    deleteConversationById,
    deleteConversationByUsers,
    deleteMessages,
    deleteConversations,
    getOldConversations,
    getOldFileMessages,
    deleteOldMessages,
    updateJoinedAtConversation,
    updateLastMessage,
    getAllFileMessagebyUser,
    deleteAllMessageByUser,
    getMyUnreadChat,
  });
  /**
   * return message db collection
   * @returns {Promsie<object>} db
   */
  async function getMessageDb() {
    try {
      const db = await makeDb();
      return await db.collection("message");
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * return conversation collection
   * @returns {Promise<object>}
   */
  async function getConversationDb() {
    try {
      const db = await makeDb();
      return await db.collection("conversation");
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * insert message and return inserted id
   * @param {object} message message model
   * @returns {Promise<String>} insertedId
   * @error log & throw
   */
  async function insertMessage(message) {
    try {
      const db = await getMessageDb(),
        { insertedId } = await db.insertOne(message);
      return insertedId;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * get joined at date
   * @param {String} userId
   * @param {String} conversationId
   * @returns {Promise<Date>} joined at date
   */
  async function getJoinedAt(userId, conversationId) {
    try {
      const db = await getConversationDb(),
        query = { _id: conversationId },
        conversation = await db.findOne(query);
      if (!conversation) return undefined;
      else return conversation.joinedAt[userId];
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * get user id and conversation id, return all messages in conversation id with joined at time filtering
   * @param {String} userId
   * @param {String} conversationId
   * @param {Date} timestamp
   * @returns {Promise<Array>} or null
   * @error log & throw
   */
  async function getMessages({
    userId,
    conversationId,
    timestamp = new Date(),
  }) {
    try {
      const limit = 15,
        db = await getMessageDb(),
        joinedAt = await getJoinedAt(userId, conversationId),
        query = {
          conversationId,
          timestamp: { $gt: joinedAt, $lt: timestamp },
        },
        projection = { _id: false };
      return await db
        .find(query, { projection })
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * file type 옛날 메시지만 찾기(ex: image, audio)
   * @param {String} conversationId
   * @param {Date} timestamp
   * @returns {Promise<Array>}
   * @error log & throw
   */
  async function getOldFileMessages(conversationId, timestamp) {
    try {
      const db = await getMessageDb(),
        query = {
          conversationId,
          contentType: { $ne: "text" },
          timestamp: { $lt: timestamp },
        },
        projection = { content: 1 };
      return db.find(query, { projection }).toArray();
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * delete all messages older than timestamp
   * @param {String} conversationId
   * @param {Date} timestamp
   * @returns {Promise<void>}
   * @error log & throw
   */
  async function deleteOldMessages(conversationId, timestamp) {
    try {
      const db = await getMessageDb(),
        query = { conversationId, timestamp: { $lt: timestamp } };
      return db.deleteMany(query);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   *
   * @param {Object} conversation conversation object
   * @returns inserted document's id
   * @error log & throw
   */
  async function insertConversation(conversation) {
    try {
      const db = await getConversationDb();
      const { insertedId } = await db.insertOne(conversation);
      return insertedId;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * last message와 unread 업데이트하기
   * @param {String} conversationId
   * @param {Object} lastMessage
   * @returns {Promise<void>}
   * @error log & throw
   */
  async function updateLastMessage(conversationId, lastMessage) {
    try {
      const db = await getConversationDb(),
        query = { _id: conversationId },
        update = { $set: { lastMessage }, $inc: { unread: 1 } };
      await db.findOneAndUpdate(query, update);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * update joined at - when leaving conversation
   * @param {String} conversationId
   * @param {String} userId
   * @returns {Promise<object>} updated document
   * @error log & trhrow
   */
  async function updateJoinedAtConversation(conversationId, userId) {
    try {
      const joinedAtKey = `joinedAt.${userId}`,
        db = await getConversationDb(),
        query = { _id: conversationId },
        update = { $set: { [joinedAtKey]: new Date() } },
        option = { returnDocument: "after" },
        { value } = await db.findOneAndUpdate(query, update, option);
      return value;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   *
   * @param {String} id conversation id
   * @returns one updated document
   * @error log & throw
   */
  async function readConversation(id) {
    try {
      const db = await getConversationDb();
      const query = { _id: id };
      const update = { $set: { unread: 0 } };
      const option = { returnDocument: "after" };
      const result = await db.findOneAndUpdate(query, update, option);
      return result;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * return conversation list of one user
   * @param {String} userId
   * @returns {Promise<Array>}
   * @error throw & log
   */
  async function getConversations(userId, pagination = 1) {
    try {
      const db = await getConversationDb();
      const limit = 10,
        myConversationListStage = {
          $match: {
            participants: userId,
            $or: [
              {
                $expr: {
                  $gte: ["$lastMessage.timestamp", `$joinedAt.${userId}`],
                },
              },
              { lastMessage: { $eq: {} } },
            ],
          },
        },
        joinUserDbStage = {
          $lookup: {
            from: "user",
            localField: "participants",
            foreignField: "_id",
            as: "otherUser",
          },
        },
        filteringMyIdStage = {
          $project: {
            _id: 1,
            lastMessage: 1,
            unread: 1,
            participants: 1,
            joinedAt: 1,
            otherUser: {
              $filter: {
                input: "$otherUser",
                as: "otherUser",
                cond: { $ne: ["$$otherUser._id", userId] },
              },
            },
          },
        },
        projectionStage = {
          $project: {
            _id: 1,
            lastMessage: 1,
            unread: 1,
            participants: 1,
            joinedAt: 1,
            "otherUser._id": 1,
            "otherUser.basicProfile.nickname": 1,
            "otherUser.basicProfile.profilePic": 1,
          },
        },
        res = await db
          .aggregate([
            myConversationListStage,
            joinUserDbStage,
            filteringMyIdStage,
            projectionStage,
          ])
          .sort({ "lastMessage.timestamp": -1 })
          .skip((pagination - 1) * limit)
          .limit(limit)
          .toArray();

      // formatting - aggregation 결과가 계속 array 형식으로 나오기 때문에 object로 바꿔준다
      return res.map(({ otherUser, ...rest }) => {
        return {
          ...rest,
          otherUser: {
            userId: otherUser[0]._id,
            nickname: otherUser[0].basicProfile.nickname,
            profilePic: otherUser[0].basicProfile.profilePic,
          },
        };
      });
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 닉네임으로 채팅방 검색하기
   * @param {String} userId
   * @param {String} nickname
   * @param {Number} pagination
   * @returns {Promise<Array>}
   */
  async function getConversationsByNickname(userId, nickname, pagination) {
    try {
      const db = await getConversationDb();
      const limit = 10,
        myConversationListStage = { $match: { participants: userId } },
        joinUserDbStage = {
          $lookup: {
            from: "user",
            localField: "participants",
            foreignField: "_id",
            as: "otherUser",
          },
        },
        filteringMyIdStage = {
          $project: {
            _id: 1,
            lastMessage: 1,
            unread: 1,
            participants: 1,
            otherUser: {
              $filter: {
                input: "$otherUser",
                as: "otherUser",
                cond: { $ne: ["$$otherUser._id", userId] },
              },
            },
          },
        },
        findNicknameRegexStage = {
          $match: {
            "otherUser.basicProfile.nickname": {
              $regex: nickname,
              $options: "i",
            },
          },
        },
        projectionStage = {
          $project: {
            _id: 1,
            lastMessage: 1,
            unread: 1,
            participants: 1,
            "otherUser._id": 1,
            "otherUser.basicProfile.nickname": 1,
            "otherUser.basicProfile.profilePic": 1,
          },
        },
        res = await db
          .aggregate([
            myConversationListStage,
            joinUserDbStage,
            filteringMyIdStage,
            findNicknameRegexStage,
            projectionStage,
          ])
          .skip((pagination - 1) * limit)
          .limit(limit)
          .toArray();
      // formatting - aggregation 결과가 계속 array 형식으로 나오기 때문에 object로 바꿔준다
      return res.map(({ otherUser, ...rest }) => {
        return {
          ...rest,
          otherUser: {
            userId: otherUser[0]._id,
            nickname: otherUser[0].basicProfile.nickname,
            profilePic: otherUser[0].basicProfile.profilePic,
          },
        };
      });
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  async function getAConversation(conversationId) {
    try {
      const db = await getConversationDb(),
        query = { _id: conversationId },
        conversation = await db.findOne(query);
      return conversation;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 참여자로 채팅방 찾기
   * @param {String} user1
   * @param {String} user2
   * @returns {Promise<object>}
   */
  async function getConversationByUsers(user1, user2) {
    try {
      const db = await getConversationDb(),
        query = { participants: { $all: [user1, user2] } };
      return db.findOne(query);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 아이디로 채팅방 지우기
   * @param {String} conversationId
   * @returns {Promise<void>}
   */
  async function deleteConversationById(conversationId) {
    try {
      const db = await getConversationDb(),
        query = { _id: conversationId };
      return db.deleteOne(query);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 유저로 채팅방 지우기
   * @param {String} user1
   * @param {String} user2
   * @returns {Promise<void>}
   */
  async function deleteConversationByUsers(user1, user2) {
    try {
      const db = await getConversationDb(),
        query = { participants: { $all: [user1, user2] } };
      return db.deleteOne(query);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 채팅방 속 메시지 전부 지우기
   * @param {String} conversationId
   * @returns {Promise<void>}
   */
  async function deleteMessages(conversationId) {
    try {
      const db = await getMessageDb(),
        query = { conversationId };
      return db.deleteMany(query);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   *
   * @param {String} userId
   * @returns deleted document counts
   * @error log & throw
   */
  async function deleteConversations(userId) {
    try {
      const db = await getConversationDb();
      const query = { participants: userId };
      const result = await db.deleteMany(query);
      return result.deletedCount;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * return all conversations which are inactive for more than 30 days
   * @returns {Promise<Array>} array or null
   */
  async function getOldConversations() {
    try {
      const db = await getConversationDb(),
        days_ago_30 = new Date(new Date().setDate(new Date().getDate() - 30)),
        query = { "lastMessage.timestamp": { $lte: days_ago_30 } };
      return db.find(query).toArray();
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 해당 유저와 관련된 모든 파일 메시지 가지고 오기
   * @param {String} userId
   * @returns {Promise<Array>}
   */
  async function getAllFileMessagebyUser(userId) {
    try {
      const db = await getMessageDb(),
        query = {
          $or: [
            { from: userId, contentType: { $ne: "text" } },
            { to: userId, contentType: { $ne: "text" } },
          ],
        },
        projection = { content: 1 };
      return db.find(query, { projection }).toArray();
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 유저와 관련된 모든 채팅 메시지 지우기
   * @param {String} userId
   * @returns {Promise<void>}
   */
  async function deleteAllMessageByUser(userId) {
    try {
      const db = await getMessageDb(),
        query = { $or: [{ from: userId }, { to: userId }] };
      return db.deleteMany(query);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async function getMyUnreadChat(userId) {
    try {
      const db = await getConversationDb();
      const result = await db.findOne({
        "lastMessage.to": userId,
        unread: { $ne: 0 },
      });
      if (!result) return false;
      else return true;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
}
