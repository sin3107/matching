export default function makeUserDb(makeDb) {
  return Object.freeze({
    insertUser,
    getUser,
    findUserBySocialId,
    findUserById,
    findUserByEmail,
    findUserByPhoneNumber,
    findUserByNickname,
    findUserByReferrrer,
    findAllUserByReferrer,
    getNicknameAndProfileImage,
    getNicknameProfileImageAgeGenderAddress,
    getAgeGender,
    getMeetSettingAgeAndGender,
    getUserAddress,
    getUserPhoneNumber,
    getWholeProfile,
    getBasicProfile,
    getWholeProfileAndService,
    getReferrerCode,
    updateUser,
    updateProfile,
    updatePhone,
    updatePassword,
    updateProfilePic,
    updateExpoToken,
    sleepUserAccount,
    updateMeetSetting,
    deleteUser,
    getExpoTokens,
    deleteExpoToken,
    getSettings,
    getCoins,
    updateCoins,
    getPass,
    updatePass,
    getPrivacy,
    insertImgCheck,
    deleteUsersCheckImg,
    getMyImgCheck
  });
  /**
   *
   * @param {Object} user user model from user.js
   * @returns inserted document's id
   * @error  log & throw error
   */
  async function insertUser(user) {
    try {
      const db = await makeDb();
      const result = await db.collection("user").insertOne(user);
      const id = result.insertedId;
      return id;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   *
   * @param {Object} query ex) {_id: id}
   * @param {Object} projection Optional. ex) {email: true, ...}
   * @returns one document or null
   * @error  log & throw error
   */
  async function getUser(query, projection = {}) {
    try {
      const db = await makeDb();
      const result = await db
        .collection("user")
        .findOne(query, { projection: projection });
      return result;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   *
   * @param {String} socialId
   * @returns one document containing loginInfo.social.
   * Also return the first found object or false if nothing found
   * @error  log & throw error
   */
  async function findUserBySocialId(socialId) {
    try {
      const db = await makeDb();
      const query = { "loginInfo.socialId": socialId };
      const projection = { loginInfo: 1 };
      const user = await db.collection("user").findOne(query, { projection });
      return user;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   *
   * @param {String} id user's id
   * @param {Object} projection Optional. default: profile
   * @returns one document or null
   * @error log & throw
   */
  async function findUserById(id, projection = { _id: true }) {
    try {
      const db = await makeDb();
      const query = { _id: id };
      const result = await db
        .collection("user")
        .findOne(query, { projection: projection });
      return result;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * find user by email. return loginInfo field
   * @param {String} email
   * @returns one document or null
   * @error log & throw
   */
  async function findUserByEmail(email, projection = { loginInfo: 1 }) {
    try {
      const db = await makeDb();
      const query = { "loginInfo.email": email };
      const result = await db.collection("user").findOne(query, { projection });
      return result;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * find user by phone number. return loginInfo field
   * @param {String} phoneNumber
   * @returns one document or null
   * @error log & throws
   */
  async function findUserByPhoneNumber(phoneNumber) {
    try {
      const db = await makeDb();
      const query = { phoneNumber };
      const projection = { loginInfo: true };
      const result = await db
        .collection("user")
        .findOne(query, { projection: projection });
      return result;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * get nickname and return found user login information
   * @param {String} nickname
   * @returns {Promise<{loginInfo: object, _id: String}>}
   * @error log & throw
   */
  async function findUserByNickname(nickname) {
    try {
      const db = (await makeDb()).collection("user"),
        query = { "basicProfile.nickname": nickname },
        projection = { loginInfo: 1 },
        user = await db.findOne(query, { projection });
      return user;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 추천인 코드로 유저 찾기
   * @param {String} referrer
   * @returns {Promise<{_id: String}>}
   */
  async function findUserByReferrrer(referrer) {
    try {
      const db = (await makeDb()).collection("user"),
        query = { referrerCode: referrer },
        projection = { _id: 1 };
      return db.findOne(query, { projection });
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 해당 추천 코드를 가지고 있는 모든 유저 찾기
   * @param {String} referrer
   * @returns {Promise<Array>}
   */
  async function findAllUserByReferrer(referrer) {
    try {
      const db = (await makeDb()).collection("user"),
        query = { referrer },
        projection = { _id: 1 };
      return db.find(query, { projection }).toArray();
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * get user id and return their nickname and profile image
   * @param {String} userId userIds array
   * @returns {Promise<{nickname: string, profilePic: string}>}  or null
   * @error log & throw
   */
  async function getNicknameAndProfileImage(userId) {
    try {
      const db = (await makeDb()).collection("user"),
        query = { _id: userId },
        projection = {
          "basicProfile.nickname": 1,
          "basicProfile.profilePic": 1,
        },
        user = await db.findOne(query, { projection });
      if (!user) return undefined;
      else return user.basicProfile;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 닉네임 프로필 사진 나이 성별 주소 다 받기
   * @param {String} userId
   * @returns {Promise<{nickname: string, profilePic: string, age: Date, gender: string, sido: string}>}
   * @error log & throw
   */
  async function getNicknameProfileImageAgeGenderAddress(userId) {
    try {
      const db = (await makeDb()).collection("user"),
        query = { _id: userId },
        projection = {
          "basicProfile.nickname": 1,
          "basicProfile.profilePic": 1,
          "basicProfile.age": 1,
          "basicProfile.gender": 1,
          "basicProfile.address.sido": 1,
          "basicProfile.address.sigungu": 1,
        },
        user = await db.findOne(query, { projection });
      if (!user) return undefined;
      else
        return {
          ...user.basicProfile,
          sido: user.basicProfile.address.sido,
        };
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 나이랑 성별 가져오기
   * @param {String} userId
   * @returns {Promise<{age: Date, gender: String}>}
   */
  async function getAgeGender(userId) {
    try {
      const db = (await makeDb()).collection("user"),
        projection = {
          "basicProfile.age": 1,
          "basicProfile.gender": 1,
        },
        user = await db.findOne({ _id: userId }, { projection });
      if (!user) return undefined;
      return {
        age: user.basicProfile.age,
        gender: user.basicProfile.gender,
      };
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  async function getMeetSettingAgeAndGender(userId) {
    try {
      const db = (await makeDb()).collection("user"),
        query = { _id: userId },
        projection = {
          "meetSetting.gender": 1,
          "meetSetting.age": 1,
        },
        user = await db.findOne(query, { projection });
      if (!user) return undefined;
      else
        return {
          age: user.meetSetting.age,
          gender: user.meetSetting.gender,
        };
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 유저 주소 가져오기
   * @param {String} userId
   * @returns {Promise<{sido: String, coordinates: Array, updatedAt: Date, sigungu: String, fullAddress: String}>}
   * @error log & trhow
   */
  async function getUserAddress(userId) {
    try {
      const db = (await makeDb()).collection("user"),
        query = { _id: userId },
        projection = {
          "basicProfile.address": 1,
        },
        userInfo = await db.findOne(query, { projection });
      if (!userInfo) return undefined;
      else return userInfo.basicProfile.address;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 유저 전화번호 가져오기
   * @param {String} userId
   * @returns {Promise<{sido: String, coordinates: Array, updatedAt: Date, sigungu: String, fullAddress: String}>}
   * @error log & trhow
   */
  async function getUserPhoneNumber(userId) {
    try {
      const db = (await makeDb()).collection("user"),
        query = { _id: userId },
        projection = {
          phoneNumber: 1,
        },
        userInfo = await db.findOne(query, { projection });
      if (!userInfo) return undefined;
      else return userInfo.phoneNumber;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * get user id and return whole profile
   * @param {String} _id user id
   * @returns {Promise<{basicProfile: object, detailProfile: object}>}
   */
  async function getWholeProfile(_id) {
    try {
      const db = (await makeDb()).collection("user"),
        query = { _id },
        projection = {
          basicProfile: 1,
          detailProfile: 1,
        },
        { basicProfile, detailProfile } = await db.findOne(query, {
          projection,
        });
      return { basicProfile, detailProfile };
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * get user id and return only basicProfile
   * @param {String} _id user id
   * @returns {Promise<{basicProfile: object}>}
   */
  async function getBasicProfile(_id, myId, serviceList) {
    try {
      const db = (await makeDb()).collection("user");

      let userMatch = {
          $match: {
            _id: _id,
          },
        },
        joinChatStage = {
          $lookup: {
            from: "itemLog",
            let: {
              ida: "$_id",
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      {
                        $or: [
                          {
                            $and: [
                              { $eq: ["$otherUserId", "$$ida"] },
                              { $eq: ["$userId", `${myId}`] },
                            ],
                          },
                          {
                            $and: [
                              { $eq: ["$userId", "$$ida"] },
                              { $eq: ["$otherUserId", `${myId}`] },
                            ],
                          },
                        ],
                      },
                      {
                        $eq: ["$itemId", serviceList["chatId"]],
                      },
                    ],
                  },
                },
              },
              {
                $lookup: {
                  from: "conversation",
                  let: {
                    logId: "$_id",
                  },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $eq: ["$participants", ["$$ida", `${myId}`]],
                        },
                      },
                    },
                  ],
                  as: "conversation",
                },
              },
            ],
            as: "chat",
          },
        };

      // joinProfileStage = { $lookup: {
      //     from: 'itemLog',
      //     let: {
      //         ida: '$_id'
      //     },
      //     pipeline: [
      //         { $match: {
      //             $expr: {
      //                 $and : [
      //                     { $or: [
      //                         {$and: [
      //                             {$eq: [ '$otherUserId', '$$ida' ]}, {$eq: [ '$userId', `${myId}` ]}
      //                         ]},
      //                         {$and: [
      //                             {$eq: [ '$userId', '$$ida' ]}, {$eq: [ '$otherUserId', `${myId}` ]}
      //                         ]}
      //                     ] },
      //                     {
      //                         $eq: [ '$itemId', serviceList['profileId'] ]
      //                     }
      //                 ]
      //             }
      //         } }
      //     ],
      //     as: 'profile'
      // } }

      const user = await db.aggregate([userMatch, joinChatStage]).toArray();

      if (!user[0]) return undefined;
      // if(user[0].chat[0]) user[0].chat = true
      // else user[0].chat = false

      return {
        basicProfile: user[0].basicProfile,
        chat: user[0].chat,
      };
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * get user id and return whole profile
   * @param {String} _id user id
   * @returns {Promise<{basicProfile: object, detailProfile: object}>}
   */
  async function getWholeProfileAndService(_id, myId, serviceList) {
    try {
      const db = (await makeDb()).collection("user");

      let userMatch = {
          $match: {
            _id: _id,
          },
        },
        joinChatStage = {
          $lookup: {
            from: "itemLog",
            let: {
              ida: "$_id",
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      {
                        $or: [
                          {
                            $and: [
                              { $eq: ["$otherUserId", "$$ida"] },
                              { $eq: ["$userId", `${myId}`] },
                            ],
                          },
                          {
                            $and: [
                              { $eq: ["$userId", "$$ida"] },
                              { $eq: ["$otherUserId", `${myId}`] },
                            ],
                          },
                        ],
                      },
                      {
                        $eq: ["$itemId", serviceList["chatId"]],
                      },
                    ],
                  },
                },
              },
              {
                $lookup: {
                  from: "conversation",
                  let: {
                    logId: "$_id",
                  },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $eq: ["$participants", ["$$ida", `${myId}`]],
                        },
                      },
                    },
                  ],
                  as: "conversation",
                },
              },
            ],
            as: "chat",
          },
        };

      const user = await db.aggregate([userMatch, joinChatStage]).toArray();

      if (!user[0]) return undefined;
      // if(user[0].chat[0]) user[0].chat = true
      // else user[0].chat = false

      return {
        basicProfile: user[0].basicProfile,
        detailProfile: user[0].detailProfile,
        chat: user[0].chat,
      };
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 추천인 코드 얻기
   * @param {String} userId
   * @returns {Promise<{referrerCode: String}>}
   */
  async function getReferrerCode(userId) {
    try {
      const db = (await makeDb()).collection("user"),
        query = { _id: userId },
        projection = {
          referrerCode: 1,
        };
      return db.findOne(query, { projection });
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * get query, update and return updated document
   * @param {Object} query ex) {_id: id}
   * @param {Object} update ex) {$set: {nickname: nickname}, ...}
   * @param {Object} projection Optional default: loginInfo
   * @returns one updated document
   * @error log & throw
   */
  async function updateUser({
    query,
    update,
    projection = { loginInfo: true },
  }) {
    try {
      const db = await makeDb();
      const option = { returnDocument: "after", projection };
      const result = await db
        .collection("user")
        .findOneAndUpdate(query, update, option);
      return result.value;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 유저 기본 프로필과 상세 프로필 업데이트
   * @param {String} userId
   * @param {object} basicProfile
   * @param {object} detailProfile
   * @returns {Promise<{_id: String, basicProfile: object, detailProfile: object}>}
   */
  async function updateProfile(userId, basicProfile, detailProfile) {
    try {
      const db = (await makeDb()).collection("user"),
        query = { _id: userId },
        update = { $set: { basicProfile, detailProfile } },
        option = {
          returnDocument: "after",
          projection: { basicProfile: 1, detailProfile: 1 },
        },
        { value } = await db.findOneAndUpdate(query, update, option);
      return value;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * get user id and update new password
   * @param {String} userId
   * @param {String} password new password
   * @error log & throw
   */
  async function updatePassword(userId, password) {
    try {
      const db = (await makeDb()).collection("user"),
        query = { _id: userId },
        update = { $set: { "loginInfo.password": password } };
      await db.findOneAndUpdate(query, update);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * get user id and profile pic, update profile pic
   * @param {String} userId
   * @param {String} profilePic profile picture uri
   * @returns {Promise<{_id: String, basicProfile: {profilePic: String}}>}
   * @error log & throw
   */
  async function updateProfilePic(userId, profilePic, mainPic) {
    try {
      const db = (await makeDb()).collection("user"),
        query = { _id: userId },
        update = {
          $set: {
            "basicProfile.profilePic": profilePic,
            "detailProfile.mainPic": mainPic,
          },
        },
        option = {
          returnDocument: "after",
          projection: { "basicProfile.profilePic": 1 },
        },
        { value } = await db.findOneAndUpdate(query, update, option);
      return value;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * get user id and update phone number
   * @param {String} userId
   * @param {String} phoneNumber
   * @returns {Promise<{_id: String, phoneNumber: String}>}
   * @error log & throw
   */
  async function updatePhone(userId, phoneNumber) {
    try {
      const db = (await makeDb()).collection("user"),
        query = { _id: userId },
        update = { $set: { phoneNumber } },
        option = { returnDocument: "after", projection: { phoneNumber: 1 } },
        { value } = await db.findOneAndUpdate(query, update, option);
      return value;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * make user sleep
   * @param {String} userId
   * @returns {Promise<{_id: String, status: object}>}
   * @error log & throw;
   */
  async function sleepUserAccount(userId) {
    try {
      const db = (await makeDb()).collection("user"),
        query = { _id: userId },
        update = { $set: { "status.account": 0 } },
        option = { returnDocument: "after", projection: { status: 1 } },
        { value } = await db.findOneAndUpdate(query, update, option);
      return value;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * get user id and setting , update setting
   * @param {String} userId
   * @param {object} setting meet Setting
   * @returns {Promise<{_id: string, meetSetting: object}>}
   * @error log & throw
   */
  async function updateMeetSetting(userId, setting) {
    try {
      const db = (await makeDb()).collection("user"),
        query = { _id: userId },
        update = { $set: { meetSetting: setting } },
        option = { returnDocument: "after", projection: { meetSetting: 1 } },
        { value } = await db.findOneAndUpdate(query, update, option);
      return value;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 유저 세팅 불러오기
   * @param {String} userId
   * @returns {Promise<object>}
   */
  async function getSettings(userId) {
    try {
      const db = (await makeDb()).collection("user"),
        query = { _id: userId },
        projection = { meetSetting: 1 },
        user = await db.findOne(query, { projection });
      if (!user) return undefined;
      return user.meetSetting;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * get expo token and update
   * @param {String} userId
   * @param {String} expoToken
   * @returns {Promise<{_id: String, expoToken: String}>}
   * @error log & throw;
   */
  async function updateExpoToken(userId, expoToken) {
    try {
      const db = (await makeDb()).collection("user"),
        query = { _id: userId },
        update = { $set: { expoToken } },
        option = { returnDocument: "after", projection: { expoToken: 1 } },
        { value } = await db.findOneAndUpdate(query, update, option);
      return value;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 유저 지우기 (탈퇴)
   * @param {String} _id
   * @error log & throw
   */
  async function deleteUser(_id) {
    try {
      const db = (await makeDb()).collection("user");
      const query = { _id };
      return db.findOneAndDelete(query);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 유저 아이디 array를 받아서 해당 유저들의 expo token을 반환한다
   * @param {Array} userIds
   * @returns {Promise<Array>}
   * @error log & throw
   */
  async function getExpoTokens(userIds) {
    try {
      const tokens = [];
      const db = await makeDb(),
        userDb = db.collection("user"),
        query = userIds
          ? { _id: { $in: userIds }, "meetSetting.alert": true }
          : { "meetSetting.alert": true },
        projection = { expoToken: true },
        cursor = userDb.find(query, { projection });
      if ((await db.countDocuments(query)) === 0) return tokens;
      else {
        await cursor.forEach(({ expoToken }) => tokens.push(expoToken));
        return tokens;
      }
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 엑스포 토큰 지우기
   * @param {String} expoToken
   * @returns {Promise<void>}
   * @error log & throw
   */
  async function deleteExpoToken(expoToken) {
    try {
      const db = await makeDb(),
        userDb = db.collection("user"),
        query = { expoToken },
        projection = { expoToken: true },
        update = { $set: { expoToken: undefined } };
      await userDb.findOneAndUpdate(query, update, { projection });
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 유저의 현재 보유 코인 보기
   * @param {String} _id
   * @returns {Promise<Number}
   */
  async function getCoins(_id) {
    try {
      const db = (await makeDb()).collection("user"),
        query = { _id: _id },
        projection = { coins: 1 },
        user = await db.findOne(query, { projection });
      if (!user) return undefined;
      else return user.coins;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 보유 코인양 수정하기
   * 더하기와 빼기 가능하다
   * @param {String} userId
   * @param {Number} coinAmount
   * @returns {Promise<Number>}
   */
  async function updateCoins(userId, coinAmount) {
    try {
      const db = (await makeDb()).collection("user"),
        query = { _id: userId },
        update = { $inc: { coins: coinAmount } },
        option = { returnDocument: "after", projection: { coins: 1 } },
        {
          value: { coins },
        } = await db.findOneAndUpdate(query, update, option);
      return coins;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 현재 패스 목록 가져오기
   * @param {String} userId
   * @returns {Promise<Array>}
   */
  async function getPass(userId) {
    try {
      const db = (await makeDb()).collection("user"),
        query = { _id: userId },
        projection = { pass: 1 },
        user = await db.findOne(query, { projection });
      if (!user) return undefined;
      else return user.pass;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 패스 새로 업데이트
   * @param {String} userId
   * @param {Array} pass
   * @returns {Promise<Array>}
   */
  async function updatePass(userId, newPass) {
    try {
      const db = (await makeDb()).collection("user"),
        query = { _id: userId },
        update = { $set: { pass: newPass } },
        option = { returnDocument: "after", projection: { pass: 1 } },
        {
          value: { pass },
        } = await db.findOneAndUpdate(query, update, option);
      return pass;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async function getPrivacy(userId) {
    try {
      const db = (await makeDb()).collection("user"),
        query = { _id: userId },
        projection = {
          "meetSetting.privacy": 1,
          "meetSetting.time": 1,
        },
        user = await db.findOne(query, { projection });
      if (!user) {
        return undefined;
      } else {
        if (user.meetSetting.privacy.length > 0) {
          user.meetSetting.privacy.map((el, i) => {
            user.meetSetting.privacy[i] = el.fullAddress;
          });
        }

        return user.meetSetting;
      }
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async function insertImgCheck(check) {
    try {
      const db = await makeDb();
      const result = await db.collection("imgCheck").insertOne(check);
      const id = result.insertedId;
      return id;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async function deleteUsersCheckImg(userId) {
    try {
      const db = await makeDb();
      return await db.collection("imgCheck").deleteOne({ userId: userId });
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async function getMyImgCheck(id) {
    try {
      const db = await makeDb();
      return await db.collection("imgCheck").findOne({ userId: id });
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
}
