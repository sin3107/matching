import { like_use_case } from "../use-cases/handle-like.js";
import { payment_use_case } from "../use-cases/handle-payment.js";

const httpResponse = {
  headers: "",
  statusCode: "",
  body: "",
};

// ANCHOR status code list
const ok = "200";
const created = "201";
const badRequest = "400";
const unauthorized = "401";
const serverError = "500";

export { postLike, getLikes };
/**
 * send like or create matching
 * @param {object} httpRequest body: {likeFrom, likeTo}
 * @returns {Promise<object>}
 * @error log & return
 */
async function postLike(httpRequest) {
  try {
    const { body: reqBody } = httpRequest;

    // 유효성 확인
    const validCheck = await like_use_case.checkSendLike(reqBody);
    if (validCheck.status === false) {
      httpResponse.statusCode = badRequest;
      httpResponse.body = validCheck.body;
      return httpResponse;
    }

    // 유효성 확인 후 결제 진행 -> 친구해요 보내기인지 친구해요 답장인지에 따라 다름으로 use case로 옮김

    // 결제 진행 후 좋아요 보내기 진행 -> 친구해요 보내는 중에 결제를 할지 무료 코인을 할지 정한다
    const result = await like_use_case.sendLike(reqBody);
    if (result.status) {
      httpResponse.statusCode = created;
      httpResponse.body = result.body;
      return httpResponse;
    }
    httpResponse.statusCode = badRequest;
    httpResponse.body = result.body;
    return httpResponse;
  } catch (err) {
    console.log(err);
    httpResponse.statusCode = serverError;
    httpResponse.body = err.message;
    return err;
  }
}
/**
 * get user id and return all likes about the user
 * @param {object} httpRequest params: userId
 * @returns {Promise<object>} likeFromList, likeToList
 */
async function getLikes(httpRequest) {
  try {
    const {
      params: { userId },
      query: { imSend, timestamp },
      body: {
        user: { _id },
      },
    } = httpRequest;
    const result = await like_use_case.getLikes(_id, imSend, timestamp);
    if (result.status) {
      httpResponse.statusCode = ok;
      httpResponse.body = result.body;
      return httpResponse;
    }
    httpResponse.statusCode = badRequest;
    httpResponse.body = result.body;
    return httpResponse;
  } catch (err) {
    console.log(err);
    httpResponse.statusCode = serverError;
    httpResponse.body = err.message;
    return err;
  }
}
