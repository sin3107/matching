import { deleteFile } from "../helper/file-handler.js";
import { auth_use_cases } from "../use-cases/handle-auth.js";
import { payment_use_case } from "../use-cases/handle-payment.js";
import { user_use_cases } from "../use-cases/handle-user.js";
import { paymentDb } from "../db-handler/index.js";

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
  postUser,
  postUserLogin,
  getIdentitiesEmail,
  getIdentitiesNickname,
  getAccessToken,
  getPhoneVerificationCode,
  getVerifyPhone,
  getEmailbyPhone,
  postIdentitiesPassword,
  getMyPhoneNumber,
  getMyProfile,
  getUserProfile,
  putUserProfile,
  deleteUser,
  putProfileImage,
  putIdentitiesPhone,
  putUserSleep,
  putSetting,
  postExpoToken,
  getReferrerCode,
  getSettings,
  getPrivacy,
};
/**
 *
 * @param {Object} httpRequest
 * @returns http response
 * @error log & return response
 */
async function postUser(httpRequest) {
  try {
    const { body } = httpRequest;
    //send request body with processed information to use-case and get result
    const result = await user_use_cases.registerUser(body);
    //based on the result from use-case, build httpresponse
    if (result.status) {
      httpResponse.statusCode = created;
      httpResponse.body = result.body;
      return httpResponse;
    } else {
      // 정상적 return일 경우 여기서 파일 지우기
      // error 일 경우 use-case에서 파일 지우기
      httpResponse.statusCode = badRequest;
      httpResponse.body = result.body;
      //return httpresponse with code, body, maybe headers
      return httpResponse;
    }
  } catch (err) {
    console.log(err);
    httpResponse.statusCode = badRequest;
    httpResponse.body = err.message;
    return httpResponse;
  }
}
/**
 *
 * @param {Object} httpRequest
 * @returns http response
 * @error log & return response
 */
async function postUserLogin(httpRequest) {
  try {
    const result = await user_use_cases.loginEmailUser(httpRequest.body);
    if (result.status) {
      httpResponse.statusCode = ok;
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
 *
 * @param {Object} httpRequest
 * @returns http response
 * @error log & return response
 */
async function getIdentitiesEmail(httpRequest) {
  try {
    const {
      params: { email },
    } = httpRequest;
    const result = await user_use_cases.checkEmailExistence(email);
    if (result.status) {
      httpResponse.statusCode = ok;
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
 *
 * @param {Object} httpRequest
 * @returns http response
 * @error log & return response
 */
async function getIdentitiesNickname(httpRequest) {
  try {
    const nickname = httpRequest.params.nickname;
    const result = await user_use_cases.checkNicknameExistence(nickname);
    if (result.status) {
      httpResponse.statusCode = ok;
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
 *
 * @param {Object} httpRequest
 * @returns http response
 * @error log & return response
 */
async function getEmailbyPhone(httpRequest) {
  try {
    const {
      params: { phone },
    } = httpRequest;
    const result = await user_use_cases.findEmailByPhone(phone);
    if (result.status) {
      httpResponse.statusCode = ok;
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
 *
 * @param {Object} httpRequest
 * @returns http response
 * @error log & return response
 */
async function postIdentitiesPassword(httpRequest) {
  try {
    const result = await user_use_cases.changePassword(httpRequest.body);
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
 * get user id from token and return my phone number
 * @param {object} httpRequest {body: {user: {_id}}}
 * @returns {Promise<{statusCode: string, body: object, headers: object}>}
 */
async function getMyPhoneNumber(httpRequest) {
  try {
    const {
      body: {
        user: { _id },
      },
    } = httpRequest;
    const { status, body } = await user_use_cases.getUserPhoneNumber(_id, _id);
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
 * get user id from token and return my profile
 * @param {object} httpRequest {body: {user: {_id}}}
 * @returns {Promise<{statusCode: string, body: object, headers: object}>}
 */
async function getMyProfile(httpRequest) {
  try {
    const {
      body: {
        user: { _id },
      },
    } = httpRequest;
    const { status, body } = await user_use_cases.getWholeProfile(_id, _id);
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
 * get other user id from params and return detail(whole) profile
 * @param {object} httpRequest {params: userId}
 * @returns {Promise<{statusCode: string, body: object, headers: object}>}
 */
async function getUserProfile(httpRequest) {
  try {
    const {
      params: { userId },
      body: {
        user: { _id },
      },
    } = httpRequest;

    //const {_id: profileId} = await paymentDb.getServiceCost({service: 'profile'})
    const { _id: chatId } = await paymentDb.getServiceCost({ service: "chat" }),
      serviceList = { chatId };

    const hasBought = await payment_use_case.checkItemLog(
      _id,
      userId,
      "profile"
    );

    // 해당 유저의 상세를 구매했는지 안 했는지 확인
    const { status, body } =
      hasBought.status === true
        ? await user_use_cases.getWholeProfileAndService(
            userId,
            _id,
            serviceList
          )
        : await user_use_cases.getBasicProfile(userId, _id, serviceList);

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
/**
 *
 * @param {Object} httpRequest
 * @returns http response
 * @error log & return response
 */
async function putUserProfile(httpRequest) {
  try {
    const {
      body: {
        user: { _id },
        basicProfile,
        detailProfile,
        deletedFiles,
        isCompleted,
        pictures,
      },
    } = httpRequest;
    const result = await user_use_cases.editUserProfile(_id, {
      basicProfile,
      detailProfile,
      deletedFiles,
      isCompleted,
      pictures,
    });
    if (result.status) {
      httpResponse.statusCode = ok;
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
    httpResponse.body = error.message;
    return httpResponse;
  }
}
/**
 *
 * @param {Object} httpRequest
 * @returns http response
 * @error log & return response
 */
async function deleteUser(httpRequest) {
  try {
    const {
      body: {
        user: { _id },
      },
    } = httpRequest;

    const { status, body } = await user_use_cases.deleteUser(_id);

    httpResponse.statusCode = status ? ok : badRequest;
    httpResponse.body = body;
    return httpResponse;
  } catch (err) {
    console.log(err);
    httpResponse.statusCode = serverError;
    httpResponse.body = error.message;
    return httpResponse;
  }
}
/**
 * set new profile image
 * @param {Object} httpRequest id, profileImage
 * @returns http response, profileImage
 * @error log & return
 */
async function putProfileImage(httpRequest) {
  try {
    const {
      body,
      params: { id },
    } = httpRequest;
    const result = await user_use_cases.setProfileImage(id, body);
    if (result.status) {
      httpResponse.statusCode = ok;
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
 *
 * @param {Object} httpRequest
 * @returns http response
 * @error log & return response
 */
async function getAccessToken(httpRequest) {
  try {
    const result = await auth_use_cases.generateNewAccessToken(
      httpRequest.body
    );
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
 *
 * @param {Object} httpRequest
 * @returns http response
 * @error log & return response
 */
async function getPhoneVerificationCode(httpRequest) {
  try {
    const {
      params: { phone, db },
    } = httpRequest;
    const dbExistOk = parseInt(db);
    const result = await auth_use_cases.sendPhoneVerificationCode(
      phone,
      dbExistOk
    );
    if (result.status) {
      httpResponse.statusCode = ok;
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
 *
 * @param {Object} httpRequest
 * @returns http response
 * @error log & return response
 */
async function getVerifyPhone(httpRequest) {
  try {
    const {
      params: { phone, code },
    } = httpRequest;
    const result = await auth_use_cases.verifyPhoneCode(phone, code);
    if (result.status) {
      httpResponse.statusCode = ok;
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
 *
 * @param {Object} httpRequest
 * @returns http response
 * @error log & return http response
 */
async function putIdentitiesPhone(httpRequest) {
  try {
    const { body } = httpRequest;
    const result = await user_use_cases.updatePhone(body);
    if (result.status) {
      httpResponse.statusCode = ok;
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
 * make user account sleep
 * @param {Object} httpRequest
 * @returns nothing or error message with http response
 * @error
 */
async function putUserSleep(httpRequest) {
  try {
    const {
      params: { id },
      body,
    } = httpRequest;
    const result = await user_use_cases.sleepUserAccount(body);
    if (result.status) {
      httpResponse.statusCode = ok;
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
async function putSetting(httpRequest) {
  try {
    const {
      params: { id },
      body,
    } = httpRequest;
    const result = await user_use_cases.updateSetting(id, body);
    if (result.status) {
      httpResponse.statusCode = ok;
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
 * 세팅 가져오기
 * @param {Object} httpRequest
 * @returns {Promise<object>}
 */
async function getSettings(httpRequest) {
  try {
    const {
      body: {
        user: { _id },
      },
    } = httpRequest;
    const { status, body } = await user_use_cases.getSettings(_id);
    if (status) httpResponse.statusCode = ok;
    else httpResponse.statusCode = badRequest;
    httpResponse.body = body;
    return httpResponse;
  } catch (err) {
    console.log(err);
    httpResponse.statusCode = serverError;
    httpResponse.body = err.message;
    return httpResponse;
  }
}
async function postExpoToken(httpRequest) {
  try {
    const {
      params: { id },
      body: reqBody,
    } = httpRequest;
    const { status, body } = await user_use_cases.saveExpoToken(id, reqBody);
    if (status) {
      httpResponse.statusCode = created;
      httpResponse.body = body;
      return httpResponse;
    } else {
      httpResponse.statusCode = badRequest;
      httpResponse.body = body;
      return httpResponse;
    }
  } catch (err) {
    console.log(err);
    httpResponse.statusCode = serverError;
    httpResponse.body = err.message;
    return httpResponse;
  }
}
async function getReferrerCode(httpRequest) {
  try {
    const {
      params: { id },
      body: {
        user: { _id },
      },
    } = httpRequest;
    const { status, body } = await user_use_cases.getReferrerCode(_id);
    if (status) httpResponse.statusCode = ok;
    else httpResponse.statusCode = badRequest;
    httpResponse.body = body;
    return httpResponse;
  } catch (err) {
    console.log(err);
    httpResponse.statusCode = serverError;
    httpResponse.body = err.message;
    return httpResponse;
  }
}
async function getPrivacy(httpRequest) {
  try {
    const {
      body: {
        user: { _id },
      },
    } = httpRequest;
    const { status, body } = await user_use_cases.getPrivacy(_id);
    if (status) httpResponse.statusCode = ok;
    else httpResponse.statusCode = badRequest;
    httpResponse.body = body;
    return httpResponse;
  } catch (err) {
    console.log(err);
    httpResponse.statusCode = serverError;
    httpResponse.body = err.message;
    return httpResponse;
  }
}
