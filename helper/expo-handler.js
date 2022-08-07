import { Expo } from "expo-server-sdk";
import { config } from "dotenv";
import { userDb } from "../db-handler/index.js";
import errorMessage from "../helper/error.js";
import { delay } from "./js-helper.js";
config({ path: "config/.env" });
const expo_handler = {
  sendNotificationsToSomeUsers,
  sendNotificationToEveryone,
};
export { expo_handler };

const expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });
const title = "크로스";
const err = new Error();

/**
 * 1. get expo tokens
 * 2. create message array using expo token
 * 3. make message array to chunk -> chunk push notification
 * 4. send chunk push notification & get tickets
 * 5. get id from tickets for receipts & handling ticket error
 * 6. chunk ids -> chunk push notification receipts id
 * 7. get receipts by sending chunk ids & error handling
 */

/**
 * data: optional
 * userIds Array를 받아서 message를 해당 유저에게 보낸다
 * 없을 경우 보내지 않는다
 * @param {object} param0 {userIds: Array, message: String, data: object}
 * @returns {Promise<void>} or throw error or return nothing if nothing should be sent
 * @error log & throw
 */
async function sendNotificationsToSomeUsers({
  userIds,
  message,
  data,
  nickname,
}) {
  try {
    // param 체크
    if (!userIds) {
      err.message = errorMessage.nullError.idMissing.message;
      err.code = errorMessage.nullError.idMissing.code;
      throw err;
    }
    if (!message) {
      err.message = errorMessage.nullError.contentMissing.message;
      err.code = errorMessage.nullError.contentMissing.code;
      throw err;
    }
    if (!checkBytes(message)) {
      err.message = errorMessage.syntaxError.tooLongMessage.message;
      err.code = errorMessage.syntaxError.tooLongMessage.code;
      throw err;
    }
    // token 가져오기
    const pushTokens = (await userDb.getExpoTokens(userIds)).filter(
      (token) => token
    );
    if (!pushTokens[0]) return; // expo token이 아무도 없기에 다시 되돌아가야 함
    const messages = pushTokens.map((pushToken) => {
      return {
        to: pushToken,
        title: nickname || title,
        body: message,
        data,
        nickname,
      };
    });
    // chunk로 나누기 -> 너무 크면 안되기 때문
    const pushChunks = expo.chunkPushNotifications(messages);
    // push notification 보내기. ticket을 되돌려줌.
    const tickets = await Promise.all(
      pushChunks.map((chunk) => expo.sendPushNotificationsAsync(chunk))
    );

    const receiptIds = [];
    // NOTE tickets에 에러가 있는지 검사 & 에러 핸들링
    tickets.forEach((ticket) =>
      ticket.forEach((t) => {
        const { details, message, id } = t;
        if (id) receiptIds.push(id);
        if (details && details.error === "DeviceNotRegistered")
          getExpoTokenFromMsgAndDelete(message);
      })
    );

    // ticket id를 chunk로 나누기.
    // 발송이 안 되었을 경우 error message 받을 수 있음
    const receiptChunks = expo.chunkPushNotificationReceiptIds(receiptIds);
    // receipt 받기 전 기다리기 -> expo의 추천은 15분
    await delay(10000);
    // ANCHOR error handling
    receiptChunks.forEach(async (chunk) => {
      const receipts = await expo.getPushNotificationReceiptsAsync(chunk);
      for (let receipt in receipts) {
        const { message, details } = receipts[receipt];
        if (details && details.error === "DeviceNotRegistered")
          getExpoTokenFromMsgAndDelete(message);
        else if (details && details.error === "InvalidCredentials")
          getExpoTokenFromMsgAndDelete(message);
      }
    });
  } catch (err) {
    console.log(err);
    throw err;
  }
}
/**
 * 모든 유저에게 푸시 알림 보내기
 * @param {object} param0 {message: string, data: object}
 * @returns {Promise<void>} or throw error or return nothing if nothing to be sent
 * @error log & throw
 */
async function sendNotificationToEveryone({ message, data }) {
  try {
    if (!message) {
      err.message = errorMessage.nullError.contentMissing.message;
      err.code = errorMessage.nullError.contentMissing.code;
      throw err;
    }
    const pushTokens = (await userDb.getExpoTokens()).filter((token) => token);
    if (!pushTokens) return;
    const messages = pushTokens.map((pushToken) => {
      return {
        to: pushToken,
        title,
        body: message,
        data,
      };
    });
    const pushChunks = expo.chunkPushNotifications(messages);
    await Promise.all(
      pushChunks.map((chunk) => expo.sendPushNotificationsAsync(chunk))
    );
    // No Error handling
  } catch (err) {
    console.log(err);
    throw err;
  }
}
/**
 * check if string is bigger than 4096 bytes
 * @param {String} message
 * @returns {boolean}
 */
function checkBytes(message) {
  if (Buffer.from(message).length > 4096) return false;
  else return true;
}
function getExpoTokenFromMsgAndDelete(message) {
  userDb.deleteExpoToken(message.split(/\"+/g)[1]);
}
