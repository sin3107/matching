import { payment_use_case } from "../use-cases/handle-payment.js";
import { meet_use_case } from "../use-cases/handle-meet.js";

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

export {
  postMeet,
  getMyGeo,
  getMeetByUser,
  getMeetList,
  getHidden,
  getPlaceList,
  getHiddenTest,
};
/**
 * save geo json
 * @param {Object} httpRequest
 * @returns {Promise<{statusCode: String, headers: any, body: null}>} nothing or error message of http response
 * @error log & return
 */
async function postMeet(httpRequest) {
  try {
    const { body } = httpRequest;
    const result = await meet_use_case.addGeoJson(body);
    if (result.status) {
      httpResponse.statusCode = created;
      httpResponse.body = result.body;
      return httpResponse;
    } else {
      httpResponse.statusCode = badRequest;
      httpResponse.body = result.body;
      return httpResponse;
    }
  } catch (err) {
    console.log(err);
    httpResponse.statusCode = serverError;
    httpResponse.body = err.message;
    return httpResponse;
  }
}
/**
 * 내 동선 얻기
 * @param {object} httpRequest
 * @returns {Promise<object>}
 */
async function getMyGeo(httpRequest) {
  try {
    const {
      body: {
        user: { _id },
      },
    } = httpRequest;
    const { status, body } = await meet_use_case.getMyGeoPoints(_id);
    if (!status) httpResponse.statusCode = badRequest;
    else httpResponse.statusCode = ok;
    httpResponse.body = body;
    return httpResponse;
  } catch (err) {
    console.log(err);
    httpResponse.statusCode = serverError;
    httpResponse.body = err.message;
    return httpResponse;
  }
}
async function getMeetByUser(httpRequest) {
  try {
    const {
      params: { userId },
      body: {
        user: { _id },
      },
    } = httpRequest;
    const { status, body } = await meet_use_case.getCoordinatesByUser(
      _id,
      userId
    );
    if (!status) httpResponse.statusCode = badRequest;
    else httpResponse.statusCode = ok;
    httpResponse.body = body;
    return httpResponse;
  } catch (err) {
    console.log(err);
    httpResponse.statusCode = serverError;
    httpResponse.body = err.message;
    return httpResponse;
  }
}

/**
 * 크로스 매칭 리스트 받기 - 랭킹 리스트
 * @param {object} httpRequest
 * @returns {Promise<object>}
 */
async function getMeetList(httpRequest) {
  try {
    const {
      query: { type, pagination },
      body: {
        user: { _id },
      },
    } = httpRequest;
    const { status, body } = await meet_use_case.getMeetList(
      _id,
      type,
      pagination
    );
    if (!status) httpResponse.statusCode = badRequest;
    else httpResponse.statusCode = ok;
    httpResponse.body = body;
    return httpResponse;
  } catch (err) {
    console.log(err);
    httpResponse.statusCode = serverError;
    httpResponse.body = err.message;
    return httpResponse;
  }
}
/**
 * 히든 얻기
 * @param {object} httpRequest
 * @returns {Promise<object>}
 */
async function getHidden(httpRequest) {
  try {
    const {
      body: {
        user: { _id },
      },
      params: { userId },
    } = httpRequest;

    // 구매 진행하기
    const payment = await payment_use_case.buyTimeItem(_id, userId, "hidden");
    if (payment.status === false) {
      httpResponse.statusCode = badRequest;
      httpResponse.body = payment.body;
      return httpResponse;
    }

    const { status, body } = await meet_use_case.getHidden(_id, userId);
    httpResponse.statusCode = status ? ok : badRequest;
    httpResponse.body = body;
    return httpResponse;
  } catch (err) {
    console.log(err);
    httpResponse.statusCode = serverError;
    httpResponse.body = err.message;
    return httpResponse;
  }
}

async function getPlaceList(httpRequest) {
  try {
    const { query } = httpRequest;

    const { status, body } = await meet_use_case.getPlaceList(query);
    httpResponse.statusCode = status ? ok : badRequest;
    httpResponse.body = body;
    return httpResponse;
  } catch (err) {
    console.log(err);
    httpResponse.statusCode = serverError;
    httpResponse.body = err.message;
    return httpResponse;
  }
}

async function getHiddenTest(httpRequest) {
  try {
    const {
      body: {
        user: { _id },
      },
      params: { userId },
    } = httpRequest;
    const { status, body } = await meet_use_case.getHiddenTest(_id, userId);
    httpResponse.statusCode = status ? ok : badRequest;
    httpResponse.body = body;
    return httpResponse;
  } catch (err) {
    console.log(err);
    httpResponse.statusCode = serverError;
    httpResponse.body = err.message;
    return httpResponse;
  }
}
