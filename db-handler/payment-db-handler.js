export default function makePaymentDb(makeDb) {
  // global varialbes
  const limit = 10;

  return Object.freeze({
    getCoinLogDb,
    getCoinLogType,
    insertCoinLog,
    getItemLogDb,
    getCoinUsageLog,
    getBillLog,
    insertBillLog,
    updateSuccessBill,
    updateFailBill,
    cancelBill,
    getCoinBillLog,
    getPackageBillLog,
    insertItemLog,
    getItemLog,
    getItemLogWithinTime,
    getFreeCoinType,
    findFreeCoinLogByReferrer,
    insertFreeCoinLog,
    findFreeCoinLogByMessage,
    findFreeCoinLogByProfileComplete,
    findFreeCoinLogByPictureComplete,
    findFreeCoinLogByArticleLike,

    // 옮겨질 수도 있는 function
    getCoinProduct,
    getPackageProduct,
    getServiceCost,
    getServiceCostList,
    getCoinProductList,
    getPackageProductList,
    getEventProductList,
    getNewUserEventProductList,
  });
  /**
   * 코인 로그 db
   * @returns {Promise<object>}
   */
  async function getCoinLogDb() {
    return (await makeDb()).collection("coinLog");
  }
  /**
   * 아이템 로그 db
   * @returns {Promise<object>}
   */
  async function getItemLogDb() {
    return (await makeDb()).collection("itemLog");
  }
  /**
   * 빌 로그 db (현금 결제 log)
   * @returns {Promise<object>}
   */
  async function getBillLogDb() {
    return (await makeDb()).collection("billLog");
  }
  /**
   * 무료 코인 로그 db
   * @returns {Promise<object>}
   */
  async function getFreeCoinLogDb() {
    return (await makeDb()).collection("freeCoinLog");
  }

  /**
   * 코인 상품 db (옮겨질 가능성 다수)
   * @returns {Promise<object>}
   */
  async function getCoinProductDb() {
    return (await makeDb()).collection("coinProduct");
  }
  /**
   * 패키지 상품 db (옮겨질 가능성 다수)
   * @returns {Promise<object>}
   */
  async function getPackageProductDb() {
    return (await makeDb()).collection("packageProduct");
  }
  /**
   * 서비스 가격 db (옮겨질 가능성 다수)
   * @returns {Promise<object>}
   */
  async function getServiceCostDb() {
    return (await makeDb()).collection("serviceCost");
  }
  /**
   * 코인 상품 찾기
   * @param {String} productId
   * @returns {Promise<{coin: Number, bonus: Numbere, price: Number}>}
   */
  async function getCoinProduct(productId) {
    try {
      const db = await getCoinProductDb(),
        query = { _id: productId },
        projection = { coin: 1, bonus: 1, price: 1, event: 1 };
      return db.findOne(query, { projection });
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 패키지 상품 찾기
   * @param {String} productId
   * @returns {Promise<object>}
   */
  async function getPackageProduct(productId) {
    try {
      const db = await getPackageProductDb(),
        query = { _id: productId },
        projection = { options: 1, items: 1 };
      return db.findOne(query, { projection });
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 서비스 가격 알기
   * @param {String} service
   * @param {String} id
   * @returns {Promise<object>}
   */
  async function getServiceCost({ service, id }) {
    try {
      const db = await getServiceCostDb(),
        query = service?.length > 0 ? { name: service } : { _id: id };
      return db.findOne(query);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 서비스 가격 리스트
   * @returns {Promise<Array>}
   */
  async function getServiceCostList() {
    try {
      const db = await getServiceCostDb();
      return db.find().toArray();
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 코인 상품 리스트 받기
   * @returns {Promise<Array>}
   */
  async function getCoinProductList() {
    try {
      const db = await getCoinProductDb();
      return db.find().sort({ order: 1 }).toArray();
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 패키지 상품 리스트 받기
   * @returns {Promise<Array>}
   */
  async function getPackageProductList() {
    try {
      const db = await getPackageProductDb();
      return await db
        .aggregate([
          {
            $match: {
              type: 0,
              status: 1,
            },
          },
          {
            $lookup: {
              from: "packageProduct",
              localField: "_id",
              foreignField: "category",
              as: "itemList",
            },
          },
          {
            $project: {
              type: 1,
              status: 1,
              name: 1,
              explain: 1,
              itemList: {
                $filter: {
                  input: "$itemList",
                  as: "itemList",
                  cond: { $eq: ["$$itemList.status", 1] },
                },
              },
            },
          },
        ])
        .toArray();
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  /**
   * 이벤트 패키지 상품 리스트 받기
   * @returns {Promise<Array>}
   */
  async function getEventProductList() {
    try {
      const db = await getPackageProductDb();
      return await db
        .aggregate([
          {
            $match: {
              type: 0,
              status: 2,
            },
          },
          {
            $lookup: {
              from: "packageProduct",
              localField: "_id",
              foreignField: "category",
              as: "itemList",
            },
          },
          {
            $project: {
              type: 1,
              status: 1,
              name: 1,
              explain: 1,
              itemList: {
                $filter: {
                  input: "$itemList",
                  as: "itemList",
                  cond: { $eq: ["$$itemList.status", 1] },
                },
              },
            },
          },
        ])
        .toArray();
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  /**
   * 신규유저 이벤트 패키지 상품 리스트 받기
   * @returns {Promise<Array>}
   */
  async function getNewUserEventProductList() {
    try {
      const db = await getPackageProductDb();
      return await db
        .aggregate([
          {
            $match: {
              type: 0,
              status: 3,
            },
          },
          {
            $lookup: {
              from: "packageProduct",
              localField: "_id",
              foreignField: "category",
              as: "itemList",
            },
          },
          {
            $project: {
              type: 1,
              status: 1,
              name: 1,
              explain: 1,
              itemList: {
                $filter: {
                  input: "$itemList",
                  as: "itemList",
                  cond: { $eq: ["$$itemList.status", 1] },
                },
              },
            },
          },
        ])
        .toArray();
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  /**
   * 코인 로그 타입 array
   * 없을 시 새로 생성한다
   * @returns {Promise<Array}
   */
  async function getCoinLogType() {
    try {
      const db = await getCoinLogDb(),
        query = { typeName: { $exists: true } };

      let cursor = db.find(query);
      if ((await db.countDocuments(query)) === 0) {
        await db.insertMany([
          { _id: 0, typeName: "충전" },
          { _id: 1, typeName: "무료코인" },
          { _id: 2, typeName: "사용" },
          { _id: 3, typeName: "환불" },
        ]);
        cursor = db.find(query);
      }
      return cursor.toArray();
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 코인 로그 저장하기
   * @param {object} coinLog
   * @returns {Promise<string>}
   */
  async function insertCoinLog(coinLog) {
    try {
      const db = await getCoinLogDb(),
        { insertedId } = await db.insertOne(coinLog);
      return insertedId;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 코인 사용 내역 받기 - admin db(serviceCost)랑 join하여 아이템 이름을 얻을 수 있음
   * @param {String} userId
   * @param {Date} timestamp
   * @returns {Promise<Array>}
   */
  async function getCoinUsageLog(userId, timestamp = new Date()) {
    try {
      const db = await getItemLogDb(),
        serviceCostDb = (await getServiceCostDb()).collectionName,
        filterStage = {
          $match: {
            userId,
            timestamp: { $lt: timestamp },
            useAmount: { $gt: 0 },
          },
        },
        sortStage = { $sort: { timestamp: -1 } },
        limitStage = { $limit: limit },
        joinStage = {
          $lookup: {
            from: serviceCostDb,
            localField: "itemId",
            foreignField: "_id",
            as: "item",
          },
        },
        projectionStage = {
          $project: {
            timestamp: 1,
            otherUserId: 1,
            useAmount: 1,
            itemId: 1,
            "item.name": 1,
          },
        },
        toRootStage = {
          $replaceRoot: {
            newRoot: {
              $mergeObjects: [{ $arrayElemAt: ["$item", 0] }, "$$ROOT"],
            },
          },
        },
        finalProjection = {
          $project: {
            timestamp: 1,
            otherUserId: 1,
            useAmount: 1,
            itemId: 1,
            itemName: "$name",
          },
        };
      return db
        .aggregate([
          filterStage,
          sortStage,
          limitStage,
          joinStage,
          projectionStage,
          toRootStage,
          finalProjection,
        ])
        .toArray();
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 현금 결제 로그 저장하기
   * @param {object} billLog
   * @returns {Promise<String>}
   */
  async function getBillLog(billLog) {
    try {
      const db = await getBillLogDb();
      return db.findOne(billLog);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 현금 결제 로그 저장하기
   * @param {object} billLog
   * @returns {Promise<String>}
   */
  async function insertBillLog(billLog) {
    try {
      const db = await getBillLogDb(),
        { insertedId } = await db.insertOne(billLog);
      return insertedId;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 성공한 결제 정보 업데이트 하기
   * 수정된 billLog를 돌려준다
   * @param {String} billId
   * @param {object} paymentInfo
   * @returns {Promise<object}
   */
  async function updateSuccessBill(billId, paymentInfo) {
    try {
      const db = await getBillLogDb(),
        query = { _id: billId },
        update = { $set: { paymentInfo: paymentInfo, error: false } },
        option = { returnDocument: "after" },
        { value } = await db.findOneAndUpdate(query, update, option);
      return value;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 실패한 결제 정보 업데이트 하기
   * 수정된 billLog를 돌려준다
   * @param {String} billId
   * @param {object} paymentInfo
   * @returns {Promise<object>}
   */
  async function updateFailBill(billId, paymentInfo) {
    try {
      const db = await getBillLogDb(),
        query = { _id: billId },
        update = { $set: { paymentInfo: paymentInfo, error: true } },
        option = { returnDocument: "after" },
        { value } = await db.findOneAndUpdate(query, update, option);
      return value;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 취소한 결제 정보 지우기
   * @param {String} billId
   * @returns {Promise<void>}
   */
  async function cancelBill(billId) {
    try {
      const db = await getBillLogDb(),
        query = { _id: billId };
      return db.deleteOne(query);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 코인 사용 내역 받기
   * @param {String} userId
   * @param {Date} timestamp
   * @returns {Promise<Array>}
   */
  async function getCoinBillLog(userId, timestamp = new Date()) {
    try {
      const db = await getBillLogDb(),
        coinLogDb = (await getCoinLogDb()).collectionName,
        // productType: 0 === coin
        // price: { $gt: 0 } 환불 외 결제 내역만
        filterStage = {
          $match: {
            error: false,
            productType: 0,
            userId,
            timestamp: { $lt: timestamp },
            price: { $gt: 0 },
          },
        },
        sortStage = { $sort: { timestamp: -1 } },
        limitStage = { $limit: limit },
        joinStage = {
          $lookup: {
            from: coinLogDb,
            localField: "_id",
            foreignField: "detail",
            as: "coinLog",
          },
        },
        idNotIncludeStage = { $project: { _id: 0 } },
        projectionStage = {
          $project: {
            userId: 1,
            timestamp: 1,
            price: 1,
            productId: 1,
            "coinLog.coinAmount": 1,
          },
        },
        toRootStage = {
          $replaceRoot: {
            newRoot: {
              $mergeObjects: [{ $arrayElemAt: ["$coinLog", 0] }, "$$ROOT"],
            },
          },
        },
        finalProjection = {
          $project: {
            userId: 1,
            timestamp: 1,
            price: 1,
            productId: 1,
            coinAmount: 1,
          },
        };
      return db
        .aggregate([
          filterStage,
          sortStage,
          limitStage,
          joinStage,
          idNotIncludeStage,
          projectionStage,
          toRootStage,
          finalProjection,
        ])
        .toArray();
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 패키지 구매 내역 받기
   * @param {String} userId
   * @param {Date} timestamp
   * @returns {Promise<Array>}
   */
  async function getPackageBillLog(userId, timestamp = new Date()) {
    try {
      const db = await getBillLogDb(),
        packageProductDb = (await getPackageProductDb()).collectionName,
        // productType: 1 === package
        // price: { $gt: 0 } 환불 외 결제 내역만
        filterStage = {
          $match: {
            error: false,
            productType: 1,
            userId,
            timestamp: { $lt: timestamp },
            price: { $gt: 0 },
          },
        },
        sortStage = { $sort: { timestamp: -1 } },
        limitStage = { $limit: limit },
        joinStage = {
          $lookup: {
            from: packageProductDb,
            foreignField: "_id",
            localField: "productId",
            as: "product",
          },
        },
        idNotIncludeStage = { $project: { _id: 0 } },
        // item 선택하기 어려워서 그냥 다 보내기
        projectionStage = {
          $project: {
            userId: 1,
            timestamp: 1,
            price: 1,
            productId: 1,
            productDetail: 1,
            "product.items": 1,
          },
        },
        toRootStage = {
          $replaceRoot: {
            newRoot: {
              $mergeObjects: [{ $arrayElemAt: ["$product", 0] }, "$$ROOT"],
            },
          },
        },
        finalProjectin = {
          $project: {
            userId: 1,
            timestamp: 1,
            price: 1,
            productId: 1,
            productDetail: 1,
            items: 1,
          },
        };
      const res = await db
        .aggregate([
          filterStage,
          sortStage,
          limitStage,
          joinStage,
          idNotIncludeStage,
          projectionStage,
          toRootStage,
          finalProjectin,
        ])
        .toArray();
      // formatting - item 선택하기
      return res.map(({ items, productDetail, ...rest }) => {
        return {
          ...rest,
          packageItem: items[productDetail],
        };
      });
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 아이템 로그 저장하기
   * @param {object} itemLog
   * @returns {Promise<String>}
   */
  async function insertItemLog(itemLog) {
    try {
      const db = await getItemLogDb(),
        { insertedId } = await db.insertOne(itemLog);
      return insertedId;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 두 유저 사이의 아이템을 산 적 있는지 확인
   * @param {String} userId
   * @param {String} otherUserId
   * @param {String} itemId
   * @returns {Promise<object>}
   */
  async function getItemLog(userId, otherUserId, itemId) {
    try {
      const db = await getItemLogDb(),
        query = { userId, otherUserId, itemId };
      return db.findOne(query);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 25시간 이내에 구매한 이력이 있는지 확인
   * @param {String} userId
   * @param {String} otherUserId
   * @param {String} itemId
   * @returns {Promise<object>}
   */
  async function getItemLogWithinTime(userId, otherUserId, itemId) {
    try {
      const db = await getItemLogDb(),
        now = new Date(),
        hours_ago_25 = new Date(new Date(now).setHours(now.getHours() - 25)),
        query = {
          userId,
          otherUserId,
          itemId,
          timestamp: { $gte: hours_ago_25 },
        };
      return db.findOne(query);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 무료 코인 타입 얻기
   * @returns {Promise<Array>}
   */
  async function getFreeCoinType() {
    try {
      const db = await getFreeCoinLogDb(),
        query = { name: { $exists: true } };

      let cursor = db.find(query);
      if ((await db.countDocuments(query)) === 0) {
        db.insertMany([
          { _id: 0, name: "지인추천", coin: 10 },
          { _id: 1, name: "게시글좋아요", coin: 5, likeNumber: 20 },
          { _id: 2, name: "친구해요답장", coin: 2 },
          { _id: 3, name: "프로필100", coin: 20 },
          { _id: 4, name: "프로필사진4장", coin: 30 },
          { _id: 5, name: "생일", coin: 50 },
        ]);
        cursor = db.find(query);
      }
      return cursor.toArray();
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 무료코인 기록 찾기 - 지인추천
   * @param {String} userId
   * @param {String} phoneNumber
   * @returns {Promise<object>}
   */
  async function findFreeCoinLogByReferrer(userId, phoneNumber) {
    try {
      const db = await getFreeCoinLogDb(),
        // type: 0 === 지인추천
        query = { userId, type: 0, phoneNumber };
      return db.findOne(query);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 무료 코인 로그 적기
   * @param {object} freeCoinLog
   * @returns {Promise<String>}
   */
  async function insertFreeCoinLog(freeCoinLog) {
    try {
      const db = await getFreeCoinLogDb(),
        { insertedId } = await db.insertOne(freeCoinLog);
      return insertedId;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 무료 코인 기록 찾기 - 친구해요 메시지
   * @param {String} userId
   * @param {String} otherUserId
   * @returns {Promise<object>}
   */
  async function findFreeCoinLogByMessage(userId, otherUserId) {
    try {
      const db = await getFreeCoinLogDb(),
        // type: 2 친구해요
        query = { userId, otherUserId, type: 2 };
      return db.findOne(query);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 무료 코인 기록 찾기 - 프로필 완성
   * @param {string} userId
   * @returns {Promise<object>}
   */
  async function findFreeCoinLogByProfileComplete(userId) {
    try {
      const db = await getFreeCoinLogDb(),
        query = { userId, type: 3 };
      return db.findOne(query);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 무료 코인 기록 찾기 - 사진 6장 완성
   * @param {string} userId
   * @returns {Promise<object>}
   */
  async function findFreeCoinLogByPictureComplete(userId) {
    try {
      const db = await getFreeCoinLogDb(),
        query = { userId, type: 4 };
      return db.findOne(query);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 무료 코인 기록 찾기 - 게시글 좋아요
   * @param {String} articleId
   * @param {Number} like
   * @returns {Promise<object>}
   */
  async function findFreeCoinLogByArticleLike(articleId, like) {
    try {
      const db = await getFreeCoinLogDb(),
        query = { articleId, like, type: 1 };
      return db.findOne(query);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
}
