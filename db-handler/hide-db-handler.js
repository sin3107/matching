export default function makeHideDb(makeDb) {
  return Object.freeze({
    getHideDb,
    insertHide,
    isUser1HideUser2,
    getAllHideListByUser,
    unHideUserId,
    deleteAllHideByUser,
  });

  async function getHideDb() {
    try {
      const db = await makeDb();
      return await db.collection("hide");
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async function insertHide(hide) {
    try {
      const db = await getHideDb();
      const { insertedId } = await db.insertOne(hide);
      return insertedId;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async function isUser1HideUser2(userId1, userId2) {
    try {
      const db = await getHideDb();
      const query = { hideBy: userId1, hideUserId: userId2 },
        projection = { _id: false };
      return await db.findOne(query, { projection });
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async function getAllHideListByUser(userId) {
    try {
      const db = await getHideDb();
      const query = { hideBy: userId },
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

  async function unHideUserId(userId1, userId2) {
    try {
      const db = await getHideDb(),
        query = { hideBy: userId1, hideUserId: userId2 };
      await db.deleteOne(query);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async function deleteAllHideByUser(userId) {
    try {
      const db = await getHideDb(),
        query = { $or: [{ hideBy: userId }, { hideUserId: userId }] };
      await db.deleteMany(query);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
}
