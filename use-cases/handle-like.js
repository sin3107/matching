import {
  hideDb,
  likeDb,
  mateListDb,
  userDb,
  meetDb,
} from "../db-handler/index.js";
import errorMessage from "../helper/error.js";
import { expo_handler } from "../helper/expo-handler.js";
import { generateId } from "../helper/id-generator.js";
import SocketHandler from "../helper/socket-handler.js";
import { Like, MateList } from "../models/index.js";
import { payment_use_case } from "./handle-payment.js";

import { systemMessage_use_case } from "./handle-systemMessage.js";

export const like_use_case = {
  sendLike,
  getLikes,
  checkSendLike,
  deleteAllLikebyUser,
};
const result = {
  status: false,
  body: "",
};

/**
 * 좋아요 보내기 전 valid 확인하기
 * @param {object} body {likeFrom, likeTo, type}
 * @returns {Promise<{status: boolean, body: object}>}
 */
async function checkSendLike(body) {
  try {
    // ANCHOR checking errors
    const { likeFrom, likeTo, type } = body;
    if (!likeFrom) {
      result.status = false;
      result.body = errorMessage.nullError.likeFromMissing;
      return result;
    }
    if (!likeTo) {
      result.status = false;
      result.body = errorMessage.nullError.likeToMissing;
      return result;
    }
    if (typeof type === "undefined") {
      result.status = false;
      result.body = errorMessage.nullError.likeTypeMissing;
      return result;
    }
    const typeFromDb = await likeDb.getLikeTypes();
    if (!typeFromDb.includes(type)) {
      result.status = false;
      result.body = errorMessage.nullError.likeTypeMissing;
      return result;
    }
    const hasFromUser = await userDb.findUserById(likeFrom);
    if (!hasFromUser) {
      result.status = false;
      result.body = errorMessage.dbError.userNotFound;
      return result;
    }
    const hasToUser = await userDb.findUserById(likeTo);
    if (!hasToUser) {
      result.status = false;
      result.body = errorMessage.dbError.userNotFound;
      return result;
    }
    // NOTE 같은 종류의 matching이 완료 되었으면 친구해요를 보낼 수 없음
    const matching = await mateListDb.findMatching(likeFrom, likeTo);
    // if(type === 0 && matching && matching.matching.includes('meet')){
    //     result.status = false;
    //     result.body = errorMessage.dbError.alreadyLikeMatched
    //     return result
    // }
    // if(type === 1 && matching && matching.matching.includes('community')){
    //     result.status = false;
    //     result.body = errorMessage.dbError.alreadyLikeMatched
    //     return result
    // }
    if (matching) {
      result.status = false;
      result.body = errorMessage.dbError.alreadyLikeMatched;
      return result;
    }

    // NOTE 어떤 종류 이든 한 번 친구해요를 보낸 상대에게 한번 더 보낼 수는 없음
    const isResend = await likeDb.findAnyLike({ from: likeFrom, to: likeTo });
    if (isResend) {
      result.status = false;
      result.body = errorMessage.dbError.likeResend;
      return result;
    }
    result.status = true;
    return result;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

async function hideEachOther(userId1, userId2) {
  try {
    await hideDb.insertHide({
      _id: generateId(),
      hideBy: userId1,
      hideUserId: userId2,
    });
    await meetDb.updateRankings(
      { userId: userId1, otherUserId: userId2 },
      { $set: { hide: true } }
    );
    await hideDb.insertHide({
      _id: generateId(),
      hideBy: userId2,
      hideUserId: userId1,
    });
    await meetDb.updateRankings(
      { userId: userId2, otherUserId: userId1 },
      { $set: { hide: true } }
    );
  } catch (err) {
    console.log(err);
    throw err;
  }
}

/**
 * get like and send like or make them matching
 * @param {object} body {likeFrom, likeTo, type}
 * @returns {Promise<{matching: boolean}>} false: 좋아요 보냄 true: 매칭 완료
 * @error Log & throw
 */
async function sendLike(body) {
  try {
    const { likeFrom, likeTo, type } = body;
    // ANCHOR checking matching
    // NOTE 매칭이 되려면 타입 까지 같아야 함
    // 나에게 보낸게 있으면 true, 없으면 false
    const isMatching = await likeDb.findLikeForMatching(likeTo, likeFrom);

    // 친구해요 받기
    // 이전에 보낸 내역이 있으면 친구해요 수락으로 동작
    if (isMatching) {
      // like 처리 (기존 것 지우고 matelist 추가하기)
      await likeDb.deleteLike(likeTo, likeFrom);
      const hasMateList = await mateListDb.getMateList(likeFrom, likeTo);
      if (!hasMateList)
        await mateListDb.insertMateList(
          MateList({ users: [likeTo, likeFrom] })
        );
      if (type === 0) await mateListDb.addMeetMatching(likeTo, likeFrom);
      else if (type === 1)
        await mateListDb.addCommunityMatching(likeTo, likeFrom);

      //메이트 리스트 숨김 처리
      await hideEachOther(likeTo, likeFrom);

      // 무료 코인 처리
      await payment_use_case.getFreeCoinByMessage(likeFrom, likeTo);

      await systemMessage_use_case.addSystemMessage(likeTo, {
        type: 0,
        content: "상대방과 매칭되었습니다.",
      });

      if (await SocketHandler.isSocketConnected({ of: likeTo })) {
        SocketHandler.socketEmit({
          of: likeTo,
          url: "/api/main/mate",
          data: {
            state: true,
          },
        });
      } else {
        expo_handler.sendNotificationsToSomeUsers({
          userIds: [likeTo],
          message: `${likeFromNickname}님과 매칭되었습니다.`,
        });
      }

      result.status = true;
      result.body = { matching: true };
      return result;

      // 이전에 보낸 내역이 없으면 친구해요 보내기로 동작
    } else {
      // 결제 진행 먼저
      const isPaid = await payment_use_case.buyLikeMessge(body);
      if (!isPaid.status) {
        result.status = false;
        result.body = isPaid.body;
        return result;
      }

      // like 처리
      const like = Like({ likeFrom, likeTo, type });
      await likeDb.insertLike(like);

      // socket 혹은 expo handler로 알림 보내기
      const { nickname: likeFromNickname } =
        await userDb.getNicknameAndProfileImage(likeFrom);
      if (await SocketHandler.isSocketConnected({ of: likeTo })) {
        SocketHandler.socketEmit({
          of: likeTo,
          url: "/api/likes/receive",
          data: {
            likeFromId: likeFrom,
            likeFromNickname,
          },
        });
        SocketHandler.socketEmit({
          of: likeTo,
          url: "/api/main/like",
          data: { state: true },
        });
      } else {
        expo_handler.sendNotificationsToSomeUsers({
          userIds: [likeTo],
          message: `${likeFromNickname}님이 친구해요를 보냈습니다!`,
        });
      }

      // 친구해요 전송
      await systemMessage_use_case.addSystemMessage(likeTo, {
        type: 0,
        content: "새로운 친구해요 카드가 도착했습니다.",
      });

      // result
      result.status = true;
      result.body = { matching: false };
      return result;
    }
  } catch (err) {
    console.log(err);
    throw err;
  }
}
/**
 * get user id and return all likes about the user
 * @param {String} userId userId
 * @returns {Promise<{likeFromList: Array, likeToList: Array}>} array or null
 */
async function getLikes(userId, imSend, timestamp) {
  try {
    if (!userId) {
      result.status = false;
      result.body = errorMessage.nullError.idMissing;
      return result;
    }
    if (
      typeof imSend === "undefined" ||
      (imSend != "true" && imSend != "false")
    ) {
      result.status = false;
      result.body = errorMessage.nullError.likeImSendMissing;
      return result;
    }
    imSend = imSend == "true";
    if (timestamp && isNaN(new Date(timestamp))) {
      result.status = false;
      result.body = errorMessage.syntaxError.timestampNotDate;
      return result;
    }
    if (!timestamp) timestamp = new Date();
    const hasUser = await userDb.findUserById(userId);
    if (!hasUser) {
      result.status = false;
      result.body = errorMessage.dbError.userNotFound;
      return result;
    }
    let likeList = [],
      updatedList = [];
    if (imSend) {
      likeList = await likeDb.findLikeTo(userId, new Date(timestamp));
      updatedList = await Promise.all(
        likeList.map(async (like) => {
          const { likeFrom } = like;
          const userInfo = await getUserInfo(likeFrom);
          return {
            ...like,
            otherInfo: userInfo,
          };
        })
      );
    } else {
      likeList = await likeDb.findLikeFrom(userId, new Date(timestamp));
      updatedList = await Promise.all(
        likeList.map(async (like) => {
          const { likeTo } = like;
          const userInfo = await getUserInfo(likeTo);
          return {
            ...like,
            otherInfo: userInfo,
          };
        })
      );
    }
    result.status = true;
    result.body = { likeList: updatedList };
    return result;
  } catch (err) {
    console.log(err);
    throw err;
  }
}
async function getUserInfo(userId) {
  const { nickname, profilePic, age, gender, sido, sigungu } =
    await userDb.getNicknameProfileImageAgeGenderAddress(userId);
  return {
    userId,
    nickname,
    profileImage: profilePic,
    age,
    gender,
    address: sido.includes("도") ? sigungu : sido,
  };
}
/**
 * 탈퇴 관련 - 모든 친구해요 삭제하기
 * 1. likeTo나 likeFrom 모든 타입에서 자기 찾아서 삭제하기...?
 * @param {String} userId
 * @returns {Promise<void>}
 */
function deleteAllLikebyUser(userId) {
  try {
    return likeDb.deleteLikeOfUser(userId);
  } catch (err) {
    console.log(err);
    throw err;
  }
}
