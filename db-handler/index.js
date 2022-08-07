import { config } from "dotenv";
import { MongoClient } from "mongodb";
import makeBlockDb from "./block-db-handler.js";
import makeChatDb from "./chat-db-handler.js";
import makeLikeDb from "./like-db-handler.js";
import makeArticleDb from "./article-db-handler.js";
import makeUserDb from "./user-db-handler.js";
import makeMeetDb from "./meet-db-handler.js";
import makeMateListDb from "./mateList-db-handler.js";
import makeReportDb from "./report-db-handler.js";
import makePaymentDb from "./payment-db-handler.js";
import makeDeletedUserDb from "./deleted-user-db-handler.js";
import makeNoticeDb from "./notice-db-handler.js";
import makeStatisticDb from "./statistic-db-handler.js";
import makeCsDb from "./cs-db-handler.js";
import makeSystemMessageDb from "./systemMessage-db-handler.js";
import makeHideDb from "./hide-db-handler.js";
config({ path: "config/.env" });

const url = process.env.MONGO_DB_URL;
const dbName = process.env.XROS_DB_NAME;
const client = new MongoClient(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function makeDb() {
  try {
    await client.connect();
    const db = client.db(dbName);
    return db;
  } catch (error) {
    console.log(error);
  }
}
const userDb = makeUserDb(makeDb);
const chatDb = makeChatDb(makeDb);
const meetDb = makeMeetDb(makeDb);
const likeDb = makeLikeDb(makeDb);
const blockDb = makeBlockDb(makeDb);
const articleDb = makeArticleDb(makeDb);
const mateListDb = makeMateListDb(makeDb);
const reportDb = makeReportDb(makeDb);
const paymentDb = makePaymentDb(makeDb);
const deletedUserDb = makeDeletedUserDb(makeDb);
const noticeDb = makeNoticeDb(makeDb);
const statisticDb = makeStatisticDb(makeDb);
const csDb = makeCsDb(makeDb);
const systemMessageDb = makeSystemMessageDb(makeDb);
const hideDb = makeHideDb(makeDb);

//NOTE create index when server starts
meetDb.createAllGeoJsonIndexes();
meetDb.createMeetMatchingIndexes();
likeDb.createIndexesLikeDb();
export {
  userDb,
  chatDb,
  meetDb,
  likeDb,
  blockDb,
  articleDb,
  mateListDb,
  reportDb,
  paymentDb,
  deletedUserDb,
  noticeDb,
  statisticDb,
  csDb,
  systemMessageDb,
  hideDb,
  makeDb,
};
