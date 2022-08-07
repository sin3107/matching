export default function makeArticleDb(makeDb) {
  const limit = 10;
  return Object.freeze({
    getArticleDbByType,
    insertArticle,
    getAllArticleByUser,
    getArticles,
    getMyArticles,
    getOneArticle,
    incViews,
    updateArticle,
    deleteOneArticle,
    deleteArticleByUser,

    getLikeDbByType,
    addLike,
    getTotalLikeCount,
    getLike,
    deleteLike,
    deleteLikeByArticle,
    deleteLikesByManyArticles,
    getAllLikeByUser,
    decreaseManyArticleLike,
    deleteAllLikeByUser,

    getCommentDbByType,
    getComment,
    getCommentTotal,
    getCommentList,
    insertComment,
    updateComment,
    deleteComment,
    deleteCommentsByArticle,
    deletCommentsByManyArticles,
    getAllCommentsByUser,
    decManyArticleComments,
    deleteAllCommentsByUser,

    getPopularDbByType,
    getPopularArticles,
    save7daysPopularArticles,
    deletePopularArticle,
    deleteManyPopularArticles,
  });

  // ANCHOR db
  /**
   *
   * @returns {Promise<object>} article collection db
   */
  async function getArticleDb() {
    try {
      const db = await makeDb();
      return db.collection("article");
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 게시글 댓글 db
   * @returns {Promise<object>}
   */
  async function getArticleCommentDb() {
    try {
      const db = await makeDb();
      return db.collection("articleComment");
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 게시글 좋아요 db
   * @returns {Promise<object>}
   */
  async function getArticleLikeDb() {
    try {
      return (await makeDb()).collection("articleLike");
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 인기 게시글 db 가져오기
   * @returns {Promise<object>}
   */
  async function getPopularArticleDb() {
    return (await makeDb()).collection("popularArticle");
  }
  /**
   * 커뮤니티 게시글 db 가져오기
   * @returns {Promise<object>}
   */
  async function getCommunityDb() {
    try {
      return (await makeDb()).collection("community");
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 커뮤니티 게시글 댓글 db 가져오기
   * @returns {Promise<object>}
   */
  async function getCommunityCommentDb() {
    try {
      return (await makeDb()).collection("communityComment");
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 커뮤니티 좋아요 db
   * @returns {Promise<object>}
   */
  async function getCommunityLikeDb() {
    try {
      return (await makeDb()).collection("communityLike");
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 인기 커뮤니티 db
   * @returns {Promise<object}
   */
  async function getPopularCommunityDb() {
    return (await makeDb()).collection("popularCommunity");
  }
  // switch db
  function getArticleDbByType(type) {
    return type === "matching" ? getArticleDb() : getCommunityDb();
  }
  function getCommentDbByType(type) {
    return type === "matching"
      ? getArticleCommentDb()
      : getCommunityCommentDb();
  }
  function getLikeDbByType(type) {
    return type === "matching" ? getArticleLikeDb() : getCommunityLikeDb();
  }
  function getPopularDbByType(type) {
    return type === "matching"
      ? getPopularArticleDb()
      : getPopularCommunityDb();
  }

  // ANCHOR 게시글
  /**
   * insert one article and return insertedId
   * @param {object} article
   * @param {String} articleType matching || community
   * @returns {Promise<String>} string inserted id
   * @error log & throw
   */
  async function insertArticle(article, articleType) {
    try {
      const db = await getArticleDbByType(articleType),
        { insertedId } = await db.insertOne(article);
      return insertedId;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 한 유저가 쓴 모든 게시물 받기 - files만 보이게 해서
   * @param {String} userId
   * @param {String} type
   * @returns {Promise<Array>}
   */
  async function getAllArticleByUser(userId, type) {
    try {
      const db = await getArticleDbByType(type),
        query = { userId },
        projection = { files: 1 };
      return db.find(query, { projection }).toArray();
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * get articles by page
   * @param {Date} createdAt
   * @param {String} articleType matching || community
   * @returns {Promise<Array>} null or array of documents
   * @error log & throw
   */
  async function getArticles(createdAt = new Date(), articleType) {
    try {
      const db = await getArticleDbByType(articleType),
        filterDateStage = { $match: { createdAt: { $lt: createdAt } } },
        sortStage = { $sort: { createdAt: -1 } },
        limitStage = { $limit: limit },
        userJoinStage = {
          $lookup: {
            from: "user",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        userProjectionStage = {
          $project: {
            _id: 1,
            userId: 1,
            title: 1,
            content: 1,
            files: 1,
            createdAt: 1,
            modifiedAt: 1,
            views: 1,
            like: 1,
            comments: 1,
            "user.basicProfile.nickname": 1,
            "user.basicProfile.profilePic": 1,
          },
        },
        userToRoot = {
          $replaceRoot: {
            newRoot: {
              $mergeObjects: [{ $arrayElemAt: ["$user", 0] }, "$$ROOT"],
            },
          },
        },
        finalProjection = {
          $project: {
            _id: 1,
            title: 1,
            content: 1,
            files: 1,
            createdAt: 1,
            modifiedAt: 1,
            views: 1,
            like: 1,
            comments: 1,
            "userInfo.userId": "$userId",
            "userInfo.nickname": "$basicProfile.nickname",
            "userInfo.profileImage": "$basicProfile.profilePic",
          },
        };
      return db
        .aggregate([
          filterDateStage,
          sortStage,
          limitStage,
          userJoinStage,
          userProjectionStage,
          userToRoot,
          finalProjection,
        ])
        .toArray();
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 내 아티클 받아오기
   * @param {String} userId
   * @param {Date} createdAt
   * @param {String} articleType matching || community
   * @returns {Promise<Array>}
   */
  async function getMyArticles(userId, createdAt, articleType) {
    try {
      const db = await getArticleDbByType(articleType),
        filterStage = { $match: { userId, createdAt: { $lt: createdAt } } },
        sortStage = { $sort: { createdAt: -1 } },
        limitStage = { $limit: limit },
        userJoinStage = {
          $lookup: {
            from: "user",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        userProjectionStage = {
          $project: {
            _id: 1,
            userId: 1,
            title: 1,
            content: 1,
            files: 1,
            createdAt: 1,
            modifiedAt: 1,
            views: 1,
            like: 1,
            comments: 1,
            "user.basicProfile.nickname": 1,
            "user.basicProfile.profilePic": 1,
          },
        },
        userToRoot = {
          $replaceRoot: {
            newRoot: {
              $mergeObjects: [{ $arrayElemAt: ["$user", 0] }, "$$ROOT"],
            },
          },
        },
        finalProjection = {
          $project: {
            _id: 1,
            title: 1,
            content: 1,
            files: 1,
            createdAt: 1,
            modifiedAt: 1,
            views: 1,
            like: 1,
            comments: 1,
            "userInfo.userId": "$userId",
            "userInfo.nickname": "$basicProfile.nickname",
            "userInfo.profileImage": "$basicProfile.profilePic",
          },
        };
      return db
        .aggregate([
          filterStage,
          sortStage,
          limitStage,
          userJoinStage,
          userProjectionStage,
          userToRoot,
          finalProjection,
        ])
        .toArray();
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * get one article and return, not found, undefined
   * @param {String} id article id
   * @param {String} articleType matching || community
   * @returns {Promise<object>}one article or undefined
   * @error log & throw
   */
  async function getOneArticle(id, articleType) {
    try {
      const db = await getArticleDbByType(articleType),
        query = { _id: id };
      return db.findOne(query);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * inclement view for one article
   * @param {String} articleId
   * @param {String} articleType matching || community
   * @error log & throw
   */
  async function incViews(articleId, articleType) {
    try {
      const db = await getArticleDbByType(articleType),
        query = { _id: articleId },
        update = { $inc: { views: 1 } };
      await db.findOneAndUpdate(query, update);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * update one article and return updated one
   * @param {String} id article id
   * @param {object} article {content: 'blah', title: 'new', ...}
   * @param {String} articleType matching || community
   * @returns {Promise<object>}updated document
   * @error log & throw
   */
  async function updateArticle(id, article, articleType) {
    try {
      const db = await getArticleDbByType(articleType),
        query = { _id: id },
        update = { $set: article },
        option = { returnDocument: "after" },
        { value } = await db.findOneAndUpdate(query, update, option);
      return value;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * DELETE one article
   * @param {String} id article id
   * @param {String} articleType matching || community
   * @returns {Promise<void>} deleted count
   */
  async function deleteOneArticle(id, articleType) {
    try {
      const db = await getArticleDbByType(articleType),
        query = { _id: id };
      return db.deleteOne(query);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 한 유저의 모든 게시글 지우기
   * @param {String} userId user id
   * @returns {Promise<void>} deleted count
   * @error log & throw
   */
  async function deleteArticleByUser(userId) {
    try {
      const articleDb = await getArticleDbByType("matching"),
        communityDb = await getArticleDbByType("community");

      const query = { userId };
      return Promise.all([
        articleDb.deleteMany(query),
        communityDb.deleteMany(query),
      ]);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  // ANCHOR 좋아요
  /**
   * add like to article with user id
   * @param {object} like
   * @param {String} articleType matching || community
   * @returns {Promise<{like: Number}>}
   * @error log & throw
   */
  async function addLike(like, articleType) {
    try {
      const likeDb = await getLikeDbByType(articleType);
      await likeDb.insertOne(like);
      const articleDb = await getArticleDbByType(articleType),
        articleQuery = { _id: like.postId },
        update = { $inc: { like: 1 } },
        option = { returnDocument: "after", projection: { like: 1 } };
      return articleDb.findOneAndUpdate(articleQuery, update, option);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 포스트 1개의 총 좋아요 개수 받기
   * @param {String} postId
   * @param {String} articleType matching || community
   * @returns {Promise<Number>}
   */
  async function getTotalLikeCount(postId, articleType) {
    try {
      const db = await getLikeDbByType(articleType),
        query = { postId };
      return db.countDocuments(query);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 게시글의 특정 유저 좋아요 찾기
   * @param {String} postId
   * @param {String} userId
   * @param {String} articleType matching || community
   * @returns {Promise<object>}
   */
  async function getLike(postId, userId, articleType) {
    try {
      const db = await getLikeDbByType(articleType),
        query = { postId, userId };
      return db.findOne(query);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 게시물의 특정 유저 좋아요 지우기
   * @param {String} postId
   * @param {String} userId
   * @param {String} articleType matching || community
   * @returns {Promise<void>}
   */
  async function deleteLike(postId, userId, articleType) {
    try {
      const likeDb = await getLikeDbByType(articleType),
        likeQuery = { postId, userId };
      await likeDb.deleteOne(likeQuery);
      const articleDb = await getArticleDbByType(articleType),
        articleQuery = { _id: postId },
        update = { $inc: { like: -1 } };
      return articleDb.updateOne(articleQuery, update);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 게시글 관련 좋아요 전부 지우기 - 게시글 지울 때 사용
   * @param {String} postId
   * @param {String} articleType matching || community
   * @returns {Promise<void>}
   */
  async function deleteLikeByArticle(postId, articleType) {
    try {
      const db = await getLikeDbByType(articleType),
        query = { postId };
      return db.deleteMany(query);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 많은 게시글 관련 좋아요 전부 지우기
   * @param {string[]} postIds
   * @param {String} type
   * @returns {Promise<void>}
   */
  async function deleteLikesByManyArticles(postIds, type) {
    try {
      const db = await getLikeDbByType(type),
        query = { postId: { $in: postIds } };
      return db.deleteMany(query);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 유저가 좋아요 한 모든 게시글 받기
   * @param {String} userId
   * @param {String} type
   * @returns {Promise<Array>}
   */
  async function getAllLikeByUser(userId, type) {
    try {
      const db = await getLikeDbByType(type),
        query = { userId };
      return db.find(query).toArray();
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 많은 게시글 들 좋아요 -1
   * @param {string[]} articleIds
   * @param {String} type
   * @returns {Promise<void>}
   */
  async function decreaseManyArticleLike(articleIds, type) {
    try {
      const db = await getArticleDbByType(type),
        query = { _id: { $in: articleIds } },
        update = { $inc: { like: -1 } };
      return db.updateMany(query, update);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 해당 유저의 좋아요 전부 지우기
   * @param {String} userId
   * @param {String} type
   * @returns {Promise<void>}
   */
  async function deleteAllLikeByUser(userId, type) {
    try {
      const db = await getLikeDbByType(type),
        query = { userId };
      return db.deleteMany(query);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  // ANCHOR 댓글
  /**
   *  댓글 1개 가져오기
   * @param {String} id
   * @param {String} articleType matching || community
   * @returns {Promise<object>}
   */
  async function getComment(id, articleType) {
    try {
      const db = await getCommentDbByType(articleType);
      const result = await db.findOne({ _id: id });
      return result;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 총 댓글 개수 가져오기
   * @param {object} query
   * @param {String} articleType matching || community
   * @returns {Promise<Number>}
   */
  async function getCommentTotal(query, articleType) {
    try {
      const db = await getCommentDbByType(articleType);
      const result = await db.countDocuments(query);
      return result;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 댓글 리스트 가져오기 - 최신순 정렬
   * @param {object} query
   * @param {Number} limit
   * @param {String} articleType matching || community
   * @returns {Promise<Array>}
   */
  async function getCommentList(query, limit, articleType) {
    try {
      const db = await getCommentDbByType(articleType);
      const result = await db.find(query).sort({ createdAt: -1 }).limit(limit);
      let arr = [];
      await result.forEach((item) => arr.push(item));
      return arr;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 댓글 입력하기
   * 댓글 db에 insert & 게시글 db 댓글 수 수정
   * @param {object} query
   * @param {String} articleType matching || community
   * @returns {Promise<object>}
   */
  async function insertComment(query, articleType) {
    try {
      const commentDb = await getCommentDbByType(articleType),
        articleDb = await getArticleDbByType(articleType);
      const result = await commentDb.insertOne(query),
        articleQuery = { _id: query.postId },
        articleUpdate = { $inc: { comments: 1 } };
      await articleDb.updateOne(articleQuery, articleUpdate);
      return result;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 댓글 수정하기
   * @param {object}} query
   * @param {object} update
   * @param {String} articleType matching || community
   * @returns {Promise<object>}
   */
  async function updateComment(query, update, articleType) {
    try {
      const db = await getCommentDbByType(articleType);
      const result = await db.updateOne(query, { $set: update });
      return result;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 댓글 지우기
   * 댓글 db에서 지우기 + article db에서 수정하기
   * @param {String} id
   * @param {String} articleType matching || community
   * @returns {Promise<object>}
   */
  async function deleteComment(id, articleType) {
    try {
      const db = await getCommentDbByType(articleType),
        articleDb = await getArticleDbByType(articleType),
        { postId } = await db.findOne({ _id: id });
      const result = await db.deleteOne({ _id: id });
      const articleQuery = { _id: postId },
        articleUpate = { $inc: { comments: -1 } };
      await articleDb.updateOne(articleQuery, articleUpate);
      return result;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 한 게시글 관련 댓글 전부 지우기
   * @param {String} postId
   * @param {String} articleType
   * @returns {Promise<void>}
   */
  async function deleteCommentsByArticle(postId, articleType) {
    try {
      const db = await getCommentDbByType(articleType),
        query = { postId };
      return db.deleteMany(query);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 많은 게시글 관련 댓글 전부 지우기
   * @param {Array} postIds
   * @param {String} type
   * @returns {Promise<void>}
   */
  async function deletCommentsByManyArticles(postIds, type) {
    try {
      const db = await getCommentDbByType(type),
        query = { postId: { $in: postIds } };
      return db.deleteMany(query);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   *
   * @param {String} userId
   * @param {String} type
   * @returns {Promise<Array>}
   */
  async function getAllCommentsByUser(userId, type) {
    try {
      const db = await getCommentDbByType(type),
        query = { userId },
        projection = { postId: 1 };
      return db.find(query, { projection }).toArray();
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 많은 게시글 댓글 수 -1
   * @param {Array} articleIds
   * @param {String} type
   * @returns {Promise<void>}
   */
  async function decManyArticleComments(articleIds, type) {
    try {
      const db = await getArticleDbByType(type),
        query = { _id: { $in: articleIds } },
        update = { $inc: { comments: -1 } };
      return db.updateMany(query, update);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 유저의 댓글 지우기
   * @param {String} userId
   * @param {String} type
   * @returns {Promise<void>}
   */
  async function deleteAllCommentsByUser(userId, type) {
    try {
      const db = await getCommentDbByType(type),
        query = { userId };
      return db.deleteMany(query);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  // ANCHOR 인기 게시글
  /**
   * 인기 게시글 데이터 가져오기
   * @param {Number} pagination
   * @param {String} articleType
   * @returns {Promise<Array>}
   */
  async function getPopularArticles(pagination = 1, articleType) {
    try {
      const db = await getPopularDbByType(articleType),
        articleDb = (await getArticleDbByType(articleType)).collectionName,
        // 1. 인기 게시글 db에서 pagination 걸어서 필요한 article id들 가져오기
        sortingStage = { $sort: { popularity: 1 } },
        skipStage = { $skip: (pagination - 1) * limit },
        limitStage = { $limit: limit },
        // 2. 해당 인기 게시글 아이디로 진짜 article db에서 게시글 가져오기
        joinStage = {
          $lookup: {
            from: articleDb,
            localField: "_id",
            foreignField: "_id",
            as: "article",
          },
        },
        // 3. aggregation의 결과는 array 형태이기에 format 바꾸기
        toRootStage = {
          $replaceRoot: {
            newRoot: {
              $mergeObjects: [{ $arrayElemAt: ["$article", 0] }, "$$ROOT"],
            },
          },
        },
        projectionStage = {
          $project: {
            matchingInfo: 0,
            popularity: 0,
            article: 0,
          },
        },
        // 4. user db에서 nickname, profileImage 가져오기
        userDbJoinStage = {
          $lookup: {
            from: "user",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        // 5. user db에서 합친 (join)한 결과 또한 array 형태이기 때문에 맞는 형태로 바꿔주기
        userProjectionStage = {
          $project: {
            _id: 1,
            userId: 1,
            title: 1,
            content: 1,
            files: 1,
            createdAt: 1,
            modifiedAt: 1,
            views: 1,
            like: 1,
            comments: 1,
            "user.basicProfile.nickname": 1,
            "user.basicProfile.profilePic": 1,
          },
        },
        userToRoot = {
          $replaceRoot: {
            newRoot: {
              $mergeObjects: [{ $arrayElemAt: ["$user", 0] }, "$$ROOT"],
            },
          },
        },
        finalProjection = {
          $project: {
            _id: 1,
            title: 1,
            content: 1,
            files: 1,
            createdAt: 1,
            modifiedAt: 1,
            views: 1,
            like: 1,
            comments: 1,
            "userInfo.userId": "$userId",
            "userInfo.nickname": "$basicProfile.nickname",
            "userInfo.profileImage": "$basicProfile.profilePic",
          },
        };
      return await db
        .aggregate([
          sortingStage,
          skipStage,
          limitStage,
          joinStage,
          toRootStage,
          projectionStage,
          userDbJoinStage,
          userProjectionStage,
          userToRoot,
          finalProjection,
        ])
        .toArray();
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 일주일간의 articles을 like순으로 정렬해 popular db에 저장하기
   * $out: aggregation stage의 데이터를 새로운 collection 에 저장해준다.
   * 또한 해당 collection에 데이터가 있을 경우 지우고, 덧씌운다.
   * @param {String} articleType
   * @returns {Promise<void>}
   */
  async function save7daysPopularArticles(articleType) {
    try {
      const db = await getArticleDbByType(articleType),
        outDb = (await getPopularDbByType(articleType)).collectionName,
        now = new Date(new Date().setHours(0, 0, 0, 0)),
        days_ago_7 = new Date(new Date().setHours(-(24 * 7), 0, 0, 0)),
        filtering7dayStage = {
          $match: { createdAt: { $gte: days_ago_7, $lt: now } },
        },
        projectionStage = {
          $project: {
            _id: 1,
            popularity: "$like",
          },
        },
        outStage = { $out: outDb };
      return await db
        .aggregate([filtering7dayStage, projectionStage, outStage])
        .toArray();
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 인기 게시글에서 데이터 지우기
   * @param {String} _id
   * @param {String} articleType
   * @returns {Promise<void>}
   */
  async function deletePopularArticle(_id, articleType) {
    try {
      const db = await getPopularDbByType(articleType),
        query = { _id };
      return db.deleteOne(query);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  /**
   * 해당 타입의 인기 게시글 대량으로 지우기
   * @param {string[]} ids
   * @returns {Promise<void>}
   */
  async function deleteManyPopularArticles(ids, type) {
    try {
      const db = await getPopularDbByType(type),
        query = { _id: { $in: ids } };
      return db.deleteMany(query);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
}
