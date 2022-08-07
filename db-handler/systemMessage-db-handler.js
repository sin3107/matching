export default function makeSystemMessageDb(makeDb) {
  return Object.freeze({
    getSystemMessage,
    insertSystemMessage,
    deleteSystemMessage,
  });

  async function getSystemMessageDb() {
    try {
      const db = await makeDb();
      return db.collection("systemMessage");
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async function getSystemMessage(id, createdAt = new Date()) {
    try {
      const db = await getSystemMessageDb();
      return await db
        .find({ userId: id, createdAt: { $lt: createdAt } })
        .sort({ createdAt: -1 })
        .limit(30)
        .toArray();
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async function insertSystemMessage(query) {
    try {
      const db = await getSystemMessageDb(),
        { insertedId } = await db.insertOne(query);
      return insertedId;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async function deleteSystemMessage(id, userId) {
    try {
      const db = await getSystemMessageDb();
      return await db.deleteOne({ _id: id, userId: userId });
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
}
