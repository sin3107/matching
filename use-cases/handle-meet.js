import { scheduleJob } from "../helper/scheduler.js";
import {
  GeoJson,
  MateList,
  MeetHidden,
  MeetMatching,
  MeetRanking,
} from "../models/index.js";
import {
  blockDb,
  hideDb,
  mateListDb,
  userDb,
  meetDb,
} from "../db-handler/index.js";
import errorMessage from "../helper/error.js";
import { valid } from "../helper/utils.js";
import { redis_handler } from "../helper/redis-handler.js";
import { generateId } from "../helper/id-generator.js";
import { payment_use_case } from "./handle-payment.js";
import { geocoder } from "../helper/geocoding.js";

const result = {
  status: false,
  body: "",
};

let currentTime = Date.now(),
  currentGroupKey = `group:${currentTime}`,
  currentMatchingKey = `matching:${currentTime}`;
const job = scheduleJob("00 */10 * * * *", calculateMeet);

const meet_use_case = {
  addGeoJson,
  getMyGeoPoints,
  getCoordinatesByUser,
  getMeetList,
  calculateMeet,
  saveBlockToRedis,
  filterBlock,
  deleteBlockInRedis,
  findMeetMatching,
  saveMatchingToMongo,
  incMeetMatchingCount,
  deleteGeoInRedis,
  deleteMatchingInRedis,
  currentTime,
  currentGroupKey,
  currentMatchingKey,
  getGroupKey,
  getCurrentTime,
  getHidden,
  deleteAllMeetDataByUser,
  getPlaceList,
  getHiddenTest,
  isPassAvailable,
};
export { meet_use_case };
/**
 * trigger in every 10 minutes. get current group key and matching key, update to new
 * also
 * @error log & throw
 */
function getGroupKey() {
  return currentGroupKey;
}
function getCurrentTime() {
  return currentTime;
}
async function calculateMeet() {
  const oldGroupKey = currentGroupKey,
    oldMatchingKey = currentMatchingKey,
    timestamp = currentTime;
  currentTime = Date.now();
  currentGroupKey = `group:${currentTime}`;
  currentMatchingKey = `matching:${currentTime}`;
  try {
    await saveBlockToRedis();
    await findMeetMatching(oldGroupKey, oldMatchingKey);
    await saveMatchingToMongo(oldMatchingKey, timestamp);
    await incMeetMatchingCount(oldMatchingKey);
  } catch (err) {
    console.log(err);
  } finally {
    await deleteBlockInRedis();
    await deleteGeoInRedis(oldGroupKey);
    await deleteMatchingInRedis(oldMatchingKey);
  }
}
async function saveBlockToRedis() {
  try {
    const blocks = await blockDb.getAllBlocks();
    await redis_handler.insertBlocks(blocks);
  } catch (err) {
    console.log(err);
    throw err;
  }
}
async function findMeetMatching(oldGroupKey, oldMatchingKey) {
  try {
    // ?????? ????????? ?????? ??????
    const groups = await redis_handler.getAllGroupList(oldGroupKey);
    // ?????? ????????? loop
    await Promise.all(
      groups.map(async (groupId) => {
        // ??? ?????? ??? ?????? ?????? ????????????
        const users = await redis_handler.getAllUserInGroup(groupId);
        // ??? ?????? ??? ?????? ?????? loop
        await Promise.all(
          users.map(async (userId) => {
            // ??? ?????? ??? ??? ????????? ????????? ?????????
            let closeUsers = (
              await redis_handler.findCloseUsers(groupId, userId)
            ).filter((x) => x !== userId);
            // block
            //closeUsers = await filterMate(userId, closeUsers);
            closeUsers = await filterHide(userId, closeUsers);
            closeUsers = await filterBlock(userId, closeUsers);
            // ??? ?????? ??? ??? ????????? ????????? ???????????? loop - matching information ??????
            await Promise.all(
              closeUsers.map(async (otherUserId) => {
                const coordinates = await redis_handler.getCoordinates(
                  groupId,
                  otherUserId
                );
                redis_handler.insertMatching(
                  oldMatchingKey,
                  userId,
                  otherUserId,
                  coordinates
                );
              })
            );
          })
        );
      })
    );
  } catch (err) {
    console.log(err);
    throw err;
  }
}
async function filterBlock(userId, closeUsers) {
  try {
    const blockList = await redis_handler.getAllBlockByUser(userId);
    return closeUsers.filter((x) => !blockList.includes(x));
  } catch (err) {
    console.log(err);
    throw err;
  }
}
async function filterHide(userId, closeUsers) {
  try {
    const promises = await closeUsers.map((x) =>
      hideDb.isUser1HideUser2(userId, x)
    );
    const hasHideList = await Promise.all(promises);

    const filtered = closeUsers.filter((x, index) => {
      const hasHide = hasHideList[index];
      return !hasHide;
    });

    return filtered;
  } catch (err) {
    console.log(err);
    throw err;
  }
}
async function filterMate(userId, closeUsers) {
  try {
    const promises = await closeUsers.map((x) =>
      mateListDb.findMatching(x, userId)
    );
    const hasMatchedList = await Promise.all(promises);

    const filtered = closeUsers.filter((x, index) => {
      const hasMatched = hasMatchedList[index];
      return !hasMatched;
    });

    return filtered;
  } catch (err) {
    console.log(err);
    throw err;
  }
}
async function saveMatchingToMongo(oldMatchingKey, timestamp) {
  try {
    const matchingArr = await redis_handler.getMatchingList(oldMatchingKey);
    if (matchingArr.length === 0) return;
    const parsed = matchingArr.map((m) => {
      const matching = JSON.parse(m);
      return MeetMatching({ ...matching, timestamp });
    });
    await meetDb.insertManyMeetMatching(parsed);
    matchingArr.length = 0;
    parsed.length = 0;
  } catch (err) {
    console.log(err);
  }
}
async function incMeetMatchingCount(oldMatchingKey) {
  try {
    const matchingArrDuplicated = (
      await redis_handler.getMatchingList(oldMatchingKey)
    ).map((m) => JSON.parse(m));
    if (matchingArrDuplicated.length === 0) return;
    const matchingArr = [],
      finder = (arr, [user1, user2]) => {
        return arr.find((x) => {
          if (x.includes(user1) && x.includes(user2)) return true;
        });
      };
    matchingArrDuplicated.forEach(({ userId, otherUserId }) => {
      if (!finder(matchingArr, [userId, otherUserId]))
        matchingArr.push([userId, otherUserId]);
    });
    await Promise.all(
      matchingArr.map(async ([user1, user2]) => {
        const hasMateList = await mateListDb.getMateList(user1, user2);
        if (hasMateList) await mateListDb.incMeetMatchingCount(user1, user2);
        else
          await mateListDb.insertMateList(
            MateList({ users: [user1, user2], meetMatchingCount: 1 })
          );
      })
    );
    matchingArrDuplicated.length = 0;
    matchingArr.length = 0;
  } catch (err) {
    console.log(err);
  }
}
async function deleteBlockInRedis() {
  try {
    const blocks = await blockDb.getAllBlocks();
    await redis_handler.deleteBlocks(blocks);
  } catch (err) {
    console.log(err);
    throw err;
  }
}
async function deleteGeoInRedis(oldGroupKey) {
  try {
    await redis_handler.deleteUserGroups(oldGroupKey);
    await redis_handler.deleteGroupList(oldGroupKey);
  } catch (err) {
    console.log(err);
    throw err;
  }
}
async function deleteMatchingInRedis(oldMatchingKey) {
  try {
    await redis_handler.deletMatchingList(oldMatchingKey);
  } catch (err) {
    console.log(err);
  }
}
/**
 * get geoJson inside body and save.
 * @param {Object} body http body with geoJson
 * @returns {Promise<{status: boolean, body: null}>} body or error message
 * @error log & return error message
 */
async function addGeoJson(body) {
  try {
    // NOTE checking
    const bodyModel = {
        geoJson: { type: "obj" },
        user: { type: "obj" },
      },
      geoModel = {
        coordinates: { type: "arr" },
      },
      userModel = {
        _id: { type: "str" },
      },
      longModel = {
        0: { type: "num", max: 181, min: -181 },
      },
      latModel = {
        1: { type: "num", max: 91, min: -91 },
      };
    valid(body, bodyModel);
    valid(body.geoJson, geoModel);
    valid(body.user, userModel);
    valid(body.geoJson.coordinates, longModel);
    valid(body.geoJson.coordinates, latModel);
    const {
      geoJson: { coordinates },
      user: { _id: userId },
    } = body;
    // NOTE save my geo json

    const { privacy, time } = await userDb.getPrivacy(userId);

    if (privacy.length > 0) {
      const privacyRadios = await meetDb.getRadios("privacyRadios");
      if (!privacyRadios) {
        result.status = false;
        result.body = errorMessage.dbError.nullError;
        return result;
      }
      const value = parseFloat(privacyRadios.value) * 1000;

      let count = 0;
      await Promise.all(
        await privacy.map(async (el) => {
          const { coordinates: newCoordinates } =
            await geocoder.getCoordinatesFromAddress(el);
          const dist = getDistance(
            newCoordinates[0],
            newCoordinates[1],
            coordinates[0],
            coordinates[1]
          );
          // dist??? value?????? ????????? ?????? ????????????????????? ????????? ???
          if (dist < value) {
            count = count + 1;
          }
        })
      );

      if (count) {
        result.status = true;
        result.body = null;
        return result;
      }
    }

    if (time.length > 0) {
      let count = 0;

      let now = new Date();
      let hours = now.getHours();

      await Promise.all(
        await time.map(async (el) => {
          // start time??? ?????? ???????????? ????????? ??????.
          // end time??? ?????? ???????????? ??????.
          // ??? ??? ????????? ????????? ????????? ?????? privacy time?????? ???????????? ??????.
          if (el.start <= hours && el.end > hours) {
            count += 1;
          }
        })
      );

      if (count) {
        result.status = true;
        result.body = null;
        return result;
      }
    }

    let geoJson = GeoJson({ userId, coordinates, timestamp: currentTime });

    // getGeoJson ???
    // ???????????? ????????? ??? ??? ?????? ?????? ?????????????????? body.geoJson.corrdinates??? ?????? ??? insertAllGeoJson
    // ???????????? ???????????? ????????? ?????? insertAllGeoJson
    const lastGeo = await meetDb.getLastGeoJson(userId);
    if (lastGeo) {
      const dist = getDistance(
        coordinates[0],
        coordinates[1],
        lastGeo["coordinates"][0],
        lastGeo["coordinates"][1]
      );

      console.log(dist);
      if (dist < 151) {
        geoJson.coordinates[0] = lastGeo["coordinates"][0];
        geoJson.coordinates[1] = lastGeo["coordinates"][1];
      }
    }
    await meetDb.insertAllGeoJson(geoJson);

    // NOTE save in redis
    const groupId =
      (await redis_handler.getOneCloseGroup(currentGroupKey, coordinates)) ||
      generateId();
    await redis_handler.upsertGroupToList(
      currentGroupKey,
      coordinates,
      groupId
    );
    redis_handler.insertUserToGroup(coordinates, groupId, userId);

    result.status = true;
    result.body = null;
    return result;
  } catch (err) {
    console.log(err);
    result.status = false;
    result.body = err.message;
    return result;
  }
}
/**
 * get user id and return user's meet matching list, user's coordinates
 * @param {String} userId user id
 * @returns {Promise<{status: Boolean, body: {myGeoJsonList: Array, meetList: Array}}>} myGeoJsonList and meetList, or error message
 * @error log & return with status.body
 */
async function getMyGeoPoints(userId) {
  try {
    if (!userId) {
      result.status = false;
      result.body = errorMessage.nullError.idMissing;
      return result;
    }
    // NOTE has user ?????? ?????? ?????? - userId??? ???????????? ????????? ???
    const myGeoJsonList = await meetDb.findMyGeoJson(userId);
    result.status = true;
    result.body = { myGeoJsonList };
    return result;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

async function getCoordinatesByUser(userId, otherUserId) {
  try {
    const reqModel = {
      userId: { type: "str" },
      otherUserId: { type: "str" },
    };
    valid({ userId, otherUserId }, reqModel);

    const hasUser = await userDb.findUserById(otherUserId);
    if (!hasUser) {
      result.status = false;
      result.body = errorMessage.dbError.userNotFound;
      return result;
    }

    // ?????? ????????? ????????? ?????? ??????
    const profile = await addUserInfoToObj({ otherUserId });
    if (!profile) {
      result.status = false;
      result.body = errorMessage.nullError.idMissing;
      return result;
    }

    // ?????? ????????? ?????? ??????????????? ???????????? ????????? ?????? ??????
    const pointsArr = await meetDb.getMatchingUserCoordinates(
      userId,
      otherUserId
    );
    if (pointsArr.length < 1) {
      result.status = false;
      result.body = errorMessage.dbError.matchingNotFound;
      return result;
    }

    const timestamp = pointsArr[pointsArr.length - 1].timestamp,
      coordinatesArr = pointsArr.map((m) => m.coordinates);

    const myGeoJsonList = await meetDb.findMyGeoJsonByTime(userId, timestamp);

    result.status = true;
    result.body = {
      ...profile,
      coordinatesArr,
      myGeoJsonList,
    };
    return result;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

/**
 * ????????? ?????? ?????? ????????? ??????
 * 1. ????????? ??????
 * 2. ?????? ???????????? ?????? ??????
 * 3. ?????? ??????
 * 4. ?????? ????????? ????????? ????????????
 * @param {String} userId
 * @param {String} type
 * @param {Number} pagination
 * @returns {Promis<{status: boolean, body: { list: Array}}>}
 */
async function getMeetList(userId, type, pagination) {
  try {
    const reqModel = {
      userId: { type: "str" },
      type: { type: "str" },
      pagination: { type: "num", min: 1 },
    };
    valid({ userId, type, pagination }, reqModel);
    const updatedAt = await meetDb.getLastUpdatedTime(userId);

    if (!updatedAt || updatedAt !== currentTime) {
      // ?????? ????????? ????????? ??????????????? ????????? ??????
      await meetDb.deleteRanking(userId);
      await calculateMeetRanking(userId);
    }

    // ?????? ????????????
    // ?????? ??? ?????? ?????????
    const { age, gender } = await userDb.getMeetSettingAgeAndGender(userId);

    const users = await meetDb.getRankingUsers(
      userId,
      type,
      Number(pagination),
      age,
      gender
    );
    if (!users || users.length === 0) {
      result.status = true;
      result.body = { list: users };
      return result;
    }
    const { coordinates: myHomeCoord } = await userDb.getUserAddress(userId);
    const updated = await Promise.all(
      users.map(async (user) => {
        delete user._id;
        delete user.updatedAt;
        const { userId: myId, otherUserId } = user,
          profileUpdated = await addUserInfoToObj(user),
          pointsArr = await meetDb.getMatchingUserCoordinates(
            myId,
            otherUserId
          ),
          coordinatesArr = pointsArr.map((m) => m.coordinates),
          hidden = await meetDb.getHiddenState(myId, otherUserId);
        const { coordinates: otherLastCoord, timestamp: lastTime } =
          pointsArr[pointsArr.length - 1];
        const { coordinates: myLastCoord } = await meetDb.getMyLastGeoJson(
          myId,
          lastTime
        );
        const {
          coordinates: otherHomeCoord,
          sido,
          sigungu,
        } = await userDb.getUserAddress(otherUserId);
        let blur = false,
          type = "neighbor";

        // ?????? ????????? false
        let isTravel = true;
        let isLong = true;
        if (myHomeCoord && myLastCoord)
          isTravel = !(await isItHomeDistance(myHomeCoord, myLastCoord));
        if (otherHomeCoord && otherLastCoord)
          isLong = !(await isItHomeDistance(otherHomeCoord, otherLastCoord));
        const hasMatched = await mateListDb.findMatching(myId, otherUserId);

        // ?????? ????????? ????????????
        const { status: hasBoughtTravel } =
          await payment_use_case.checkItemLogWithin25hors(
            myId,
            otherUserId,
            "travel"
          );
        const { status: hasBoughtLong } =
          await payment_use_case.checkItemLogWithin25hors(
            myId,
            otherUserId,
            "long"
          );
        const blurLog = hasBoughtTravel || hasBoughtLong;

        // ?????? ????????? ?????? ??????
        const passTravel = await isPassAvailable(userId, "travel");
        const passLong = await isPassAvailable(userId, "long");

        // ???????????? ????????? ??? ???????????? ?????? ???????????? ????????? ??? ??? ??? ?????? ??????????????? ???????????? ?????? inLong?????? ??????
        // ????????? ???????????? ?????? ?????? ??????????????? ??????????????? ?????? ????????? ????????????
        if (isLong) {
          type = "long";
          if (blurLog || passLong || hasMatched)
            blur = false; // ?????? ?????? ??? ??? ?????? && hasMatched false
          else blur = true;
        }
        if (isTravel) {
          type = "travel";
          if (blurLog || passTravel || hasMatched)
            blur = false; // ?????? ????????? ?????? ??? ??? ?????? && hasMatched false
          else blur = true;
        }

        return {
          ...profileUpdated,
          address: sido.includes("???") ? sigungu : sido,
          hidden: hidden ? true : false,
          type,
          blur,
          coordinatesArr,
        };
      })
    );

    result.status = true;
    result.body = { list: updated };
    return result;
  } catch (err) {
    console.log(err);
    throw err;
  }
}
/**
 * ?????? ????????????
 * 1. ?????? ?????? ????????? ???????????? - ????????? 0??? - 23????????? ???????????? ?????? ??? ???????????? ????????? ?????? ??????
 * 2. ?????? ????????? ????????? ????????????
 * 3. ?????? ?????? ????????? ?????????
 * @param {String} userId
 * @param {String} otherUserId
 */
async function getHidden(userId, otherUserId) {
  try {
    // ????????? ??????
    const reqModel = {
      userId: { type: "str" },
      otherUserId: { type: "str" },
    };
    valid({ userId, otherUserId }, reqModel);

    // otherUserId??? db??? ??????????????? ??????
    const hasUser = await userDb.findUserById(otherUserId);
    if (!hasUser) {
      result.status = false;
      result.body = errorMessage.dbError.userNotFound;
      return result;
    }

    // ?????? ?????? ????????? ??????
    const now = new Date(new Date().setHours(0, 0, 0, 0)),
      yesterday = new Date(new Date(now).setDate(now.getDate() - 1));

    // ????????? ???????????? ????????????
    const isHiddenUpdated = await meetDb.getCurrentHidden(userId, otherUserId);
    if (
      isHiddenUpdated === null ||
      isHiddenUpdated.date.toString() !== yesterday.toString()
    ) {
      // ????????? ?????? ??? ????????? ?????? ??????????????????
      await meetDb.deleteAllHidden(userId, otherUserId);
      await calculateHidden(userId, otherUserId, now);
    }

    // ?????? ????????? - ?????? ?????????
    const hiddens = await meetDb.getAllHidden(userId, otherUserId);
    const updated = (
      await Promise.all(
        hiddens.map(async ({ date, _id, userId, otherUserId, ...rest }) => {
          const startTime = date;
          const endTime = new Date(
            new Date(startTime).setDate(startTime.getDate() + 1)
          );
          const pointsArr = await meetDb.getHiddenCoordinates(
            userId,
            otherUserId,
            startTime,
            endTime
          );
          const coordinatesArr = pointsArr.map((m) => m.coordinates);

          return {
            ...rest,
            date,
            coordinatesArr,
          };
        })
      )
    ).sort((f, s) => {
      if (f.day_ago < s.day_ago) return -1;
      else if (f.day_ago > s.day_ago) return 1;
      return 0;
    });

    result.status = true;
    result.body = { list: updated };
    return result;
  } catch (err) {
    console.log(err);
    throw err;
  }
}
/**
 * ?????? ????????????
 * @param {String} userId
 * @param {String} otherUserId
 * @param {Date} now
 * @returns {Promise<void>}
 */
async function calculateHidden(userId, otherUserId, now) {
  try {
    const arr = [];
    arr.length = 7;
    arr.fill("i");

    await Promise.all(
      arr.map(async (x, i) => {
        const startTime = new Date(
            new Date(now).setDate(now.getDate() - (i + 1))
          ),
          endTime = new Date(new Date(now).setDate(now.getDate() - i)),
          hiddenArr = await meetDb.getHiddenArr(
            userId,
            otherUserId,
            startTime,
            endTime
          );
        if (hiddenArr.length === 0) return;

        const spots = calculateSpots(hiddenArr);
        const meet = hiddenArr.length;

        const meetHidden = MeetHidden({
          userId,
          otherUserId,
          meet,
          spots,
          day_ago: i + 1,
          date: startTime,
        });
        await meetDb.insertHidden(meetHidden);
      })
    );
  } catch (err) {
    console.log(err);
    throw err;
  }
}
/**
 * ?????? ?????? ??? ??? ????????????
 * @param {String} userId
 * @returns {Promise<void>}
 */
async function calculateMeetRanking(userId) {
  try {
    const matchingUsers = await meetDb.getMatchingUsers(userId);
    if (matchingUsers.length === 0) return;
    await Promise.all(
      matchingUsers.map(async (otherUserId) => {
        const matchingData = await meetDb.getMeetMatchingTs(
          userId,
          otherUserId
        );
        const spots = calculateSpots(matchingData);
        const meet = matchingData.length,
          meetCount = await mateListDb.getMeetMatchingCount(
            userId,
            otherUserId
          ),
          score = Math.floor((meet * 0.3 + spots * 0.7) * 10);
        const { age: ageDate, gender } = await userDb.getAgeGender(otherUserId);
        const age = getAge(ageDate);
        await meetDb.insertRanking(
          MeetRanking({
            userId,
            otherUserId,
            meet,
            spots,
            meetCount,
            score,
            age,
            gender,
            hide: false,
            updatedAt: currentTime,
          })
        );
      })
    );
  } catch (err) {
    console.log(err);
    throw err;
  }
}
/**
 * ?????? ????????????
 * @param {Array} arr
 * @returns {Number}
 */
function calculateSpots(arr) {
  const tsArr = arr.map(({ timestamp }) => timestamp);
  let spots = 1;
  for (let i = 0; i < tsArr.length; i++) {
    if (i === 0) continue;
    if (i === tsArr.length - 1) continue;
    const diff = tsArr[i] - tsArr[i - 1];
    if (diff > 1000 * 60 * 11) spots++;
  }
  return spots;
}
async function addUserInfoToObj(obj) {
  try {
    const { otherUserId: userId } = obj,
      { nickname, profilePic } = await userDb.getNicknameAndProfileImage(
        userId
      );
    delete obj.userId;
    delete obj.otherUserId;
    return {
      ...obj,
      userInfo: {
        userId,
        nickname,
        profilePic,
      },
    };
  } catch (err) {
    console.log(err);
    throw err;
  }
}
async function getHomeDistance() {
  const areaRadios = await meetDb.getRadios("areaRadios");

  const _id = generateId();
  if (!areaRadios) {
    await meetDb.insertRadios({ _id: _id, key: "areaRadios", value: "30" });
  }
  let value = areaRadios ? areaRadios.value : 30;
  return parseInt(value);
}
async function isItHomeDistance(coord1, coord2) {
  const homeDistance = await getHomeDistance();
  const distance = getDistanceBetweenTwoInKm(coord1, coord2);
  // ?????? ????????? ???
  return distance <= homeDistance;
}
function getDistanceBetweenTwoInKm([long1, lat1], [long2, lat2]) {
  const R = 6371,
    dLong = deg2rad(long2 - long1),
    dLat = deg2rad(lat2 - lat1),
    a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLong / 2) *
        Math.sin(dLong / 2),
    c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)),
    d = R * c; // distance in km
  return d;
}
function deg2rad(deg) {
  return deg * (Math.PI / 180);
}
function getAge(ageAsDate) {
  const thisYear = new Date().getFullYear();
  return thisYear - new Date(ageAsDate).getFullYear() + 1;
}
/**
 * ?????? ?????? - ?????? ????????? ????????? ?????? ????????? ?????? ?????????
 * 1. ??? ?????? ?????????
 * 2. ?????? ????????? ??? ?????????, ?????? ??? ?????? ????????? ?????? ???
 * 3. ?????? ????????? ??? ?????????,
 * 4. ?????? ????????? ??? ?????????
 * @param {String} userId
 * @returns {Promise<void>}
 */
async function deleteAllMeetDataByUser(userId) {
  try {
    await Promise.all([
      meetDb.deleteMyGeoJson(userId),
      meetDb.deleteMeetMatchingByUser(userId),
      meetDb.deleteAllRankingByUser(userId),
      meetDb.deleteAllHiddenByUser(userId),
    ]);
  } catch (err) {
    console.log(err);
    throw err;
  }
}

async function getPlaceList(body) {
  try {
    let query = {};
    if (body.type) {
      query = { type: parseInt(body.type) };
    }
    const dbResult = await meetDb.getPlaceList(query);
    result.status = true;
    result.body = { dbResult };
    return result;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

function getDistance(lon1, lat1, lon2, lat2) {
  if (lat1 == lat2 && lon1 == lon2) return 0;

  var radLat1 = (Math.PI * lat1) / 180;
  var radLat2 = (Math.PI * lat2) / 180;
  var theta = lon1 - lon2;
  var radTheta = (Math.PI * theta) / 180;
  var dist =
    Math.sin(radLat1) * Math.sin(radLat2) +
    Math.cos(radLat1) * Math.cos(radLat2) * Math.cos(radTheta);
  if (dist > 1) dist = 1;

  dist = Math.acos(dist);
  dist = (dist * 180) / Math.PI;
  dist = dist * 60 * 1.1515 * 1.609344 * 1000;
  if (dist < 100) dist = Math.round(dist / 10) * 10;
  else dist = Math.round(dist / 100) * 100;

  return dist;
}

async function getHiddenTest(userId, otherId) {
  let coordinates = [129.11299342594697, 35.199405044181674];
  let now = new Date(new Date().setMinutes(0, 0));
  let time = new Date(now.setHours(now.getHours() - 5));

  const myGeoJson = GeoJson({ userId, coordinates, timestamp: time });
  const otherGeoJson = GeoJson({
    userId: otherId,
    coordinates,
    timestamp: time,
  });
  await meetDb.insertAllGeoJson(myGeoJson);
  await meetDb.insertAllGeoJson(otherGeoJson);
  Promise.all([
    await meetDb.insertMeetMatching(
      MeetMatching({
        userId: userId,
        otherUserId: otherId,
        timestamp: time,
        coordinates: coordinates,
      })
    ),
    await meetDb.insertMeetMatching(
      MeetMatching({
        userId: otherId,
        otherUserId: userId,
        timestamp: time,
        coordinates: coordinates,
      })
    ),

    await meetDb.insertMeetMatching(
      MeetMatching({
        userId: userId,
        otherUserId: otherId,
        timestamp: new Date(time.setDate(time.getDate() - 1)),
        coordinates: coordinates,
      })
    ),
    await meetDb.insertMeetMatching(
      MeetMatching({
        userId: otherId,
        otherUserId: userId,
        timestamp: new Date(time.setDate(time.getDate())),
        coordinates: coordinates,
      })
    ),

    await meetDb.insertMeetMatching(
      MeetMatching({
        userId: userId,
        otherUserId: otherId,
        timestamp: new Date(time.setDate(time.getDate() - 1)),
        coordinates: coordinates,
      })
    ),
    await meetDb.insertMeetMatching(
      MeetMatching({
        userId: otherId,
        otherUserId: userId,
        timestamp: new Date(time.setDate(time.getDate())),
        coordinates: coordinates,
      })
    ),

    await meetDb.insertMeetMatching(
      MeetMatching({
        userId: userId,
        otherUserId: otherId,
        timestamp: new Date(time.setDate(time.getDate() - 1)),
        coordinates: coordinates,
      })
    ),
    await meetDb.insertMeetMatching(
      MeetMatching({
        userId: otherId,
        otherUserId: userId,
        timestamp: new Date(time.setDate(time.getDate())),
        coordinates: coordinates,
      })
    ),

    await meetDb.insertMeetMatching(
      MeetMatching({
        userId: userId,
        otherUserId: otherId,
        timestamp: new Date(time.setDate(time.getDate() - 1)),
        coordinates: coordinates,
      })
    ),
    await meetDb.insertMeetMatching(
      MeetMatching({
        userId: otherId,
        otherUserId: userId,
        timestamp: new Date(time.setDate(time.getDate())),
        coordinates: coordinates,
      })
    ),

    await meetDb.insertMeetMatching(
      MeetMatching({
        userId: userId,
        otherUserId: otherId,
        timestamp: new Date(time.setDate(time.getDate() - 1)),
        coordinates: coordinates,
      })
    ),
    await meetDb.insertMeetMatching(
      MeetMatching({
        userId: otherId,
        otherUserId: userId,
        timestamp: new Date(time.setDate(time.getDate())),
        coordinates: coordinates,
      })
    ),
  ]);
  result.status = true;
  result.body = null;
  return result;
}

async function isPassAvailable(userId, service) {
  try {
    const currentPass = await userDb.getPass(userId);
    const pass = currentPass.find((x) => x.service === service);
    if (typeof pass === "undefined") return false;
    const now = new Date();
    // endAt ??? ???????????? ????????? ????????? ???????????? ????????? true ????????? false
    return pass.endAt >= now;
  } catch (err) {
    console.log(err);
    throw err;
  }
}
