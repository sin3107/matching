import { paymentDb, userDb } from "../db-handler/index.js";
import { payment_use_case } from "../use-cases/handle-payment.js";

export {
  getMyCoins,
  getMyCoinUsage,
  addCoins,
  buyPackage,
  getMyPass,
  getMyBillLog,
  buyUserDetailProfile,
  buyMisty,
  buyHidden,
  getBdayFreeCoin,
  getServiceCost,
  getCoinProductList,
  getPackageProductList,
  getEventProductList,
  getFreeCoinList,
  getUserAccess,
};

// ANCHOR status code list
const ok = "200";
const created = "201";
const badRequest = "400";
const unauthorized = "401";
const serverError = "500";
const httpResponse = {
  headers: "",
  statusCode: "",
  body: "",
};
/**
 * 내 현재 보유 코인 받기
 * @param {Object} httpRequest
 * @returns {Promise<object>}
 */
async function getMyCoins(httpRequest) {
  try {
    const {
      body: {
        user: { _id },
      },
    } = httpRequest;

    const { status, body } = await payment_use_case.getCoins(_id);

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
 * 내 코인 사용 내역 받기
 * @param {object} httpRequest
 * @returns {Promise<object>}
 */
async function getMyCoinUsage(httpRequest) {
  try {
    const {
      body: {
        user: { _id },
      },
      query: { timestamp },
    } = httpRequest;
    const { status, body } = await payment_use_case.getCoinUsage(
      _id,
      timestamp
    );

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
 * 코인 충전하기
 * @param {object} httpRequest
 * @returns {Promise<object>}
 */
async function addCoins(httpRequest) {
  try {
    const {
      body,
      body: {
        user: { _id },
      },
    } = httpRequest;
    const { status, body: resBody } = await payment_use_case.addCoins(
      _id,
      body
    );

    httpResponse.statusCode = status ? ok : badRequest;
    httpResponse.body = resBody;
    return httpResponse;
  } catch (err) {
    console.log(err);
    httpResponse.statusCode = serverError;
    httpResponse.body = err.message;
    return httpResponse;
  }
}
/**
 * 패키지 구매하기
 * @param {Object} httpRequest
 * @returns {Promise<object>}
 */
async function buyPackage(httpRequest) {
  try {
    const {
      body,
      body: {
        user: { _id },
      },
    } = httpRequest;
    const { status, body: resBody } = await payment_use_case.addPackage(
      _id,
      body
    );

    httpResponse.statusCode = status ? ok : badRequest;
    httpResponse.body = resBody;
    return httpResponse;
  } catch (err) {
    console.log(err);
    httpResponse.statusCode = serverError;
    httpResponse.body = err.message;
    return httpResponse;
  }
}
/**
 * 내 패키지 (패스) 보기
 * @param {object} httpRequest
 * @returns {Promise<Object>}
 */
async function getMyPass(httpRequest) {
  try {
    const {
      body: {
        user: { _id },
      },
    } = httpRequest;
    const { status, body } = await payment_use_case.getCurrentPass(_id);

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
 * 내 현금 결제 내역 타입에 따라 나눠 받기
 * @param {object} httpRequest
 * @returns {Promise<object>}
 */
async function getMyBillLog(httpRequest) {
  try {
    const {
      body: {
        user: { _id },
      },
      query: { type, timestamp },
    } = httpRequest;
    const { status, body } = await payment_use_case.getBillLog(
      _id,
      type,
      timestamp
    );

    httpResponse.statusCode = status ? ok : badRequest;
    httpResponse.body = body;
    return httpResponse;
  } catch (error) {}
}

/**
 * 유저 상세 프로필 사기
 * @param {object} httpRequest
 * @returns {Promise<object>}
 */
async function buyUserDetailProfile(httpRequest) {
  try {
    const {
      body: {
        userId,
        user: { _id },
      },
    } = httpRequest;

    const { status, body } = await payment_use_case.buyItem(
      _id,
      userId,
      "profile"
    );

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
 * 미스티 구매하기(롱디)
 * @param {object} httpRequest
 * @returns {Promise<object>}
 */
async function buyMisty(httpRequest) {
  try {
    const {
      body: {
        userId,
        user: { _id },
        service,
      },
    } = httpRequest;

    const { status, body } = await payment_use_case.buyTimeItem(
      _id,
      userId,
      service
    );
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
 * 히든 구매하기
 * @param {object} httpRequest
 * @returns {Promise<object>}
 */
async function buyHidden(httpRequest) {
  try {
    const {
      body: {
        userId,
        user: { _id },
      },
    } = httpRequest;

    const { status, body } = await payment_use_case.buyTimeItem(
      _id,
      userId,
      "hidden"
    );
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
 * 생일 이벤트 참여하기 end point
 * @param {object} httpRequest
 * @returns {Promise<object>}
 */
async function getBdayFreeCoin(httpRequest) {
  try {
    const {
      body: {
        user: { _id },
      },
    } = httpRequest;

    const { status, body } = await payment_use_case.getFreeCoinByBday(_id);
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
 * 서비스 가격 안내 출력
 * @param {object} httpRequest
 * @returns {Promise<object>}
 */
async function getServiceCost(httpRequest) {
  try {
    const list = await paymentDb.getServiceCostList();
    httpResponse.statusCode = ok;
    httpResponse.body = list;
    return httpResponse;
  } catch (err) {
    console.log(err);
    httpResponse.statusCode = serverError;
    httpResponse.body = err.message;
    return httpResponse;
  }
}
/**
 * 무료 코인 안내 출력
 * @param {object} httpRequest
 * @returns {Promise<object>}
 */
async function getFreeCoinList(httpRequest) {
  try {
    const list = await paymentDb.getFreeCoinType();
    httpResponse.statusCode = ok;
    httpResponse.body = list;
    return httpResponse;
  } catch (err) {
    console.log(err);
    httpResponse.statusCode = serverError;
    httpResponse.body = err.message;
    return httpResponse;
  }
}

/**
 * 코인 상품 리스트 출력
 * @param {Object} httpRequest
 * @returns {Promise<object>}
 */
async function getCoinProductList(httpRequest) {
  try {
    const list = await paymentDb.getCoinProductList();
    httpResponse.statusCode = ok;
    httpResponse.body = list;
    return httpResponse;
  } catch (err) {
    console.log(err);
    httpResponse.statusCode = serverError;
    httpResponse.body = err.message;
    return httpResponse;
  }
}
/**
 * 패키지 상품 리스트 출력
 * @param {object} httpRequest
 * @returns {Promise<object>}
 */
async function getPackageProductList(httpRequest) {
  try {
    const list = await paymentDb.getPackageProductList();
    httpResponse.statusCode = ok;
    httpResponse.body = list;
    return httpResponse;
  } catch (err) {
    console.log(err);
    httpResponse.statusCode = serverError;
    httpResponse.body = err.message;
    return httpResponse;
  }
}
/**
 * 이벤트 상품 리스트 출력
 * @param {object} httpRequest
 * @returns {Promise<object>}
 */
async function getEventProductList(httpRequest) {
  try {
    const {
      body: {
        user: { _id },
      },
    } = httpRequest;
    let newUser = "";
    const now = new Date();
    const startTime = new Date(new Date().setDate(now.getDate() - 7));

    const {
      log: { registeredAt },
    } = await userDb.findUserById(_id, { log: 1 });

    if (startTime < registeredAt) {
      newUser = await paymentDb.getNewUserEventProductList();
    }

    const list = await paymentDb.getEventProductList();

    const data = { list: list };
    if (newUser) {
      data.new = newUser;
    }
    httpResponse.statusCode = ok;
    httpResponse.body = data;
    return httpResponse;
  } catch (err) {
    console.log(err);
    httpResponse.statusCode = serverError;
    httpResponse.body = err.message;
    return httpResponse;
  }
}

async function getUserAccess(httpRequest) {
  try {
    const {
      body: {
        user: { _id },
      },
    } = httpRequest;

    await payment_use_case.addAccess(_id);
    httpResponse.statusCode = ok;
    httpResponse.body = null;
    return httpResponse;
  } catch (err) {
    console.log(err);
    httpResponse.statusCode = serverError;
    httpResponse.body = err.message;
    return httpResponse;
  }
}
