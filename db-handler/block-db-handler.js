export default function makeBlockDb(makeDb) {
  return Object.freeze({
    getBlockDb,
    insertBlock,
    getBlockBetweenTwoUser,
    getAllBlockListByUser,
    getBlockedByOneUserList,
    getBlockToUser,
    getBlockToPhone,
    getAllBlocks,
    getBlockToUserList,
    getBlockToPhoneList,
    updateUserId,
    unBlockUserId,
    unBlockPhone,
    deleteManyBlock,
    deleteUserIdFromBlockToPhone,
  });
  /**
   * get block collection
   * @returns {Promise<Object>} block db
   * @error log & throw
   */
  async function getBlockDb() {
    try {
      const db = await makeDb();
      return await db.collection("block");
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * insert book
   * @param {Object} block
   * @returns {Promise<String>} insertedId
   * @error log & throw
   */
  async function insertBlock(block) {
    try {
      const db = await getBlockDb();
      const { insertedId } = await db.insertOne(block);
      return insertedId;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * find where user1 and user2 has blocked
   * @param {String} userId1
   * @param {String} userId2
   * @returns {Promise<Object>} one document or undefined
   * @error log & throw
   */
  async function getBlockBetweenTwoUser(userId1, userId2) {
    try {
      const db = await getBlockDb();
      const query = {
          $or: [
            { blockBy: userId1, blockToUserId: userId2 },
            { blockBy: userId2, blockToUserId: userId1 },
          ],
        },
        projection = { _id: false };
      return await db.findOne(query, { projection });
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * find all document where user has block and blocked
   * @param {String} userId
   * @returns {Promise<Array>} array of document or null
   * @error log & throw
   */
  async function getAllBlockListByUser(userId) {
    try {
      const db = await getBlockDb();
      const query = { $or: [{ blockBy: userId }, { blockToUserId: userId }] },
        projection = { _id: false },
        cursor = db.find(query, { projection });
      if ((await db.countDocuments(query)) === 0) {
        console.log("no document found");
        return null;
      } else {
        const arr = [];
        await cursor.forEach((item) => arr.push(item));
        return arr;
      }
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * get one user id and return all list that user has blocked
   * @param {String} userId blockByUserId
   * @returns {Promise<Array>} or null
   * @error log & throw
   */
  async function getBlockedByOneUserList(userId, pagination = 1) {
    try {
      const limit = 10,
        db = await getBlockDb(),
        filteringMyBlockStage = {
          $match: { blockBy: userId, blockToUserId: { $ne: null } },
        },
        joinUserDbStage = {
          $lookup: {
            from: "user",
            localField: "blockToUserId",
            foreignField: "_id",
            as: "userInfo",
          },
        },
        toRootStage = {
          $replaceRoot: {
            newRoot: {
              $mergeObjects: [{ $arrayElemAt: ["$userInfo", 0] }, "$$ROOT"],
            },
          },
        },
        projectionStage = {
          $project: {
            userId: "$blockToUserId",
            nickname: "$basicProfile.nickname",
            profileImage: "$basicProfile.profilePic",
          },
        };
      return await db
        .aggregate([
          filteringMyBlockStage,
          joinUserDbStage,
          toRootStage,
          projectionStage,
        ])
        .skip((pagination - 1) * limit)
        .limit(limit)
        .toArray();
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * find if blockBy user has blocked phone number
   * @param {String} blockBy bloock by user id
   * @param {String} blockToPhone block to phone number
   * @returns {Promise<object>}
   * @error log & throw
   */
  async function getBlockToPhone(blockBy, blockToPhone, blockedName) {
    try {
      const db = await getBlockDb(),
        query = { blockBy, blockToPhone, blockedName };
      return db.findOne(query);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * find if blockBy user has blocked user id
   * @param {String} blockBy block by user id
   * @param {Stirng} blockToUserId block to user id
   * @returns {Promise<object>}
   */
  async function getBlockToUser(blockBy, blockToUserId) {
    try {
      const db = await getBlockDb(),
        query = { blockBy, blockToUserId: blockToUserId };
      return db.findOne(query);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  async function getAllBlocks() {
    const arr = [];
    try {
      const db = await getBlockDb(),
        query = { blockToUserId: { $ne: null } },
        cursor = db.find(query);
      await cursor.forEach(({ blockBy, blockToUserId: { userId } }) =>
        arr.push({ blockBy, blockTo: userId })
      );
      return arr;
    } catch (err) {
      console.log(err);
    }
  }
  /**
   * 유저 차단 리스트 가져오기 with Profile
   * @param {String} blockBy
   * @returns {Promise<Array}
   */
  async function getBlockToUserList(blockBy, pagination = 1) {
    try {
      const limit = 10,
        db = await getBlockDb(),
        filteringMyBlockStage = {
          $match: {
            blockBy,
            blockToPhone: { $eq: null },
          },
        },
        joinUserDbStage = {
          $lookup: {
            from: "user",
            localField: "blockToUserId",
            foreignField: "_id",
            as: "userInfo",
          },
        },
        toRootStage = {
          $replaceRoot: {
            newRoot: {
              $mergeObjects: [{ $arrayElemAt: ["$userInfo", 0] }, "$$ROOT"],
            },
          },
        },
        projectionStage = {
          $project: {
            userId: "$blockToUserId",
            nickname: "$basicProfile.nickname",
            profileImage: "$basicProfile.profilePic",
          },
        };
      return await db
        .aggregate([
          filteringMyBlockStage,
          joinUserDbStage,
          toRootStage,
          projectionStage,
        ])
        .skip((pagination - 1) * limit)
        .limit(limit)
        .toArray();
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 지인차단 리스트 가져오기 - phonenumber projection
   * @param {String} blockBy
   * @param {Number} pagination
   * @returns {Promise<Array>}
   */
  async function getBlockToPhoneList(blockBy, pagination = 1) {
    try {
      const limit = 10,
        db = await getBlockDb(),
        query = {
          blockBy,
          blockToPhone: { $ne: null },
        },
        projection = { blockToPhone: 1, blockedName: 1 };
      return db
        .find(query, { projection })
        .skip((pagination - 1) * limit)
        .limit(limit)
        .toArray();
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * get phoneNumber and userId and update blockTo.userId
   * @param {String} phoneNumber
   * @param {Promise<String>} userId
   * @error log & throw
   */
  async function updateUserId(phoneNumber, userId) {
    try {
      const db = await getBlockDb(),
        query = { blockToPhone: phoneNumber },
        update = { $set: { blockToUserId: userId } };
      await db.updateMany(query, update);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * Unblock user id
   * @param {String} blockBy
   * @param {String} userId
   * @returns {Promise<void>}
   * @error log & throw
   */
  async function unBlockUserId(blockBy, userId) {
    try {
      const db = await getBlockDb(),
        query = { blockBy: blockBy, blockToUserId: userId };
      await db.deleteOne(query);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * unblock 지인 차단
   * @param {String} blockBy
   * @param {Promise<String>} phoneNumber
   * @error log & throw
   */
  async function unBlockPhone(blockBy, phoneNumber) {
    try {
      const db = await getBlockDb(),
        query = { blockBy: blockBy, blockToPhone: phoneNumber };
      await db.deleteOne(query);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * delete all block by one user. including blockTo.userId
   * @param {String} userId
   * @returns {Promise<void>}
   * @error log & throw
   */
  async function deleteManyBlock(userId) {
    try {
      const db = await getBlockDb(),
        query = {
          $or: [
            { blockBy: userId },
            { blockToUserId: userId, blockToPhone: { $eq: null } },
          ],
        };
      await db.deleteMany(query);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 지인 차단에서 유저 아이디 전부 지우기
   * @param {String} userId
   * @returns {Promise<void>}
   */
  async function deleteUserIdFromBlockToPhone(userId) {
    try {
      const db = await getBlockDb(),
        query = { blockToUserId: userId, blockToPhone: { $ne: null } },
        update = { $set: { blockToUserId: null } };
      return db.updateMany(query, update);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
}
