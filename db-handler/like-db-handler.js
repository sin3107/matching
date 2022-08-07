export default function makeLikeDb(makeDb) {
  return Object.freeze({
    getLikeDb,
    getLikeTypes,
    createIndexesLikeDb,
    insertLike,
    findAnyLike,
    findLikeToMe,
    findLikeForMatching,
    findLikeFrom,
    findLikeTo,
    findLikeOfUser,
    deleteLike,
    deleteLikeOfUser,
    deletLikeBetweenUser,
  });
  /**
   * return like collection
   * @returns like collection
   * @error log & throw
   */
  async function getLikeDb() {
    try {
      const db = await makeDb();
      return await db.collection("like");
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * create index that expire in 7 days in timestamp
   * @error log & throw
   */
  async function createIndexesLikeDb() {
    try {
      const db = await getLikeDb();
      const expire = 60 * 60 * 24 * 7;
      db.createIndex({ timestamp: 1 }, { expireAfterSeconds: expire });
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  async function getLikeTypes() {
    try {
      const db = await getLikeDb(),
        query = { typeName: { $exists: true } };
      let cursor = db.find(query);
      if ((await db.countDocuments(query)) === 0) {
        await db.insertMany([
          {
            typeName: "meet",
            _id: 0,
          },
          {
            typeName: "community",
            _id: 1,
          },
        ]);
        cursor = db.find(query);
      }
      const arr = [];
      await cursor.forEach(({ _id }) => arr.push(_id));
      return arr;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * insert like and return inserted id
   * @param {object} like
   * @returns {Promise<String>} insertedId
   * @error log & throw
   */
  async function insertLike(like) {
    try {
      const db = await getLikeDb();
      const { insertedId } = await db.insertOne(like);
      return insertedId;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * find like from to and return it
   * @param {object} {from, to}
   * @returns {Promise<object>}>} like object or undefined
   * @error log & throw
   */
  async function findAnyLike({ from, to }) {
    try {
      const db = await getLikeDb(),
        query = { likeFrom: from, likeTo: to };
      return await db.findOne(query);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * find like from to and return it
   * @param {object} {from, to}
   * @returns {Promise<object>}>} like object or undefined
   * @error log & throw
   */
  async function findLikeToMe(to) {
    try {
      const db = await getLikeDb(),
        query = { likeTo: to };
      const result = await db.findOne(query);
      if (!result) return false;
      else return true;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 타입까지 검사해서 쓰기
   * @param {String} from from user id
   * @param {String} to
   * @param {Number} type
   * @returns {Promise<object}
   */
  async function findLikeForMatching(from, to) {
    try {
      const db = await getLikeDb(),
        query = { likeFrom: from, likeTo: to };
      return await db.findOne(query);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * find likes from one user and return array or null
   * @param {String} from from user id
   * @param {Number} type 0: meet 1: community
   * @param {Date} timestamp
   * @returns {Promise<Array>} array or null
   * @error log & throw
   */
  async function findLikeFrom(from, timestamp = new Date()) {
    try {
      const likes = [],
        db = await getLikeDb(),
        query = { likeFrom: from, timestamp: { $lt: timestamp } },
        projection = { _id: false, likeFrom: false },
        limit = 10,
        cursor = db.find(query, { projection });
      await cursor.sort({ timestamp: -1 }).limit(limit);
      return await cursor.toArray();
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * find like of to user id and return array or null
   * @param {String} to user id
   * @param {Number} type 0: meet 1: community
   * @param {Date} timestamp
   * @returns {Promise<Array>} array or null
   * @error log & throw
   */
  async function findLikeTo(to, timestamp = new Date()) {
    try {
      const likes = [],
        db = await getLikeDb(),
        query = { likeTo: to, timestamp: { $lt: timestamp } },
        projection = { _id: false, likeTo: false },
        limit = 10,
        cursor = db.find(query, { projection });
      await cursor.sort({ timestamp: -1 }).limit(limit);
      return await cursor.toArray();
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * get user id and find all likes belong to user
   * @param {String} userId
   * @returns {Promise<Array>} array or null
   * @error log & throw
   */
  async function findLikeOfUser(userId) {
    try {
      const likes = [],
        db = await getLikeDb(),
        query = { $or: [{ likeFrom: userId }, { likeTo: userId }] },
        cursor = db.find(query);
      if ((await db.countDocuments(query)) === 0) return null;
      else {
        await cursor.forEach((item) => likes.push(item));
        return likes;
      }
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * get from and to user id and delete like. return nothing
   * @param {String} from from user id
   * @param {String} to to user id
   * @param {Number} type 타입
   * @error log & throw
   */
  async function deleteLike(from, to) {
    try {
      const db = await getLikeDb(),
        query = { likeFrom: from, likeTo: to };
      await db.deleteMany(query);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * get user id and delete all likes NOTE maybe with like matching?
   * @param {String} userId user id
   */
  async function deleteLikeOfUser(userId) {
    try {
      const db = await getLikeDb(),
        query = { $or: [{ likeFrom: userId }, { likeTo: userId }] };
      await db.deleteMany(query);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 두 유저 사이 친구해요 종류에 상관없이 다 지우기
   * @param {String} user1
   * @param {String} user2
   * @returns {Promise<void}
   */
  async function deletLikeBetweenUser(user1, user2) {
    try {
      const db = await getLikeDb(),
        query = {
          $or: [
            { likeFrom: user1, likeTo: user2 },
            { likeFrom: user2, likeTo: user1 },
          ],
        };
      return db.deleteMany(query);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
}
