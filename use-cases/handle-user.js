import { cryptoHandler, passwordHandler } from "../helper/crypto.js";
import {
  blockDb,
  deletedUserDb,
  mateListDb,
  userDb,
  statisticDb,
  likeDb,
  meetDb,
} from "../db-handler/index.js";
import { User, ImgCheck } from "../models/index.js";
import { jwtHandler } from "../helper/jwt-handler.js";
import errorMessage from "../helper/error.js";
import { deleteFile } from "../helper/file-handler.js";
import { valid } from "../helper/utils.js";
import { geocoder } from "../helper/geocoding.js";

import { deleteAllConversationByUser } from "../controllers/chat-controller.js";
import { deleteAllMateListByUser } from "../controllers/mateList-controller.js";

import { payment_use_case } from "./handle-payment.js";
import { article_use_case } from "./handle-article.js";
import { block_use_case } from "./handle-block.js";
import { like_use_case } from "./handle-like.js";
import { meet_use_case } from "./handle-meet.js";

import { systemMessage_use_case } from "./handle-systemMessage.js";
import { googleCloudVision } from "../helper/google-cloud-vision.js";

export const user_use_cases = {
  registerUser,
  checkEmailExistence,
  checkNicknameExistence,
  loginEmailUser,
  loginSocialUser,
  findEmailByPhone,
  changePassword,
  getUserPhoneNumber,
  getWholeProfile,
  getBasicProfile,
  getWholeProfileAndService,
  editUserProfile,
  deleteUser,
  setProfileImage,
  updatePhone,
  sleepUserAccount,
  updateSetting,
  saveExpoToken,
  getReferrerCode,
  getSettings,
  getPrivacy,
};
const result = {
  status: false,
  body: null,
};
/**
 * register user
 * @param {Object} body http request body
 * @returns {Promise<{status: boolean, body: {id: string, accessToken: String, refreshToken: String}}>} user id with accessToken & refreshToken or error message
 * @error log & throw
 */
async function registerUser(body) {
  try {
    // Null check 유효성 검사로 한 뒤 진행
    const userModel = {
      phoneNumber: { type: "num" },
      nickname: { type: "str" },
      gender: { type: "str" },
      age: { type: "date" },
      fullAddress: { type: "str" },
      sido: { type: "str" },
      sigungu: { type: "str" },
      introduction: { type: "str" },
      main: { type: "str" },
      pictures: { type: "arr", optional: true },
      marketingOk: { type: "bool" },
      referrer: { type: "str", optional: true, null: true },
    };
    valid(body, userModel);
    if (body.email) {
      const emailModel = {
        email: { type: "str" },
        password: { type: "str" },
      };
      valid(body, emailModel);
    } else {
      const socialModel = {
        type: { type: "str" },
        id: { type: "str" },
        accessToken: { type: "str" },
        refreshToken: { type: "str", optional: true },
      };
      valid(body, socialModel);
    }
    const {
      email,
      password: plainPassword,
      type: socialType,
      id: socialId,
      accessToken: socialAToken,
      refreshToken: socialRToken,
      phoneNumber,
      main,
      fullAddress,
      sido,
      referrer,
      pictures,
      age,
      gender,
      ...rest
    } = body;
    const phoneNumberEncoded = cryptoHandler.encrypt(phoneNumber);

    const emailEncoded = email ? cryptoHandler.encrypt(email) : null;
    const hashPassword = plainPassword
      ? await passwordHandler.hashPassword(plainPassword)
      : null;
    // process some information
    const { coordinates, sido: checkSido } =
      await geocoder.getCoordinatesFromAddress(fullAddress);
    const userInfo = {
      phoneNumber: phoneNumberEncoded,
      email: emailEncoded,
      password: hashPassword,
      socialId,
      socialType,
      socialAToken,
      socialRToken,
      mainPic: main,
      pictures: [],
      fullAddress,
      sido: checkSido.includes("도") ? checkSido : sido,
      coordinates,
      referrer: referrer || null,
      age,
      gender,
      ...rest,
    };

    let safeSearchPass = true;
    if (Array.isArray(pictures) && pictures.length > 0) {
      const result = await googleCloudVision.safeSearchImage({
        pictures,
        filterLevel: 3,
      });
      safeSearchPass = result.pass;
      if (result.pass) {
        userInfo.pictures = pictures;
      } else {
        await insertImgCheck(userId, pictures, [], []);
      }
    }

    // saving the model to db
    const userId = await userDb.insertUser(User(userInfo));
    if (!userId) {
      result.status = false;
      result.body = errorMessage.dbError.userInsertError;
      return result;
    }

    await systemMessage_use_case.addSystemMessage(userId, {
      type: 0,
      content:
        "새로 가입하신 것을 환영합니다. 앞으로 많은 인연을 만나시기를 응원합니다!",
    });

    await userStatisticCount(gender, age);

    // pictures 4장 다 채운 유저 -> 무료 코인 발급
    // if(Array.isArray(pictures) && pictures.length === 4) await payment_use_case.getFreeCoinByPictureComplete(userId);

    // 차단 처리하기
    await blockDb.updateUserId(phoneNumber, userId);

    // 토큰 발급하기
    const jwtPayload = { _id: userId },
      accessToken = jwtHandler.getAccessJWT(jwtPayload),
      refreshToken = jwtHandler.getRefreshJWT(jwtPayload);

    // FIXME 유저 카운팅 넣기

    // result return 하기
    if (accessToken && refreshToken) {
      result.status = true;
      result.body = {
        id: userId,
        safeSearchPass: safeSearchPass,
        accessToken,
        refreshToken,
      };
      return result;
    }
    result.status = false;
    result.body = errorMessage.unknownError;
    return result;
  } catch (err) {
    console.log(err);
    throw err; // NOTE 여기는 user model에서 던지는 에러가 있어서... 어떻게 하면 좋을지 고민!
  }
}
/**
 * check email exists in db. false if exists
 * @param {String} email http request params
 * @returns true or false. true if not exists
 * @error log & throw
 */
async function checkEmailExistence(email) {
  try {
    if (!email) {
      result.status = false;
      result.body = errorMessage.nullError.emailMissing;
      return result;
    }
    const emailEncrypted = cryptoHandler.encrypt(email);
    const isEmailExist = await userDb.findUserByEmail(emailEncrypted);
    if (!isEmailExist) {
      result.status = true;
      result.body = "";
      return result;
    }
    result.status = false;
    result.body = errorMessage.dbError.emailExist;
    return result;
  } catch (err) {
    console.log(err);
    throw err;
  }
}
/**
 * check nickname exists in db. false if exists
 * @param {String} nickname http request params
 * @returns true or false. true if not exists
 * @error log & throw
 */
async function checkNicknameExistence(nickname) {
  try {
    if (!nickname) {
      result.status = false;
      result.body = errorMessage.nullError.nicknameMissing;
      return result;
    }
    const isNicknameExist = await userDb.findUserByNickname(nickname);
    if (!isNicknameExist) {
      result.status = true;
      result.body = "";
      return result;
    }
    result.status = false;
    result.body = errorMessage.dbError.nicknameExist;
    return result;
  } catch (err) {
    console.log(err);
    throw err;
  }
}
/**
 * login email user
 * @param {Object} body http request body
 * @returns tokens + userId or error message
 * @error log & throw
 */
async function loginEmailUser(body) {
  try {
    const { email, password: plainPassword } = body;
    if (!email) {
      result.status = false;
      result.body = errorMessage.nullError.emailMissing;
      return result;
    }
    if (!plainPassword) {
      result.status = false;
      result.body = errorMessage.nullError.passwordMissing;
      return result;
    }
    const emailEncrypted = cryptoHandler.encrypt(email),
      projection = { loginInfo: 1, status: 1 };
    const user = await userDb.findUserByEmail(emailEncrypted, projection);
    if (!user) {
      result.status = false;
      result.body = errorMessage.dbError.emailNotFound;
      return result;
    }
    const {
      loginInfo: { password },
    } = user;
    const isPasswordMatched = await passwordHandler.comparePassword(
      plainPassword,
      password
    );
    if (!isPasswordMatched) {
      result.status = false;
      result.body = errorMessage.loginError.passwordNotMatched;
      return result;
    }
    if (
      user.status.accessToken === false ||
      user.status.refreshToken === false
    ) {
      result.status = false;
      result.body = errorMessage.tokenError.unAuthorizedUser;
      return result;
    }
    if (user.status.account !== 1) {
      result.status = false;
      result.body = errorMessage.authorization.notActiveAccount;
      return result;
    }

    // 토큰 발급
    const jwtPayload = {
      _id: user._id,
    };
    const accessToken = jwtHandler.getAccessJWT(jwtPayload);
    const refreshToken = jwtHandler.getRefreshJWT(jwtPayload);
    if (accessToken && refreshToken) {
      result.status = true;
      result.body = {
        accessToken: accessToken,
        refreshToken: refreshToken,
        id: user._id,
      };
      return result;
    }
    result.status = false;
    result.body = errorMessage.unknownError;
    return result;
  } catch (err) {
    console.log(err);
    throw err;
  }
}
/**
 * generate tokens and return token.
 * @param {Object} object id, socialType, socialId
 * @param {String} id user's id
 * @param {String} socialType social type ex) google
 * @param {String} socialId social's id
 * @returns tokens. access & refresh + userId, + userStatus: true
 * @error log & throw
 */
async function loginSocialUser({ id, socialType, socialId }) {
  try {
    const projection = { status: 1 },
      user = await userDb.findUserById(id, projection);

    if (
      user.status.accessToken === false ||
      user.status.refreshToken === false
    ) {
      result.status = false;
      result.body = errorMessage.tokenError.unAuthorizedUser;
      return result;
    }
    if (user.status.account !== 1) {
      result.status = false;
      result.body = errorMessage.authorization.notActiveAccount;
      return result;
    }

    // 토큰 발급
    const jwtPayload = {
      _id: id,
    };
    const accessToken = jwtHandler.getAccessJWT(jwtPayload);
    const refreshToken = jwtHandler.getRefreshJWT(jwtPayload);
    const tokens = {
      accessToken: accessToken,
      refreshToken: refreshToken,
      id: id,
      userStatus: true,
    };
    result.status = true;
    result.body = tokens;
    return result;
  } catch (err) {
    console.log(err);
    throw err;
  }
}
/**
 * get phone number and find user in db, return email if exist or error message
 * @param {String} phone http request params
 * @returns email or error message
 * @error log & throw
 */
async function findEmailByPhone(phone) {
  try {
    if (!phone) {
      result.status = false;
      result.body = errorMessage.nullError.phoneNumberMissing;
      return result;
    }
    if (phone.length < 1) {
      result.status = false;
      result.body = errorMessage.nullError.phoneNumberMissing;
      return result;
    }
    const phoneEncoded = cryptoHandler.encrypt(phone);
    const user = await userDb.findUserByPhoneNumber(phoneEncoded);
    if (!user) {
      result.status = false;
      result.body = errorMessage.dbError.userNotFound;
      return result;
    }
    const {
      loginInfo: { email },
    } = user;
    const emailDecrypted = cryptoHandler.decrypt(email);
    if (user) {
      result.status = true;
      result.body = { email: emailDecrypted };
      return result;
    }
    result.status = false;
    result.body = errorMessage.dbError.userNotFound;
    return result;
  } catch (err) {
    console.log(err);
    throw err;
  }
}
/**
 * change password by phone number
 * @param {Object} body http request body
 * @returns nothing or error message
 * @error log & throw
 */
async function changePassword(body) {
  try {
    const { phoneNumber, password: plainPassword } = body;
    if (!phoneNumber) {
      result.status = false;
      result.body = errorMessage.nullError.phoneNumberMissing;
      return result;
    }
    if (!plainPassword) {
      result.status = false;
      result.body = errorMessage.nullError.passwordMissing;
      return result;
    }
    const encodedPhone = cryptoHandler.encrypt(phoneNumber);
    const user = await userDb.findUserByPhoneNumber(encodedPhone);
    if (!user) {
      result.status = false;
      result.body = errorMessage.dbError.userNotFound;
      return result;
    }
    const hashPassword = await passwordHandler.hashPassword(plainPassword);
    await userDb.updatePassword(user._id, hashPassword);
    result.status = true;
    result.body = null;
    return result;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

/**
 * get phone number
 * @param {Object} body http request body
 * @returns nothing or error message
 * @error log & throw
 */
async function getUserPhoneNumber(userId) {
  try {
    if (!userId) {
      result.status = false;
      result.body = errorMessage.nullError.idMissing;
      return result;
    }
    const user = await userDb.getUserPhoneNumber(userId);
    if (!user) {
      result.status = false;
      result.body = errorMessage.dbError.userNotFound;
      return result;
    }
    const phoneNumber = cryptoHandler.decrypt(user);

    result.status = true;
    result.body = phoneNumber;
    return result;
  } catch (err) {
    console.log(err);
    throw err;
  }
}
/**
 * get user id and return whole profile
 * @param {String} userId
 * @returns {Promise<{user: object}>}
 */
async function getWholeProfile(userId, myId) {
  try {
    if (!userId) {
      result.status = false;
      result.body = errorMessage.nullError.idMissing;
      return result;
    }
    const user = await userDb.getWholeProfile(userId);
    if (!user) {
      result.status = false;
      result.body = errorMessage.dbError.userNotFound;
      return result;
    }
    if (userId !== myId) {
      delete user.basicProfile.fullAddress;
      delete user.basicProfile.address.coordinates;
    }
    // NOTE 내가 올린 사진 개수 만큼 detailProfile.pictures 돌려주기
    const {
      detailProfile: { pictures: myPics },
    } = await userDb.getWholeProfile(myId);
    const {
      detailProfile: { pictures },
    } = user;
    user.detailProfile.pictures.length = myPics.length;
    user.detailProfile.picturesLength = pictures.length;

    if (userId === myId) {
      const checkList = await userDb.getMyImgCheck(myId);
      if (checkList) {
        user.editPics = checkList.pictures;
      }
    }

    result.status = true;
    result.body = user;
    return result;
  } catch (err) {
    console.log(err);
    throw err;
  }
}
/**
 * get user id and return basic profile
 * @param {String} userId userid
 * @returns {Promise<{status: boolean, body: {user: object}}>}
 */
async function getBasicProfile(userId, myId, serviceList) {
  try {
    if (!userId) {
      result.status = false;
      result.body = errorMessage.nullError.idMissing;
      return result;
    }
    const user = await userDb.getBasicProfile(userId, myId, serviceList);
    const like = await likeDb.findAnyLike({ from: myId, to: userId });

    if (like) user.like = true;
    else user.like = false;

    if (!user) {
      result.status = false;
      result.body = errorMessage.dbError.userNotFound;
      return result;
    }
    delete user.basicProfile.address.coordinates;
    delete user.basicProfile.fullAddress;
    // 매칭 상태
    const hasMatched = await mateListDb.findMatching(userId, myId);
    result.status = true;
    result.body = { ...user, hasMatched: hasMatched ? true : false };
    console.log(result.body);
    return result;
  } catch (err) {
    console.log(err);
    throw err;
  }
}
/**
 * get user id and return whole profile
 * @param {String} userId
 * @returns {Promise<{user: object}>}
 */
async function getWholeProfileAndService(userId, myId, serviceList) {
  try {
    if (!userId) {
      result.status = false;
      result.body = errorMessage.nullError.idMissing;
      return result;
    }
    const user = await userDb.getWholeProfileAndService(
      userId,
      myId,
      serviceList
    );
    if (!user) {
      result.status = false;
      result.body = errorMessage.dbError.userNotFound;
      return result;
    }

    if (userId !== myId) {
      delete user.basicProfile.fullAddress;
      delete user.basicProfile.address.coordinates;
    }
    // NOTE 내가 올린 사진 개수 만큼 detailProfile.pictures 돌려주기
    const {
      detailProfile: { pictures: myPics },
    } = await userDb.getWholeProfile(myId);
    user.detailProfile.picturesLength = myPics.length;
    // user.detailProfile.pictures.length = myPics.length;
    // user.detailProfile.picturesLength = pictures.length

    result.status = true;
    result.body = user;
    return result;
  } catch (err) {
    console.log(err);
    throw err;
  }
}
/**
 * update user's profile
 * @param {String} id user id
 * @returns updated profile or error message
 * @error log & throw
 */
async function editUserProfile(
  id,
  { basicProfile, detailProfile, deletedFiles = [], isCompleted, pictures }
) {
  try {
    let safeSearchPass = true;
    if (!id) {
      result.status = false;
      result.body = errorMessage.nullError.idMissing;
      return result;
    }
    const hasUser = await userDb.findUserById(id);
    if (!hasUser) {
      result.status = false;
      result.body = errorMessage.dbError.userNotFound;
      return result;
    }
    const {
      address: { fullAddress: newAddr, sido, ...rest },
    } = basicProfile;
    const { fullAddress: oldAddr, updatedAt } = await userDb.getUserAddress(id);
    if (oldAddr !== newAddr) {
      const months_ago_3 = new Date(
        new Date().setMonth(new Date().getMonth() - 3)
      );
      if (updatedAt > months_ago_3) {
        result.status = false;
        result.body = errorMessage.dbError.addressChangedTooSoon;
        return result;
      }

      const { coordinates, sido: sidoCheck } =
        await geocoder.getCoordinatesFromAddress(newAddr);
      basicProfile.address = {
        ...rest,
        fullAddress: newAddr,
        coordinates,
        sido: sidoCheck.includes("도") ? sidoCheck : sido,
        updatedAt: new Date(),
      };
    }

    // 기존 사진과 변경 사진이 다를 경우
    // 삭제만 있고 추가가 없으면 변경사진을 기존에 덮어씌우고,
    // 추가가 있을 경우에는 심사를 하도록 한다.
    if (pictures) {
      if (JSON.stringify(detailProfile.pictures) != JSON.stringify(pictures)) {
        const myCheck = await userDb.getMyImgCheck(id);
        if (!myCheck) {
          const deletePic = detailProfile.pictures.filter(
            (x) => !pictures.includes(x)
          );
          const insertPic = pictures.filter(
            (x) => !detailProfile.pictures.includes(x)
          );

          if (deletePic.length > 0 && insertPic.length < 1) {
            detailProfile.pictures = pictures;
          } else {
            const result = await googleCloudVision.safeSearchImage({
              pictures,
              filterLevel: 3,
            });
            safeSearchPass = result.pass;
            if (result.pass) {
              detailProfile.pictures = pictures;
            } else {
              await insertImgCheck(id, pictures, insertPic, deletePic);
            }
          }
        }
      }
    }

    // NOTE delete files
    if (deletedFiles.length > 0) deletedFiles.forEach((f) => deleteFile(f));
    const updated = await userDb.updateProfile(id, basicProfile, detailProfile);

    // 무료 코인 획득
    if (isCompleted) await payment_use_case.getFreeCoinByProfileComplete(id);
    //if(detailProfile.pictures.length === 4) await payment_use_case.getFreeCoinByPictureComplete(id);

    result.status = true;
    result.body = {
      basicProfile: updated.basicProfile,
      detailProfile: updated.detailProfile,
      safeSearchPass: safeSearchPass,
    };
    return result;
  } catch (err) {
    console.log(err);
    throw err;
  }
}
/**
 * 탈퇴하기
 * 1. 모든 db에서 지우기
 * 2. 해당 유저의 핸드폰 번호 -> 탈퇴 유저 collection 으로 탈퇴 날짜와 함께 옮김
 * 3.
 * @param {String} id http request params
 * @returns nothing or error message
 * @error log & throw
 */
async function deleteUser(id) {
  try {
    // 유효성 체크
    if (!id) {
      result.status = false;
      result.body = errorMessage.nullError.idMissing;
      return result;
    }
    const hasUser = await userDb.findUserById(id);
    if (!hasUser) {
      result.status = false;
      result.body = errorMessage.dbError.userNotFound;
      return result;
    }
    // 모든 db에서 지우기
    await Promise.all([
      // 게시글 db
      article_use_case.deleteAllArticlesByUser(id),
      article_use_case.deleteAllCommentsByUser(id),
      article_use_case.deleteAllLikeByUser(id),
      // 차단 db
      block_use_case.deleteAllBlockByUser(id),
      // 채팅 db
      deleteAllConversationByUser(id),
      // 친구해요 db
      like_use_case.deleteAllLikebyUser(id),
      // 메이트리스트 db
      deleteAllMateListByUser(id),
      // 크로스 db
      meet_use_case.deleteAllMeetDataByUser(id),
      // 이미지 검사 지우기
      userDb.deleteUsersCheckImg(id),
    ]);

    // user db에서 지우기
    const { value: deletedUser } = await userDb.deleteUser(id);

    // user s3지우기
    const {
      basicProfile: { profilePic },
      detailProfile: { mainPic, pictures },
    } = deletedUser;
    let files = [profilePic, mainPic, ...pictures].flat();
    files = files.filter((el) => el != null && el != "picture");
    if (files.length > 0) files.forEach((f) => deleteFile(f));

    // 탈퇴 유저 db에 저장하기
    await deletedUserDb.insertDeletedUser({
      _id: deletedUser._id,
      phoneNumber: deletedUser.phoneNumber,
    });

    let date = new Date().toISOString();
    let year = date.substring(0, 4);
    let month = date.substring(0, 7);
    let day = date.substring(0, 10);
    let today = await statisticDb.findToday(day, 2);
    if (today != null) await statisticDb.updateUserCount(day, 2);
    else await statisticDb.insertUserCount(year, month, day, 2);

    result.status = true;
    result.body = "";
    return result;
  } catch (err) {
    console.log(err);
    throw err;
  }
}
/**
 * get profile image and set
 * @param {String} id user id
 * @param {Object} body {profileImage}
 * @returns updated profileImage
 * @error log & throw
 */
async function setProfileImage(id, body) {
  try {
    if (!id) {
      result.status = false;
      result.body = errorMessage.nullError.idMissing;
      return result;
    }
    const { profileImage, mainprofile } = body;
    if (!profileImage) {
      result.status = false;
      result.body = errorMessage.nullError.profileImageMissing;
      return result;
    }
    const user = await userDb.findUserById(id);
    if (!user) {
      result.status = false;
      result.body = errorMessage.dbError.userNotFound;
      return result;
    }
    const {
      basicProfile: { profilePic },
    } = await userDb.updateProfilePic(id, profileImage, mainprofile);
    result.status = true;
    result.body = { profileImage: profilePic };
    return result;
  } catch (err) {
    console.log(err);
    throw err;
  }
}
/**
 * get user's id and new phone number, update phone number
 * @param {Object} body http request body
 * @returns updated phoneNumber or error message
 * @error log & throw
 */
async function updatePhone(body) {
  try {
    const {
      user: { _id: id },
      phoneNumber,
    } = body;
    if (!id) {
      result.status = false;
      result.body = errorMessage.nullError.idMissing;
      return result;
    }
    if (!phoneNumber) {
      result.status = false;
      result.body = errorMessage.nullError.phoneNumberMissing;
      return result;
    }
    const phoneEncrypted = cryptoHandler.encrypt(phoneNumber);
    // check if new phone number exists in db
    const isPhoneExist = await userDb.findUserByPhoneNumber(phoneEncrypted);
    if (isPhoneExist) {
      result.status = false;
      result.body = errorMessage.dbError.phoneExist;
      return result;
    }
    // 새 번호가 탈퇴 유저 db 에 있는지 확인
    const hasPhoneinDeletedUser = await deletedUserDb.findUserByPhoneNumber(
      phoneEncrypted
    );
    if (hasPhoneinDeletedUser) {
      result.status = false;
      result.body = errorMessage.dbError.phoneExist;
      return result;
    }
    await userDb.updatePhone(id, phoneEncrypted);
    result.status = true;
    result.body = { phoneNumber };
    return result;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

/**
 * make user account sleep
 * @param {String} id http request params
 * @returns nothing or error message
 * @error log & throw
 */
async function sleepUserAccount(body) {
  try {
    const {
      user: { _id: id },
    } = body;
    if (!id) {
      result.status = false;
      result.body = errorMessage.nullError.idMissing;
      return result;
    }
    const user = await userDb.findUserById(id);
    if (!user) {
      result.status = false;
      result.body = errorMessage.dbError.userNotFound;
      return result;
    }
    await userDb.sleepUserAccount(id);
    result.status = true;
    result.body = "";
    return result;
  } catch (err) {
    console.log(err.message);
    throw err;
  }
}
/**
 * update setting
 * @param {String} id
 * @param {object} body {user: {_id}, meetSetting: {}}
 * @returns {Promise<{status: boolean, body: string}>}
 * @error log & throw
 */
async function updateSetting(id, body) {
  try {
    const {
      user: { _id },
      meetSetting,
    } = body;
    delete body.user;
    const hasUser = await userDb.findUserById(_id);
    if (!hasUser) {
      result.status = false;
      result.body = errorMessage.dbError.userNotFound;
      return result;
    }
    if (!meetSetting) {
      result.status = false;
      result.body = errorMessage.nullError.contentMissing;
      return result;
    }
    await userDb.updateMeetSetting(_id, meetSetting);
    result.status = true;
    result.body = "";
    return result;
  } catch (err) {
    console.log(err);
    throw err;
  }
}
/**
 * 세팅 가져오기
 * @param {String} userId
 * @returns {Promise<{status: boolean, body: {settings: object}}>}
 */
async function getSettings(userId) {
  try {
    if (!userId) {
      result.status = false;
      result.body = errorMessage.nullError.idMissing;
      return result;
    }
    const hasUser = await userDb.findUserById(userId);
    if (!hasUser) {
      result.status = false;
      result.body = errorMessage.dbError.userNotFound;
      return result;
    }
    const settings = await userDb.getSettings(userId);
    result.status = true;
    result.body = { settings };
    return result;
  } catch (err) {
    console.log(err);
    throw err;
  }
}
/**
 * get token and update expo token
 * @param {String} userId
 * @param {object} body {token}
 * @returns
 */
async function saveExpoToken(userId, { token }) {
  try {
    if (!userId) {
      result.status = false;
      result.body = errorMessage.nullError.idMissing;
      return result;
    }
    if (!token) {
      result.status = false;
      result.body = errorMessage.tokenError.noToken;
      return result;
    }
    const hasUser = await userDb.findUserById(userId);
    if (!hasUser) {
      result.status = false;
      result.body = errorMessage.dbError.userNotFound;
      return result;
    }
    await userDb.updateExpoToken(userId, token);
    result.status = true;
    result.body = null;
    return result;
  } catch (err) {
    console.log(err);
    throw err;
  }
}
/**
 * 추천인 코드 얻기
 * @param {String} userId
 * @returns {Promise<{status: boolean, body: {referrerCode: String}}>}
 */
async function getReferrerCode(userId) {
  try {
    const user = await userDb.getReferrerCode(userId);
    if (!user) {
      result.status = false;
      result.body = errorMessage.dbError.userNotFound;
      return result;
    }
    result.status = true;
    result.body = { referrerCode: user.referrerCode };
    return result;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

async function getPrivacy(userId) {
  try {
    const user = await userDb.getPrivacy(userId);
    if (!user) {
      result.status = false;
      result.body = errorMessage.dbError.radiosNotFound;
      return result;
    }
    const privacyRadios = await meetDb.getRadios("privacyRadios");
    if (!privacyRadios) {
      result.status = false;
      result.body = errorMessage.dbError.nullError;
      return result;
    }
    result.status = true;
    result.body = { privacy: user, radios: privacyRadios };
    return result;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

async function insertImgCheck(userId, pictures, insertPic, deletePic) {
  const imgCheck = {
    userId,
    pictures,
    insertPic,
    deletePic,
  };
  // saving the model to db
  return await userDb.insertImgCheck(ImgCheck(imgCheck));
}

async function userStatisticCount(gender, age) {
  const date = new Date().toISOString();
  const year = date.substring(0, 4);
  const month = date.substring(0, 7);
  const day = date.substring(0, 10);

  let today = await statisticDb.findToday(day, 0);
  if (today != null) await statisticDb.updateUserCount(day, 0);
  else await statisticDb.insertUserCount(year, month, day, 0);

  // man, woman
  let todayGender = await statisticDb.findToday(day, 3);
  if (todayGender != null)
    await statisticDb.updateUserCountByGender(day, 3, gender);
  else await statisticDb.insertUserCountByGender(year, month, day, 3, gender);

  // age
  let ag = age.split("-")[0];
  let todayAge = await statisticDb.findToday(day, 4);
  if (todayAge != null) {
    let todayYear = await statisticDb.findTodayAge(day, 4, ag);
    if (todayYear != null) await statisticDb.updateUserCountByAge(day, 4, ag);
    else {
      await statisticDb.updateUserCountByAgeNull(day, 4, {
        ...todayAge.count,
        [ag]: 1,
      });
    }
  } else await statisticDb.insertUserCountByAge(year, month, day, 4, ag);
}
