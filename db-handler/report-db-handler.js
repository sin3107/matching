export default function makeReportDb(makeDb) {
  return Object.freeze({
    getReportDb,
    getReportCategory,
    insertReport,
  });

  async function getReportDb() {
    try {
      const db = await makeDb();
      return db.collection("reports");
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async function getReportCategory() {
    try {
      const db = await getReportDb();

      const result = await db.find({ type: 0 });

      if ((await db.countDocuments({ type: 0 })) === 0) {
        await db.insertMany([
          { _id: 0, type: 0, name: "계정", status: 1 },
          { _id: 1, type: 0, name: "욕설/비속어", status: 1 },
          { _id: 2, type: 0, name: "오류", status: 1 },
          { _id: 3, type: 0, name: "기타", status: 1 },
        ]);
        result = db.find({ type: 0 });
      }
      return result.toArray();
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async function insertReport(report) {
    try {
      const db = await getReportDb(),
        { insertedId } = await db.insertOne(report);
      return insertedId;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
}
