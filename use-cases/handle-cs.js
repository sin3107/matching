import { csDb, statisticDb } from "../db-handler/index.js";
import errorMessage from "../helper/error.js";
import out from "../helper/out.js";
import { Qna } from "../models/index.js";
import { valid } from "../helper/utils.js";
import { scheduleJob } from "../helper/scheduler.js";

const result = {
  status: false,
  body: "",
};
export const cs_use_case = {
  getFaqList,
  addQna,
};

// 매일 0시 정각에 실행
scheduleJob("0 0 0 * * *", initStatistic);

// week 매주 일요일
scheduleJob("0 0 0 * * 0", addAccessCountByWeek);

// month 매월 1일 00시 00분 01초
scheduleJob("01 0 0 1 * *", addAccessCountByMonth);

// year 매년 1월 1일 00시 00분 01초
scheduleJob("01 0 0 1 1 *", addAccessCountByYear);

async function getFaqList(createdAt, type) {
  try {
    if (createdAt && isNaN(new Date(createdAt))) {
      result.status = false;
      result.body = errorMessage.syntaxError.timestampNotDate;
      return result;
    }

    const ct = createdAt ? new Date(createdAt) : new Date();
    const dbResult = await csDb.getFaqList(ct, type);

    result.status = true;
    result.body = { list: dbResult };
    return result;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

async function addQna({ user: { _id: userId }, ...rest }) {
  try {
    let bodyModel = {
      category: { type: "str" },
      email: { type: "str" },
      subject: { type: "str" },
      question: { type: "str" },
      userId: { type: "str" },
    };

    let data = valid({ userId, ...rest }, bodyModel);
    let qna = Qna(data);
    let dbResult = await csDb.insertQna(qna);

    result.status = true;
    result.body = out(dbResult);
    return result;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

async function initStatistic() {
  try {
    let date = new Date().toISOString();
    let year = date.substring(0, 4);
    let month = date.substring(0, 7);
    let day = date.substring(0, 10);

    let registeCount = await statisticDb.findToday(day, 0);
    //if(registeCount == null) await statisticDb.initUserCount(year, month, day, 0)
    if (registeCount == null)
      await statisticDb.initUserCount({
        type: 0,
        count: 0,
        day: day,
        month: month,
        year: year,
      });

    let deleteCount = await statisticDb.findToday(day, 2);
    //if(deleteCount == null) await statisticDb.initUserCount(year, month, day, 2)
    if (deleteCount == null)
      await statisticDb.initUserCount({
        type: 2,
        count: 0,
        day: day,
        month: month,
        year: year,
      });

    let genderCount = await statisticDb.findToday(day, 3);
    //if(genderCount == null) await statisticDb.initUserCountByGender(year, month, day)
    if (genderCount == null)
      await statisticDb.initUserCount({
        type: 3,
        count: { woman: 0, man: 0 },
        day: day,
        month: month,
        year: year,
      });

    let ageCount = await statisticDb.findToday(day, 4);
    //if(ageCount == null) await statisticDb.initUserCountByAge(year, month, day)
    if (ageCount == null)
      await statisticDb.initUserCount({
        type: 4,
        count: {},
        day: day,
        month: month,
        year: year,
      });

    let accessCount = await statisticDb.findAccessToday({ type: 0, date: day });
    if (accessCount == null) await statisticDb.initAccessCount(day);

    await statisticDb.deleteTodayAccessUser();
  } catch (err) {
    console.log(err);
    throw err;
  }
}

async function addAccessCountByWeek() {
  try {
    const today = new Date();
    let date = new Date(today.setDate(today.getDate() - 7)).toISOString();
    let day = date.substring(0, 10);

    const countArr = await statisticDb.getAccessCountByWeek();
    if (!countArr) return;

    let sum = 0;
    await countArr.map((row) => {
      sum += row.count;
    });

    await statisticDb.insertAccessCount({ type: 1, count: sum, date: day });
  } catch (err) {
    console.log(err);
    throw err;
  }
}

async function addAccessCountByMonth() {
  try {
    const today = new Date();
    let date = new Date(today.setDate(today.getDate() - 1)).toISOString();
    let day = date.substring(0, 8);
    day += "01";
    let month = day.substring(0, 7);

    const countArr = await statisticDb.getAccessCountByMonth(month);
    if (!countArr) return;

    let sum = 0;
    await countArr.map((row) => {
      sum += row.count;
    });

    await statisticDb.insertAccessCount({ type: 2, count: sum, date: day });
  } catch (err) {
    console.log(err);
    throw err;
  }
}

async function addAccessCountByYear() {
  try {
    const today = new Date();
    let date = new Date(today.setDate(today.getDate() - 1)).toISOString();
    let day = date.substring(0, 5);
    day += "01-01";
    let year = day.substring(0, 4);

    const countArr = await statisticDb.getAccessCountByYear(year);
    if (!countArr) return;

    let sum = 0;
    await countArr.map((row) => {
      sum += row.count;
    });

    await statisticDb.insertAccessCount({ type: 3, count: sum, date: day });
  } catch (err) {
    console.log(err);
    throw err;
  }
}
