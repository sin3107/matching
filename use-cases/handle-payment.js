import errMsg from "../helper/error.js";
import {
  articleDb,
  paymentDb,
  userDb,
  statisticDb,
} from "../db-handler/index.js";
import { BillLog, CoinLog, ItemLog } from "../models/index.js";
import { valid } from "../helper/utils.js";
import { generateId } from "../helper/id-generator.js";
import { appleIAP } from "../helper/appleIAP.js";

export const payment_use_case = {
  getCoins,
  getCoinUsage,
  addCoins,
  addPackage,
  getCurrentPass,
  getBillLog,
  buyLikeMessge,
  buyChatItem,
  buyItem,
  checkItemLog,
  checkItemLogWithin25hors,
  buyTimeItem,
  getFreeCoinByReferrer,
  getFreeCoinByMessage,
  getFreeCoinByProfileComplete,
  getFreeCoinByPictureComplete,
  getFreeCoinByArticleLike,
  getFreeCoinByBday,
  addAccess,
};
const result = {
  status: false,
  body: "",
};
/**
 * 내 현재 보유 코인 가져오기
 * @param {String} userId
 * @returns {Promise<{status: boolean, body: {coin: Number}}>}
 */
async function getCoins(userId) {
  try {
    if (!userId) {
      result.status = false;
      result.body = errMsg.nullError.idMissing;
      return result;
    }

    const coins = await userDb.getCoins(userId);
    // coin이 0이면 if문에 걸리기 때문에 정확히 undefined 타입일때만 유저 찾지 못함으로
    if (typeof coins === "undefined") {
      result.status = false;
      result.body = errMsg.dbError.userNotFound;
      return result;
    }
    result.status = true;
    result.body = { coins };
    return result;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

/**
 * 내 코인 이용 내역 보기
 * @param {String} userId
 * @param {Date} timestamp
 * @returns {Promise<{status: boolean, body: { coinUsageLog: Array}}>}
 */
async function getCoinUsage(userId, timestamp) {
  try {
    if (!userId) {
      result.status = false;
      result.body = errMsg.nullError.idMissing;
      return result;
    }
    const hasUser = await userDb.findUserById(userId);
    if (!hasUser) {
      result.status = false;
      result.body = errMsg.dbError.userNotFound;
      return result;
    }
    const ts = timestamp ? new Date(timestamp) : new Date();
    const log = await paymentDb.getCoinUsageLog(userId, ts);
    result.status = true;
    result.body = { log };
    return result;
  } catch (err) {
    console.log(err);
    throw err;
  }
}
/**
 * TODO 코인 충전하기 - 아직 덜 함
 * @param {String} userId
 * @param {object} body
 * @returns {Promise<{status: boolean, body: {coins: Number}}>}
 */
async function addCoins(userId, body) {
  try {
    /**
     * 1. billLog 생성 (error: true)
     * 2. 구글/애플에 결제 요청a
     * 3. 구글/애플이 돌려준 정보 확인
     * 4. billLog 수정 (error: false, paymentInfo 추가)
     * 5. coinLog 생성 (코인 추가하기),
     * 6. userDb의 최근 코인 수정하기
     * 7. 완료
     */

    const model = {
      userId: { type: "str" },
      productId: { type: "str" },
      receiptData: { type: "str" },
    };
    // NOTE billAmount를 클라이언트에서 받지 않고 admin db에 검색해서 해야 할 것 같긴 하다
    const { productId } = valid({ userId, ...body }, model);
    const hasUser = await userDb.findUserById(userId);
    if (!hasUser) {
      result.status = false;
      result.body = errMsg.dbError.userNotFound;
      return result;
    }
    // 상품 찾기
    const product = await paymentDb.getCoinProduct(productId); // 1 event 값 가져와서 event가 1이면 빌로그에서
    if (!product) {
      result.status = false;
      result.body = errMsg.payment.productNotFound;
      return result;
    }
    // 이벤트 코인의 경우 확인절차 1회
    if (product.event) {
      const coinLog = await paymentDb.getBillLog({
        userId,
        productId: product._id,
      });
      if (coinLog) {
        if (coinLog.paymentInfo.something != "good") {
          result.status = false;
          result.body = errMsg.payment.duplicatedProduct;
          return result;
        }
      }
    }

    // 1. billLog 생성 (error: true)
    const { coin, bonus, price } = product;
    // procutType: 0 === coin
    const billLog = BillLog({ userId, price, productId, productType: 0 });
    const billId = await paymentDb.insertBillLog(billLog);

    // 임시 구매 인앱 process 장착해야함
    // 2. 구매 영수증 확인 절차

    // 실 결제시 반환 데이터 확인하여 수정
    let applePayment = await appleIAP.getAppleReceiptValidation(
      body.receiptData
    );

    // 3. 실패 시 billLog 수정 (삭제나 실패로)
    // 뭔가 잘 안 됨
    if (applePayment.data.status !== 0) {
      const paymentInfo = {
        something: "bad",
      };
      const failBillLog = await paymentDb.updateFailBill(billId, paymentInfo);

      result.status = false;
      result.body = { failBillLog };
      return result;
    }
    // else if(body.cancel) {
    //     await paymentDb.cancelBill(billId);

    //     result.status = false;
    //     result.body = { cancel: true }
    //     return result;
    // }
    // 성공함
    const paymentInfo = {
      something: "good",
    };
    // 4. 성공 시 billLog 성공으로 수정
    // bill log update
    await paymentDb.updateSuccessBill(billId, paymentInfo);

    // 5. coinLog 생성
    // coin log added
    const coinTypes = await paymentDb.getCoinLogType();
    const { _id: type } = coinTypes.find((x) => (x.typeName = "충전"));
    const coinAmount = coin + bonus;
    await paymentDb.insertCoinLog(
      CoinLog({ userId, coinAmount, type, detail: billId })
    );

    // 6. user coin 추가
    // user db update
    const coins = await userDb.updateCoins(userId, coinAmount);

    result.status = true;
    result.body = { coins };
    return result;
  } catch (err) {
    console.log(err);
    throw err;
  }
}
/**
 * 패키지 사기
 * @param {String} userId
 * @param {object} body
 * @returns {Promise<{status: boolean, body: {pass: Array}}>}
 */
async function addPackage(userId, body) {
  try {
    /**
     * 1. billLog 생성 (error: true)
     * 2. 구글/애플에 결제 요청 (front)
     * 3. 구글/애플이 돌려준 정보 확인 (front => back 영수증 번호)
     * 4. billLog 수정 (error: false, paymentInfo 추가)
     * 6. userDb의 package 수정
     * 7. 완료
     * { service: '', endAt: new Date() }
     */
    const model = {
      userId: { type: "str" },
      productId: { type: "str" },
      itemId: { type: "str" },
      receiptData: { type: "str" },
    };
    // NOTE billAmount를 클라이언트에서 받지 않고 admin db에 검색해서 해야 할 것 같긴 하다
    const { productId, itemId } = valid({ userId, ...body }, model);
    const hasUser = await userDb.findUserById(userId);
    if (!hasUser) {
      result.status = false;
      result.body = errMsg.dbError.userNotFound;
      return result;
    }

    // 상품 찾기
    const product = await paymentDb.getPackageProduct(productId);
    if (!product) {
      result.status = false;
      result.body = errMsg.payment.productNotFound;
      return result;
    }
    // bill log 생성
    const { options, items } = product;
    const { date, price: oPrice, discount } = items[itemId];
    const price = oPrice * (1 - discount / 100);
    // procutType: 1 === package
    const billLog = BillLog({
      userId,
      price,
      productId,
      productDetail: itemId,
      productType: 1,
    });
    const billId = await paymentDb.insertBillLog(billLog);

    // 임시 구매 인앱 process 장착해야함
    // 2. 구매 영수증 확인 절차

    // 실 결제시 반환 데이터 확인하여 수정
    let applePayment = await appleIAP.getAppleReceiptValidation(
      body.receiptData
    );

    // 뭔가 잘 안 됨
    if (applePayment.data.status !== 0) {
      const paymentInfo = {
        something: "bad",
      };
      const failBillLog = await paymentDb.updateFailBill(billId, paymentInfo);

      result.status = false;
      result.body = { failBillLog };
      return result;
    }
    // else if(body.cancel) {
    //     await paymentDb.cancelBill(billId);

    //     result.status = false;
    //     result.body = { cancel: true }
    //     return result;
    // }
    // 성공함
    const paymentInfo = {
      something: "good",
    };
    // bill log update
    await paymentDb.updateSuccessBill(billId, paymentInfo);

    // user db update
    const oldPass = await userDb.getPass(userId);
    const now = new Date();
    // 업데이트 하지 않아도 되는 service 모음
    const remainPass = oldPass.filter(({ service }) => {
      if (!options.includes(service)) return true;
    });
    // 업데이트 해야 하는 service 업데이트 하기
    const addedPass = options.map((service) => {
      const hasService = oldPass.find((x) => x.service === service);
      if (hasService) {
        const { endAt } = hasService;
        return {
          service,
          endAt: new Date(endAt.setDate(endAt.getDate() + date)),
        };
      } else {
        return {
          service: service,
          endAt: new Date(new Date(now).setDate(now.getDate() + date)),
        };
      }
    });
    const newPass = remainPass.concat(addedPass);
    const updatedPass = await userDb.updatePass(userId, newPass);
    result.status = true;
    result.body = { pass: updatedPass };
    return result;
  } catch (err) {
    console.log(err);
    throw err;
  }
}
/**
 * 현재 패스 보기
 * @param {String} userId
 * @returns {Promise<{status: boolean, body: {pass: Array}}>}
 */
async function getCurrentPass(userId) {
  try {
    if (!userId) {
      result.status = false;
      result.body = errMsg.nullError.idMissing;
      return result;
    }
    const pass = await userDb.getPass(userId);
    if (typeof pass === "undefined") {
      result.status = false;
      result.body = errMsg.dbError.userNotFound;
      return result;
    }
    result.status = true;
    result.body = { pass };
    return result;
  } catch (err) {
    console.log(err);
    throw err;
  }
}
/**
 * 현금 결제 내역 타입에 따라 나눠 받기
 * @param {String} userId
 * @param {Date} timestamp
 * @returns {Promise<{status: boolean, body: {log: Array}}>}
 */
async function getBillLog(userId, type, timestamp) {
  try {
    const model = {
      userId: { type: "str" },
      type: { type: "num" },
    };
    const dateModel = { timestamp: { type: "date" } };
    valid({ userId, type }, model);
    if (timestamp) valid({ timestamp }, dateModel);
    const hasUser = await userDb.findUserById(userId);
    if (!hasUser) {
      result.status = false;
      result.body = errMsg.dbError.userNotFound;
      return result;
    }

    const ts = timestamp ? new Date(timestamp) : new Date();
    const log =
      Number(type) === 0
        ? await paymentDb.getCoinBillLog(userId, ts)
        : await paymentDb.getPackageBillLog(userId, ts);
    result.status = true;
    result.body = { log };
    return result;
  } catch (err) {
    console.log(err);
    throw err;
  }
}
/**
 * 해당 아이템 구매 내역이 존재하는지
 * @param {String} userId
 * @param {String} otherUserId
 * @param {String} service
 * @returns {Promise<{status: boolean}>}
 */
async function checkItemLog(userId, otherUserId, service) {
  try {
    // 해당 아이템 가격 및 아이디 (서비스)
    const { _id: serviceId } = await paymentDb.getServiceCost({ service });

    // 구매 내역 확인
    const itemLog = await paymentDb.getItemLog(userId, otherUserId, serviceId);
    result.status = itemLog ? true : false;

    return result;
  } catch (err) {
    console.log(err);
    throw err;
  }
}
/**
 * 해당 아이템 구매 내역이 25시간 안에 있는지
 * @param {String} userId
 * @param {String} otherUserId
 * @param {String} service
 * @returns {Promise<{status: boolean}>}
 */
async function checkItemLogWithin25hors(userId, otherUserId, service) {
  try {
    // 해당 아이템 가격 및 아이디 (서비스)
    const { _id: serviceId } = await paymentDb.getServiceCost({ service });

    // 구매 내역 확인
    const itemLog = await paymentDb.getItemLogWithinTime(
      userId,
      otherUserId,
      serviceId
    );
    result.status = itemLog ? true : false;

    return result;
  } catch (err) {
    console.log(err);
    throw err;
  }
}
/**
 * 시간제 아이템 사기
 * @param {String} userId
 * @param {String} otherUserId
 * @param {Stirng} service
 * @returns {Promise<{status: boolean, body: object}>}
 */
async function buyTimeItem(userId, otherUserId, service) {
  try {
    // 해당 아이템 가격 및 아이디 (서비스)
    const { coin: coinPrice, _id: serviceId } = await paymentDb.getServiceCost({
      service,
    });

    // 구매 내역 확인
    const itemLogCheck = await paymentDb.getItemLogWithinTime(
      userId,
      otherUserId,
      serviceId
    );

    if (itemLogCheck !== null) {
      result.status = true;
      return result;
    }

    // 패키지 확인
    const passAvailabilty = await isPassAvailable(userId, service); // serviceId => serviceName
    // 패키지 구매 성공
    if (passAvailabilty)
      return buyItemByPackage(userId, otherUserId, serviceId);

    // 보유 코인 확인
    const currentCoin = await userDb.updateCoins(userId, -coinPrice);
    // 코인 구매 성공
    if (currentCoin >= 0)
      return buyItemByCoin(userId, otherUserId, serviceId, coinPrice);
    // 코인 구매 실패
    else return failBuyItemByCoin(userId, coinPrice);
  } catch (err) {
    console.log(err);
    throw err;
  }
}
/**
 * 아이템 구매하기
 * 1. 해당 아이템 구매 내역 확인
 * 2. 유저 db에서 해당 패키지 있나 확인 -> 있으면 다음으로 넘어가기
 * 3. 패키지 없으면 유저 DB에서 코인 확인 -> 넉넉하면 - 하고 다음으로 넘어가기
 * 4. 넉넉하지 않으면 넉넉하지 않다는 status return
 * @param {String} userId
 * @param {String} otherUserId
 * @param {String} service profile, ...
 * @returns {Promise<{status: boolean, body: string}>}
 */
async function buyItem(userId, otherUserId, service) {
  try {
    // 해당 아이템 가격 및 아이디 (서비스)
    const { coin: coinPrice, _id: serviceId } = await paymentDb.getServiceCost({
      service,
    });

    // 구매 내역 확인
    const itemLogCheck = await paymentDb.getItemLog(
      userId,
      otherUserId,
      serviceId
    );

    if (itemLogCheck !== null) {
      result.status = true;
      return result;
    }

    // 패키지 확인
    const passAvailabilty = await isPassAvailable(userId, service); // serviceId => serviceName
    // 패키지 구매 성공
    if (passAvailabilty)
      return buyItemByPackage(userId, otherUserId, serviceId);

    // 보유 코인 확인
    const currentCoin = await userDb.updateCoins(userId, -coinPrice);
    // 코인 구매 성공
    if (currentCoin >= 0)
      return buyItemByCoin(userId, otherUserId, serviceId, coinPrice);
    // 코인 구매 실패
    else return failBuyItemByCoin(userId, coinPrice);
  } catch (err) {
    console.log(err);
    throw err;
  }
}
/**
 * 채팅 아이템 사기
 * 1. 로그 확인 - 둘 중 하나라도 샀다면 통과
 * 2. 패키지 확인
 * 3. 해당 아이템 가격 확인
 * 4. 보유 코인 확인
 * 5. 아이템 로그와 코인 로그 작성
 * 6. 가능 불가능 return
 * @param {String} userId
 * @param {String} otherUserId
 * @returns {Promise<{status: boolean, body: string}>}
 */
async function buyChatItem(userId, otherUserId) {
  try {
    // 해당 아이템 가격 및 아이디(서비스)
    const service = "chat";
    const { coin: coinPrice, _id: serviceId } = await paymentDb.getServiceCost({
      service,
    });

    // 구매 내역 확인
    const chatItemLog1 = await paymentDb.getItemLog(
      userId,
      otherUserId,
      serviceId
    );
    const chatItemLog2 = await paymentDb.getItemLog(
      otherUserId,
      userId,
      serviceId
    );
    if (chatItemLog1 || chatItemLog2) {
      result.status = true;
      return result;
    }

    // 패키지 확인
    const passAvailability = await isPassAvailable(userId, service);
    if (passAvailability)
      return await buyItemByPackage(userId, otherUserId, serviceId);

    // 보유 코인 확인
    const currentCoin = await userDb.updateCoins(userId, -coinPrice);
    // 코인 구매 성공
    if (currentCoin >= 0)
      return buyItemByCoin(userId, otherUserId, serviceId, coinPrice);
    // 구매 실패
    else return failBuyItemByCoin(userId, coinPrice);
  } catch (err) {
    console.log(err);
    throw err;
  }
}
/**
 * 친구해요 메시지 사기 (친구해요는 같은 사람에게서 여러번 살 수 있기 때문에 따로 분리)
 * 1. 패키지 확인
 * 2. 해당 아이템 가격 확인
 * 3. 유저 db에서 코인 확인
 * 4. 아이템 로그 와 코인 로그 작성
 * 5. 가능 불가능 return
 * @param {object} {likeFrom, likeTo}
 * @returns {Promise<{status: boolean, body: string}>}
 */
async function buyLikeMessge({ likeFrom, likeTo }) {
  try {
    const service = "message";
    // check package
    const passAvailability = await isPassAvailable(likeFrom, service);

    // check price
    const { coin: coinPrice, _id: serviceId } = await paymentDb.getServiceCost({
      service,
    });

    //  패키지로 구매 성공
    if (passAvailability) return buyItemByPackage(likeFrom, likeTo, serviceId);

    // check coin
    const coin = await userDb.updateCoins(likeFrom, -coinPrice);

    // 코인으로 구매 성공
    if (coin >= 0) return buyItemByCoin(likeFrom, likeTo, serviceId, coinPrice);
    // 구매 실패
    else return failBuyItemByCoin(likeFrom, coinPrice);
  } catch (err) {
    console.log(err);
    throw err;
  }
}
/**
 * 해당 서비스의 패키지(패스)가 사용 가능한 상태인지 확인
 * @param {String} userId
 * @param {String} service
 * @returns {Promise<boolean>}
 */
async function isPassAvailable(userId, service) {
  try {
    const currentPass = await userDb.getPass(userId);
    const pass = currentPass.find((x) => x.service === service);
    if (typeof pass === "undefined") return false;
    const now = new Date();
    // endAt 이 지금보다 크거나 같으면 미래이기 때문에 true 아니면 false
    return pass.endAt >= now;
  } catch (err) {
    console.log(err);
    throw err;
  }
}
/**
 * 패키지로 아이템 구매하기
 * @param {String} userId
 * @param {String} otherUserId
 * @param {Number} serviceId
 * @returns {Promis<{status: boolean}>}
 */
async function buyItemByPackage(userId, otherUserId, serviceId) {
  try {
    const itemLog = ItemLog({
      userId,
      otherUserId,
      useAmount: 0,
      itemId: serviceId,
    });
    await paymentDb.insertItemLog(itemLog);
    result.status = true;
    return result;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

async function buyItemByCupon(userId, otherUserId, serviceId) {
  try {
    const itemLog = ItemLog({
      userId,
      otherUserId,
      useAmount: 0,
      itemId: serviceId,
    });
    await paymentDb.insertItemLog(itemLog);
    result.status = true;
    return result;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

/**
 * 코인으로 아이템 구매하기
 * @param {String} userId
 * @param {String} otherUserId
 * @param {Number} serviceId
 * @param {Number} coinPrice
 * @returns {Promise<{status: boolean}>}
 */
async function buyItemByCoin(userId, otherUserId, serviceId, coinPrice) {
  try {
    // coin log & item log
    const { _id: coinLogType } = (await paymentDb.getCoinLogType()).find(
      (x) => x.typeName === "사용"
    );
    const itemLog = ItemLog({
      userId,
      otherUserId,
      itemId: serviceId,
      useAmount: coinPrice,
    });
    const coinLog = CoinLog({
      userId,
      coinAmount: -coinPrice,
      type: coinLogType,
      detail: itemLog._id,
    });

    await Promise.all([
      paymentDb.insertItemLog(itemLog),
      paymentDb.insertCoinLog(coinLog),
    ]);

    result.status = true;
    return result;
  } catch (err) {
    console.log(err);
    throw err;
  }
}
/**
 * 코인으로 아이템 구매하기 실패(아이템 구매 실패)
 * @param {String} userId
 * @param {Number} coinPrice
 * @returns {Promise<{status: boolean, body: object}>}
 */
async function failBuyItemByCoin(userId, coinPrice) {
  try {
    await userDb.updateCoins(userId, coinPrice);

    result.status = false;
    result.body = errMsg.payment.payRequire;
    return result;
  } catch (err) {
    console.log(err);
    throw err;
  }
}
/**
 * 무료 코인 얻기 - 지인 추천
 * 1. 해당 지인 폰 번호로 이미 코인을 얻었는지 검색
 * 2. 없으면 무료 코인 로그와 코인 로그 작성
 * 3. 유저 db 반영
 * @param {String} userId
 * @param {String} phoneNumber
 * @returns {Promise<>}
 */
async function getFreeCoinByReferrer(userId, phoneNumber) {
  try {
    // 로그 있는지 확인
    const hasLog = await paymentDb.findFreeCoinLogByReferrer(
      userId,
      phoneNumber
    );
    if (hasLog) {
      result.status = false;
      return result;
    }

    const { _id: type, coin } = (await paymentDb.getFreeCoinType()).find(
      (x) => x.name === "지인추천"
    );
    // 코인 로그와 무료 코인 로그 넣기
    const freeCoinLog = {
      _id: generateId(),
      type,
      userId,
      phoneNumber,
      timestamp: new Date(),
    };
    const { _id: coinLogType } = (await paymentDb.getCoinLogType()).find(
      (x) => x.typeName === "무료코인"
    );
    const coinLog = CoinLog({
      userId,
      coinAmount: coin,
      type: coinLogType,
      detail: freeCoinLog._id,
    });
    await paymentDb.insertFreeCoinLog(freeCoinLog);
    await paymentDb.insertCoinLog(coinLog);

    // 유저 db 바꾸기
    const currentCoin = await userDb.updateCoins(userId, coin);
    result.status = true;
    result.body = { coin: currentCoin };
    return result;
  } catch (err) {
    console.log(err);
    throw err;
  }
}
/**
 * 친구해요 메시지 답장으로 무료 코인 받기
 * @param {String} userId
 * @param {String} otherUserId
 * @returns {Promise<{status: boolean, body: object}>}
 */
async function getFreeCoinByMessage(userId, otherUserId) {
  try {
    // 로그 있는지 확인
    const hasLog = await paymentDb.findFreeCoinLogByMessage(
      userId,
      otherUserId
    );
    if (hasLog) {
      result.status = false;
      return result;
    }

    // 코인 로그와 무료 코인 로그 넣기
    const { _id: type, coin } = (await paymentDb.getFreeCoinType()).find(
        (x) => x.name === "친구해요답장"
      ),
      freeCoinLog = {
        _id: generateId(),
        type,
        userId,
        otherUserId,
        timestamp: new Date(),
      },
      { _id: coinLogType } = (await paymentDb.getCoinLogType()).find(
        (x) => x.typeName === "무료코인"
      ),
      coinLog = CoinLog({
        userId,
        coinAmount: coin,
        type: coinLogType,
        detail: freeCoinLog._id,
      });
    await paymentDb.insertFreeCoinLog(freeCoinLog);
    await paymentDb.insertCoinLog(coinLog);

    // 유저 db 바꾸기
    const currentCoin = await userDb.updateCoins(userId, coin);
    result.status = true;
    result.body = { coin: currentCoin };
    return result;
  } catch (err) {
    console.log(err);
    throw err;
  }
}
/**
 * 무료 코인 얻기 - 프로필 100%
 * @param {String} userId
 * @returns {Promise<{status: boolean, body: object}>}
 */
async function getFreeCoinByProfileComplete(userId) {
  try {
    //로그 있는지 확인
    const hasLog = await paymentDb.findFreeCoinLogByProfileComplete(userId);
    if (hasLog) {
      result.status = false;
      return result;
    }

    // 코인 로그와 무료 코인 로그 저장
    const { _id: type, coin } = (await paymentDb.getFreeCoinType()).find(
        (x) => x.name === "프로필100"
      ),
      freeCoinLog = {
        _id: generateId(),
        type,
        userId,
        timestamp: new Date(),
      },
      { _id: coinLogType } = (await paymentDb.getCoinLogType()).find(
        (x) => x.typeName === "무료코인"
      ),
      coinLog = CoinLog({
        userId,
        coinAmount: coin,
        type: coinLogType,
        detail: freeCoinLog._id,
      });
    await paymentDb.insertFreeCoinLog(freeCoinLog);
    await paymentDb.insertCoinLog(coinLog);

    // 유저 db 바꾸기
    const currentCoin = await userDb.updateCoins(userId, coin);
    result.status = true;
    result.body = { coin: currentCoin };
    return result;
  } catch (err) {
    console.log(err);
    throw err;
  }
}
/**
 * 무료 코인 얻기 - 사진 4장 모두
 * @param {String} userId
 * @returns {Promise<{status: boolean, body: object}>}
 */
async function getFreeCoinByPictureComplete(userId) {
  try {
    //로그 있는지 확인
    const hasLog = await paymentDb.findFreeCoinLogByPictureComplete(userId);
    if (hasLog) {
      result.status = false;
      return result;
    }

    // 코인 로그와 무료 코인 로그 저장
    const { _id: type, coin } = (await paymentDb.getFreeCoinType()).find(
        (x) => x.name === "프로필사진4장"
      ),
      freeCoinLog = {
        _id: generateId(),
        type,
        userId,
        timestamp: new Date(),
      },
      { _id: coinLogType } = (await paymentDb.getCoinLogType()).find(
        (x) => x.typeName === "무료코인"
      ),
      coinLog = CoinLog({
        userId,
        coinAmount: coin,
        type: coinLogType,
        detail: freeCoinLog._id,
      });
    await paymentDb.insertFreeCoinLog(freeCoinLog);
    await paymentDb.insertCoinLog(coinLog);

    // 유저 db 바꾸기
    const currentCoin = await userDb.updateCoins(userId, coin);
    result.status = true;
    result.body = { coin: currentCoin };
    return result;
  } catch (err) {
    console.log(err);
    throw err;
  }
}
/**
 * 무료 코인 얻기 - 게시글 좋아요로
 * @param {String} articleId
 * @param {Number} like
 * @param {String} articleType
 * @returns {Promise<{status: boolean, body: object}>}
 */
async function getFreeCoinByArticleLike(articleId, like, articleType) {
  try {
    // 여기서 일단 좋아요 숫자도 먼저 얻기 - 뭔가 배수로? 처리하기?
    const {
      _id: type,
      coin,
      likeNumber,
    } = (await paymentDb.getFreeCoinType()).find(
      (x) => x.name === "게시글좋아요"
    );
    if (like % likeNumber !== 0) {
      result.status = false;
      return result;
    }

    //로그 있는지 확인
    const hasLog = await paymentDb.findFreeCoinLogByArticleLike(
      articleId,
      like
    );
    if (hasLog) {
      result.status = false;
      return result;
    }

    // 코인 로그와 무료 코인 로그 저장
    const { userId } = await articleDb.getOneArticle(articleId, articleType),
      freeCoinLog = {
        _id: generateId(),
        type,
        articleId,
        like,
        timestamp: new Date(),
      },
      { _id: coinLogType } = (await paymentDb.getCoinLogType()).find(
        (x) => x.typeName === "무료코인"
      ),
      coinLog = CoinLog({
        userId,
        coinAmount: coin,
        type: coinLogType,
        detail: freeCoinLog._id,
      });
    await paymentDb.insertFreeCoinLog(freeCoinLog);
    await paymentDb.insertCoinLog(coinLog);

    // 유저 db 바꾸기
    const currentCoin = await userDb.updateCoins(userId, coin);
    result.status = true;
    result.body = { coin: currentCoin };
    return result;
  } catch (err) {
    console.log(err);
    throw err;
  }
}
/**
 * 무료 코인 얻기 - 생일 이벤트
 * @param {String} userId
 * @returns {Promise<{status: boolean, body: object}>}
 */
async function getFreeCoinByBday(userId) {
  try {
    // 생일인지 확인
    const {
        basicProfile: { age: bday },
      } = await userDb.findUserById(userId, { "basicProfile.age": 1 }),
      bday_month = new Date(bday).getMonth(),
      bday_day = new Date(bday).getDate(),
      now_month = new Date().getMonth(),
      now_day = new Date().getDate();
    if (bday_month !== now_month && bday_day !== now_day) {
      result.status = false;
      return result;
    }

    // 코인 로그와 무료 코인 로그 저장
    const { _id: type, coin } = (await paymentDb.getFreeCoinType()).find(
        (x) => x.name === "생일"
      ),
      freeCoinLog = {
        _id: generateId(),
        type,
        userId,
        timestamp: new Date(),
      },
      { _id: coinLogType } = (await paymentDb.getCoinLogType()).find(
        (x) => x.typeName === "무료코인"
      ),
      coinLog = CoinLog({
        userId,
        coinAmount: coin,
        type: coinLogType,
        detail: freeCoinLog._id,
      });
    await paymentDb.insertFreeCoinLog(freeCoinLog);
    await paymentDb.insertCoinLog(coinLog);

    // 유저 db 바꾸기
    const currentCoin = await userDb.updateCoins(userId, coin);
    result.status = true;
    result.body = { coin: currentCoin };
    return result;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

async function addAccess(_id) {
  try {
    //여기서 현재 유저가 저장소에 있나 확인 후 있으면 리턴
    const user = await statisticDb.getAccessUserById(_id);
    if (user) {
      result.status = true;
      result.body = null;
      return result;
    }

    const date = new Date().toISOString();
    const day = date.substring(0, 10);
    const type = 0;

    let today = await statisticDb.findAccessToday({ type: 0, date: day });
    if (today != null)
      await statisticDb.updateAccessCount(
        { _id: today._id, type: type },
        { $inc: { count: 1 } }
      );
    else
      await statisticDb.insertAccessCount({ type: type, count: 1, date: day });

    result.status = true;
    result.body = null;
    return result;
  } catch (err) {
    console.log(err);
    throw err;
  }
}
