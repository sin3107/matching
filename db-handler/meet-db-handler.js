export default function makeMeetDb(makeDb) {
  return Object.freeze({
    getAllGeoJsonDb,
    insertAllGeoJson,
    createAllGeoJsonIndexes,
    findMyGeoJsonByTime,
    findMyGeoJson,
    getMyLastGeoJson,
    getLastGeoJson,
    deleteMyGeoJson,
    getMeetMatchingDb,
    insertMeetMatching,
    insertManyMeetMatching,
    createMeetMatchingIndexes,
    getMeetMatchingTs,
    findMeetMatching,
    deleteMeetMatchingByUser,
    deleteMeetMatchingBetweenUsers,
    getRankingDb,
    getMatchingUsers,
    insertRanking,
    getLastUpdatedTime,
    getRankingUsers,
    updateRankings,
    getMatchingUserCoordinates,
    deleteRanking,
    deleteRankingBetweenUser,
    deleteAllRankingByUser,
    getHiddenDb,
    getHiddenState,
    getHiddenArr,
    insertHidden,
    getCurrentHidden,
    deleteAllHidden,
    getHiddenCoordinates,
    getAllHidden,
    deleteAllHiddenByUser,
    getRadios,
    insertRadios,
    getOnePlace,
    getPlaceList,
    updatePlace,
  });
  /**
   *  get all geo json db
   * @returns {Promise<object>} all geo json db collection
   * @error log & throw
   */
  async function getAllGeoJsonDb() {
    try {
      const db = await makeDb();
      return await db.collection("allGeoJson");
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   *
   * @returns {Promise<object>} meet matching collection db
   * @error log & throw
   */
  async function getMeetMatchingDb() {
    try {
      const db = await makeDb();
      return await db.collection("meetMatching");
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 랭킹 db 가져오기
   * @returns {Promise<object>}
   */
  async function getRankingDb() {
    try {
      const db = await makeDb();
      return db.collection("meetRanking");
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 히든 db
   * @returns {Promise<object>}
   */
  async function getHiddenDb() {
    return (await makeDb()).collection("meetHidden");
  }

  /**
   * 정보 모음 db
   * @returns {Promise<object>}
   */
  async function getCommonDb() {
    return (await makeDb()).collection("common");
  }

  /**
   * 장소 db
   * @returns {Promise<object>}
   */
  async function getPlaceDb() {
    return (await makeDb()).collection("place");
  }

  /**
   * get geoJson object and insert to collection
   * @param {Object} geoJson
   * @returns {Promise<String>} inserted document's id
   * @error log * throw
   */
  async function insertAllGeoJson(geoJson) {
    try {
      const db = await getAllGeoJsonDb();
      const { insertedId } = await db.insertOne(geoJson);
      return insertedId;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * create expire index & userId index in all geo json collection
   * @returns {Promise<{expireIndex: string, userIndex: string}>} created index name
   * @error log & throw
   */
  async function createAllGeoJsonIndexes() {
    try {
      const db = await getAllGeoJsonDb();
      const expire = 3600 * 25;
      const expireIndex = await db.createIndex(
        { timestamp: 1 },
        { expireAfterSeconds: expire }
      );
      const useridIndex = await db.createIndex({ userId: 1 });
      return { expireIndex, useridIndex };
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async function findMyGeoJsonByTime(userId, timestamp) {
    try {
      const db = await getAllGeoJsonDb(),
        now = new Date(timestamp),
        oneHourAgo = new Date(now.setHours(now.getHours()));
      //oneHourAgo = new Date(now.setHours(now.getHours() -1))
      const query = { userId: userId, timestamp: { $lte: oneHourAgo } },
        projection = { coordinates: 1, timestamp: 1 };
      const cursor = db.find(query, { projection });
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
   * get one user's geo json list - one hour ago only
   * @param {String} userId
   * @returns {Promise<Array>} array of documents or null
   * @error log & throw
   */
  async function findMyGeoJson(userId) {
    try {
      const db = await getAllGeoJsonDb(),
        now = new Date(),
        oneHourAgo = new Date(now.setHours(now.getHours()));
      //oneHourAgo = new Date(now.setHours(now.getHours() -1))
      const query = { userId: userId, timestamp: { $lte: oneHourAgo } },
        projection = { coordinates: 1, timestamp: 1 };
      const cursor = db.find(query, { projection });
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
   * 마지막 좌표 얻기
   * @param {String} userId
   * @param {Date} timestamp
   * @returns {Promise<{coordinates: Array}>}
   */
  async function getMyLastGeoJson(userId, timestamp) {
    try {
      const db = await getAllGeoJsonDb(),
        query = { userId, timestamp },
        projection = { coordinates: 1 },
        data = await db.findOne(query, { projection });
      if (!data) return undefined;
      else return data;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  /**
   * 마지막 좌표 얻기
   * @param {String} userId
   * @param {Date} timestamp
   * @returns {Promise<{coordinates: Array}>}
   */
  async function getLastGeoJson(userId) {
    try {
      const db = await getAllGeoJsonDb(),
        query = { userId },
        projection = { coordinates: 1 },
        data = await db
          .find(query, { projection })
          .sort({ timestamp: -1 })
          .limit(1)
          .toArray();
      if (!data) return undefined;
      else return data[0];
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  /**
   * delete all geo json of one user
   * @param {String} userId
   * @error log & throw
   */
  async function deleteMyGeoJson(userId) {
    try {
      const db = await getAllGeoJsonDb();
      const query = { userId: userId };
      await db.deleteMany(query);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * insert meetmatching to db
   * @param {Object} meetMatching
   * @returns {Promise<String>} inserted document's id
   * @error log & throw
   */
  async function insertMeetMatching(meetMatching) {
    try {
      const db = await getMeetMatchingDb();
      const { insertedId } = await db.insertOne(meetMatching);
      return insertedId;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 매칭 array 저장하기: 레디스 기록을 한꺼번에 몽고에 저장하는 용도
   * @param {Array} meetMatchingArr
   * @returns {Promise<void>}
   */
  async function insertManyMeetMatching(meetMatchingArr) {
    try {
      const db = await getMeetMatchingDb();
      return db.insertMany(meetMatchingArr);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * create index of expire & user id in meetMatching db
   * @returns {Promise<{expireIndex: String, userIndex: String}>} created index name
   * @error log & throw
   */
  async function createMeetMatchingIndexes() {
    try {
      const db = await getMeetMatchingDb();
      const oneDayInSec = 86400;
      const expire = oneDayInSec * 8;
      const expireIndex = await db.createIndex(
        { timestamp: 1 },
        { expireAfterSeconds: expire }
      );
      const userIdIndex = await db.createIndex({ userId: 1 });
      return { expireIndex, userIdIndex };
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * find one user's meet matching record - one hour ago only
   * @param {String} userId
   * @returns {Promise<{Array}>} array of record or null
   * @error log & throw
   */
  async function findMeetMatching(userId) {
    try {
      const db = await getMeetMatchingDb(),
        now = new Date(),
        oneHourAgo = new Date(now.setHours(now.getHours()));
      //oneHourAgo = new Date(now.setHours(now.getHours() -1))
      const query = { userId, timestamp: { $lte: oneHourAgo } };
      const cursor = db.find(query);
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
   * delete one user's all documents
   * @param {String} userId
   * @error log & throw
   */
  async function deleteMeetMatchingByUser(userId) {
    try {
      const db = await getMeetMatchingDb();
      const query = { $or: [{ userId }, { otherUserId: userId }] };
      await db.deleteMany(query);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 두 유저 사이 크로스 매칭 기록 삭제
   * @param {String} user1
   * @param {String} user2
   * @returns {Promise<void>}
   */
  async function deleteMeetMatchingBetweenUsers(user1, user2) {
    try {
      const db = await getMeetMatchingDb(),
        query = {
          $or: [
            { userId: user1, otherUserId: user2 },
            { userId: user2, otherUserId: user1 },
          ],
        };
      return db.deleteMany(query);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * userId와 매칭 된 유저 아이디 리턴
   * @param {String} userId
   * @returns {Promise<[String]>}
   */
  async function getMatchingUsers(userId) {
    try {
      const db = await getMeetMatchingDb(),
        field = "otherUserId",
        now = new Date(),
        hourAgo_1 = new Date(new Date().setHours(now.getHours())), // 임시
        //hourAgo_1 = new Date(new Date().setHours(now.getHours() -1)),
        hourAgo_25 = new Date(new Date().setHours(now.getHours() - 25)),
        filter = { userId, timestamp: { $lt: hourAgo_1, $gt: hourAgo_25 } };
      return await db.distinct(field, filter);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * userId와 otherUserId의 매칭 정보 받기
   * @param {String} userId
   * @param {String} otherUserId
   * @returns {Promise<Array>}
   */
  async function getMeetMatchingTs(userId, otherUserId) {
    try {
      const db = await getMeetMatchingDb(),
        now = new Date(),
        hourAgo_1 = new Date(new Date().setHours(now.getHours() - 1)),
        hourAgo_25 = new Date(new Date().setHours(now.getHours() - 25)),
        query = { userId, otherUserId }, // 임시
        // query = {userId, otherUserId, timestamp: {$lt: hourAgo_1, $gt: hourAgo_25}},
        projection = { timestamp: 1 };
      return await db
        .find(query, { projection })
        .sort({ timestamp: 1 })
        .toArray();
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 랭킹 저장하기
   * @param {object} ranking
   * @returns {Promise<void>}
   */
  async function insertRanking(ranking) {
    try {
      const db = await getRankingDb();
      return await db.insertOne(ranking);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 최근 업데이트 시간 얻기
   * @param {String} userId
   * @returns {Promise<Number>} updatedAt or undefined
   */
  async function getLastUpdatedTime(userId) {
    try {
      const db = await getRankingDb(),
        query = { userId },
        projection = { updatedAt: 1 },
        ranking = await db.findOne(query, { projection });
      if (!ranking) return null;
      return ranking.updatedAt;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 10명 랭킹 유저 얻기
   * @param {String} userId
   * @param {String} type
   * @param {Number} pagination
   * @returns {Promise<Array>}
   */
  async function getRankingUsers(
    userId,
    type,
    pagination = 1,
    age = { start: 0, end: 100 },
    gender = "all"
  ) {
    try {
      const db = await getRankingDb(),
        query =
          gender === "all" || !gender
            ? {
                userId,
                age: { $gte: age.start, $lte: age.end },
                hide: { $ne: true },
              }
            : {
                userId,
                age: { $gte: age.start, $lte: age.end },
                hide: { $ne: true },
                gender,
              },
        limit = 15, // 임시 10 => 15 : 10으로 원복할 것
        cursor = db
          .find(query)
          .sort(getSortType(type))
          .skip((pagination - 1) * limit)
          .limit(limit);

      return cursor.toArray();
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async function updateRankings(query, values) {
    try {
      const db = await getRankingDb();
      const result = await db.updateMany(query, values);
      return result;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  /**
   * 매칭 유저의 좌표 돌려주기
   * @param {String} userId
   * @param {String} otherUserId
   * @returns {Promise<Array>}
   */
  async function getMatchingUserCoordinates(userId, otherUserId) {
    try {
      const db = await getMeetMatchingDb(),
        now = new Date(),
        hourAgo_1 = new Date(new Date().setHours(now.getHours())), // 임시
        //hourAgo_1 = new Date(new Date().setHours(now.getHours() -1)),
        hourAgo_25 = new Date(new Date().setHours(now.getHours() - 25)),
        query = {
          userId,
          otherUserId,
          timestamp: { $lt: hourAgo_1, $gte: hourAgo_25 },
        },
        projection = { coordinates: 1, timestamp: 1 };
      return await db
        .find(query, { projection })
        .sort({ timestamp: 1 })
        .toArray();
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 옛날 랭킹 다 지우기
   * @param {String} userId
   */
  async function deleteRanking(userId) {
    try {
      const db = await getRankingDb(),
        query = { userId };
      await db.deleteMany(query);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 유저 두 명 사이의 랭킹 기록 다 지우기
   * @param {String} user1
   * @param {String} user2
   * @returns {Promise<void>}
   */
  async function deleteRankingBetweenUser(user1, user2) {
    try {
      const db = await getRankingDb(),
        query = {
          $or: [
            { userId: user1, otherUserId: user2 },
            { userId: user2, otherUserId: user1 },
          ],
        };
      return db.deleteMany(query);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 유저 한 명의 모든 기록 지우기
   * @param {String} userId
   * @returns {Promise<void>}
   */
  async function deleteAllRankingByUser(userId) {
    try {
      const db = await getRankingDb(),
        query = { $or: [{ userId }, { otherUserId: userId }] };
      return db.deleteMany(query);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 히든 ox 얻기
   * @param {String} userId
   * @param {String} otherUserId
   * @returns {Promise<Object>}
   */
  async function getHiddenState(userId, otherUserId) {
    try {
      const db = await getMeetMatchingDb(),
        todayZero = new Date(new Date().setHours(0, 0, 0, 0)),
        dayAgo_7 = new Date(
          new Date(todayZero).setDate(todayZero.getDate() - 7)
        ),
        now = new Date(),
        hourAgo_25 = new Date(new Date().setHours(now.getHours() - 25)),
        query = {
          userId,
          otherUserId,
          timestamp: { $gte: dayAgo_7, $lt: hourAgo_25 },
        };
      return await db.findOne(query);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 히든 계산하기용 array받기
   * @param {String} userId
   * @param {String} otherUserId
   * @param {Date} startTime
   * @param {Date} endTime
   * @returns {Promise<Array>}
   */
  async function getHiddenArr(userId, otherUserId, startTime, endTime) {
    try {
      const db = await getMeetMatchingDb(),
        query = {
          userId,
          otherUserId,
          timestamp: { $gte: startTime, $lt: endTime },
        };
      return db.find(query).toArray();
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 히든 저장하기
   * @param {object} hidden
   * @returns {Promise<String>}
   */
  async function insertHidden(hidden) {
    try {
      const db = await getHiddenDb(),
        { insertedId } = await db.insertOne(hidden);
      return insertedId;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 가장 최신 히든 찾기 (하루전)
   * @param {String} userId
   * @param {String} otherUserId
   * @returns {Promise<object>}
   */
  async function getCurrentHidden(userId, otherUserId) {
    try {
      const db = await getHiddenDb(),
        query = { userId, otherUserId, day_ago: 1 };
      return db.findOne(query);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 해당 유저의 히든 전부 지우기
   * @param {String} userId
   * @param {String} otherUserId
   * @returns {Promie<void>}
   */
  async function deleteAllHidden(userId, otherUserId) {
    try {
      const db = await getHiddenDb(),
        query = { userId, otherUserId };
      return db.deleteMany(query);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 히든용 좌표 얻기
   * @param {String} userId
   * @param {String} otherUserId
   * @param {Date} startTime
   * @param {Date} endTime
   * @returns {Promise<Array>}
   */
  async function getHiddenCoordinates(userId, otherUserId, startTime, endTime) {
    try {
      const db = await getMeetMatchingDb(),
        query = {
          userId,
          otherUserId,
          timestamp: { $gte: startTime, $lt: endTime },
        },
        projection = { coordinates: 1 };
      return db.find(query, { projection }).toArray();
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 히든 얻기
   * @param {String} userId
   * @param {String} otherUserId
   * @returns {Promise<Array>}
   */
  async function getAllHidden(userId, otherUserId) {
    try {
      const db = await getHiddenDb(),
        query = { userId, otherUserId };
      return db.find(query).toArray();
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 한 유저가 관계된 모든 히든 지우기
   * @param {String} userId
   * @returns {Promise<void>}
   */
  async function deleteAllHiddenByUser(userId) {
    try {
      const db = await getHiddenDb(),
        query = { $or: [{ userId }, { otherUserId: userId }] };
      return db.deleteMany(query);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async function getRadios(key) {
    try {
      const db = await getCommonDb(),
        query = { key: key };
      return db.findOne(query);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async function insertRadios(query) {
    try {
      const db = await getCommonDb();
      return db.insertOne(query);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async function getOnePlace(placeId) {
    try {
      const db = await getPlaceDb();
      return db.findOne({ _id: placeId });
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async function getPlaceList(query) {
    try {
      const db = await getPlaceDb(query);
      return db.find(query).toArray();
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async function updatePlace(id, query) {
    try {
      const db = await getPlaceDb(),
        result = await db.updateOne(id, { $set: query });
      return result;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
}
function getSortType(type) {
  const typeArr = [
    {
      name: "meet",
      sort: { meet: -1 },
    },
    {
      name: "meetCount",
      sort: { meetCount: -1 },
    },
    {
      name: "spots",
      sort: { spots: -1 },
    },
    {
      name: "score",
      sort: { score: -1 },
    },
  ];
  const { sort } = typeArr.find((x) => x.name === type);
  return sort;
}
