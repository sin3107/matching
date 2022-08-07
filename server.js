import express from "express";
import { createServer } from "http";
import expressCallback from "./express-callback/index.js";
import { cors, uploadS3 } from "./express-callback/middleware.js";
import {
  passport,
  buildAuthTokenMiddleware,
  initializePassportStrategies,
} from "./express-callback/passport.js";
import {
  postUser,
  postUserLogin,
  getIdentitiesEmail,
  getIdentitiesNickname,
  getAccessToken,
  getPhoneVerificationCode,
  getVerifyPhone,
  getEmailbyPhone,
  postIdentitiesPassword,
  putUserProfile,
  deleteUser,
  putIdentitiesPhone,
  putUserSleep,
  putProfileImage,
  putSetting,
  postExpoToken,
  getMyProfile,
  getUserProfile,
  getReferrerCode,
  getSettings,
  getMyPhoneNumber,
  getPrivacy,
} from "./controllers/user-controller.js";
import {
  postMessage,
  socketMessageRead,
  getConversation,
  getConversationList,
  putConversation,
  socketJoinRooms,
  createConversation,
  socketOnlyRoom,
} from "./controllers/chat-controller.js";
import {
  postMeet,
  getMyGeo,
  getMeetList,
  getHidden,
  getPlaceList,
  getMeetByUser,
  getHiddenTest,
} from "./controllers/meet-controller.js";
import { getLikes, postLike } from "./controllers/like-controller.js";
import { __dirname } from "./helper/file-handler.js";
import { config } from "dotenv";
config({ path: "./config/.env" });
import {
  getBlockList,
  postBlock,
  postUnblock,
} from "./controllers/block-controller.js";
import {
  deleteComment,
  postComment,
  postArticle,
  putComment,
  getArticle,
  getArticles,
  putArticle,
  deleteArticle,
  getMyArticles,
  postArticleLike,
  getCommentList,
  getComment,
  getPopularArticles,
} from "./controllers/article-controller.js";
import { getMateList } from "./controllers/mateList-controller.js";
import {
  getReportCategory,
  postReport,
} from "./controllers/report-controller.js";
import {
  addCoins,
  buyHidden,
  buyMisty,
  buyPackage,
  buyUserDetailProfile,
  getBdayFreeCoin,
  getCoinProductList,
  getEventProductList,
  getFreeCoinList,
  getMyBillLog,
  getMyCoins,
  getMyCoinUsage,
  getMyPass,
  getPackageProductList,
  getServiceCost,
  getUserAccess,
} from "./controllers/payment-controller.js";
import {
  getNoticeList,
  getOneNotice,
  getEventBanner,
} from "./controllers/notice-controller.js";
import { getFaqList, postQna } from "./controllers/cs-controller.js";
import {
  getMySystemMessage,
  getMySystemAlert,
} from "./controllers/systemMessage-controller.js";
import SocketHandler from "./helper/socket-handler.js";

const app = express();
const httpServer = createServer(app);
const io = SocketHandler.setIo(httpServer);

// ANCHOR express setting
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(express.json());
app.use(cors());
app.use(passport.initialize());
initializePassportStrategies();

app.use("/uploads", express.static(`${__dirname}/uploads`));
// NOTE view engine
app.set("view engine", "ejs");
app.use(express.static("views"));

global.__base = __dirname;
// ANCHOR testing
app.get("/", (req, res) => {
  res.send("hi, i'm meet backend.");
});
app.get("/time", (req, res) => {
  res.send(new Date());
});
app.get("/test", (req, res) => {
  res.render("callback.ejs", { message: "test" });
});

app.post("/api/file", uploadS3, (req, res) => {
  const fileArr = req.files.map((f) => f.location);
  res.status(201).send(fileArr);
});

// ANCHOR 가입 & 로그인 관련 api
app.post("/api/users", expressCallback(postUser));
app.post("/api/users/login", expressCallback(postUserLogin));
app.get("/api/identities/email/:email", expressCallback(getIdentitiesEmail));
app.get(
  "/api/identities/nickname/:nickname",
  expressCallback(getIdentitiesNickname)
);
app.get(
  "/api/verification/phone/:phone/db/:db",
  expressCallback(getPhoneVerificationCode)
);
app.get(
  "/api/verification/phone/:phone/code/:code",
  expressCallback(getVerifyPhone)
);
app.get("/api/users/email/phone/:phone", expressCallback(getEmailbyPhone));
app.post("/api/identities/password", expressCallback(postIdentitiesPassword));
// 끝

//ANCHOR 소셜 로그인 관련 api
app.get(
  "/api/users/login/facebook",
  passport.authenticate("facebook", { session: false })
);
app.get(
  "/api/facebook/callback",
  passport.authenticate("facebook", { session: false }),
  (req, res) => {
    res.render("callback.ejs", {
      message: JSON.stringify({ message: req.user }),
    });
  }
);
app.get(
  "/api/users/login/google",
  passport.authenticate("google", { session: false, scope: ["profile"] })
);
app.get(
  "/api/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    res.render("callback.ejs", {
      message: JSON.stringify({ message: req.user }),
    });
  }
);
app.get(
  "/api/users/login/naver",
  passport.authenticate("naver", { session: false })
);
app.get(
  "/api/naver/callback",
  passport.authenticate("naver", { session: false }),
  (req, res) => {
    res.render("callback.ejs", {
      message: JSON.stringify({ message: req.user }),
    });
  }
);
app.get(
  "/api/users/login/kakao",
  passport.authenticate("kakao", { session: false })
);
app.get(
  "/api/kakao/callback",
  passport.authenticate("kakao", { session: false }),
  (req, res) => {
    res.render("callback.ejs", {
      message: JSON.stringify({ message: req.user }),
    });
  }
);
app.get(
  "/api/users/login/apple",
  passport.authenticate("apple", { session: false })
);
app.post(
  "/api/apple/callback",
  passport.authenticate("apple", { session: false }),
  (req, res) => {
    res.render("callback.ejs", {
      message: JSON.stringify({ message: req.user }),
    });
  }
);

// merge Test

// NOTE /api/auth 루트는 전부 다 token 보내야 함
app.use("/api/auth", (req, res, next) => {
  buildAuthTokenMiddleware(req, res, next);
});
// ANCHOR 파일 입출력 API
app.post("/api/auth/file", uploadS3, (req, res) => {
  const fileArr = req.files.map((f) => f.location);
  res.status(201).send(fileArr);
});
// ANCHOR 로그인 후 유저 관련 api
app.get("/api/auth/accesstoken", expressCallback(getAccessToken));
app.get("/api/auth/users/myPhoneNumber", expressCallback(getMyPhoneNumber));
app.get("/api/auth/users/myProfile", expressCallback(getMyProfile));
app.get("/api/auth/users/:userId", expressCallback(getUserProfile));
app.put("/api/auth/users", expressCallback(putUserProfile));
app.delete("/api/auth/users/:id", expressCallback(deleteUser));
app.put("/api/auth/users/:id/profileImage", expressCallback(putProfileImage));
app.put("/api/auth/identities/phone", expressCallback(putIdentitiesPhone));
app.put("/api/auth/users/:id/sleep", expressCallback(putUserSleep));
app.post("/api/auth/users/block", expressCallback(postBlock));
app.post("/api/auth/users/unblock", expressCallback(postUnblock));
app.get("/api/auth/users/:userId/block", expressCallback(getBlockList));
app.get("/api/auth/users/:id/setting", expressCallback(getSettings));
app.put("/api/auth/users/:id/setting", expressCallback(putSetting));
app.post("/api/auth/users/:id/expoToken", expressCallback(postExpoToken));
app.get("/api/auth/users/:id/referrerCode", expressCallback(getReferrerCode));
app.get("/api/auth/users/:id/privacy", expressCallback(getPrivacy));
app.get("/api/auth/systemMessage", expressCallback(getMySystemMessage));
app.get("/api/auth/systemAlert", expressCallback(getMySystemAlert));

// ANCHOR 채팅 api & 소켓
io.of(/^\/\w+$/)
  .use(SocketHandler.wrapper(passport.initialize()))
  .use(SocketHandler.wrapper(passport.authenticate("jwt", { session: false })))
  .on("connection", async (socket) => {
    socket.on("/api/auth/room/join", socketJoinRooms(socket, io));
    socket.on("/api/auth/room/only", socketOnlyRoom(socket, io));
    socket.on("/api/auth/chat/read", socketMessageRead(socket, io));
  });

app.post("/api/auth/conversation", expressCallback(createConversation));
app.post("/api/auth/messages", uploadS3, (req, res, next) => next());
app.post("/api/auth/messages", expressCallback(postMessage));
app.get(
  "/api/auth/users/:userId/conversations",
  expressCallback(getConversationList)
);
app.get(
  "/api/auth/users/:userId/conversations/:conversationId",
  expressCallback(getConversation)
);
app.put(
  "/api/auth/users/:userId/conversations/:conversationId",
  expressCallback(putConversation)
);

// ANCHOR 크로스 및 크로스 친구해요 관련 api
app.post("/api/auth/meet", expressCallback(postMeet));
app.post("/api/auth/likes", expressCallback(postLike));
app.get("/api/auth/users/:userId/likes", expressCallback(getLikes));
app.get("/api/auth/users/:userId/mateList", expressCallback(getMateList));
app.get("/api/auth/meet/myGeo", expressCallback(getMyGeo));
app.get("/api/auth/users/:userId/meetUser", expressCallback(getMeetByUser));
app.get("/api/auth/users/:userId/meet", expressCallback(getMeetList));
app.get("/api/auth/users/:userId/hidden", expressCallback(getHidden));
app.get("/api/auth/users/:userId/place", expressCallback(getPlaceList));

// ANCHOR 소울메이트 게시판 관련 게시글
app.post("/api/auth/articles", expressCallback(postArticle));
app.get("/api/auth/articles", expressCallback(getArticles));
app.get("/api/auth/articles/popular", expressCallback(getPopularArticles));
app.get("/api/auth/users/:userId/articles", expressCallback(getMyArticles));
app.get("/api/auth/articles/:id", expressCallback(getArticle));
app.put("/api/auth/articles/:id", expressCallback(putArticle));
app.delete("/api/auth/articles/:id", expressCallback(deleteArticle));
app.post(
  "/api/auth/articles/:articleId/comments",
  expressCallback(postComment)
);
app.get(
  "/api/auth/articles/:articleId/comments",
  expressCallback(getCommentList)
);
app.get(
  "/api/auth/articles/:articleId/comments/:commentId",
  expressCallback(getComment)
);
app.put(
  "/api/auth/articles/:articleId/comments/:commentId",
  expressCallback(putComment)
);
app.delete(
  "/api/auth/articles/:articleId/comments/:commentId",
  expressCallback(deleteComment)
);
app.post(
  "/api/auth/articles/:articleId/like",
  expressCallback(postArticleLike)
);

// ANCHOR 결제 관련
app.get("/api/auth/payment", expressCallback(getUserAccess));

app.get("/api/auth/coins", expressCallback(getMyCoins));
app.get("/api/auth/coins/log", expressCallback(getMyCoinUsage));
app.post("/api/auth/coins", expressCallback(addCoins));
app.post("/api/auth/packages", expressCallback(buyPackage));
app.get("/api/auth/packages", expressCallback(getMyPass));
app.get("/api/auth/bill/log", expressCallback(getMyBillLog));
app.post(
  "/api/auth/coinshop/detailProfile",
  expressCallback(buyUserDetailProfile)
);
app.post("/api/auth/coinshop/misty", expressCallback(buyMisty));
app.post("/api/auth/coinshop/hidden", expressCallback(buyHidden));
app.get("/api/auth/freeCoins/bday", expressCallback(getBdayFreeCoin));
app.get("/api/auth/services", expressCallback(getServiceCost));
app.get("/api/auth/products/coin", expressCallback(getCoinProductList));
app.get("/api/auth/products/package", expressCallback(getPackageProductList));
app.get("/api/auth/products/event", expressCallback(getEventProductList));
app.get("/api/auth/freecoins", expressCallback(getFreeCoinList));

// ANCHOR notice
app.get("/api/auth/notices", expressCallback(getNoticeList));
app.get("/api/auth/notices/:noticeId", expressCallback(getOneNotice));
app.get("/api/auth/banners", expressCallback(getEventBanner));

// ANCHOR report
app.post("/api/auth/reports", expressCallback(postReport));
app.get("/api/auth/reports/category", expressCallback(getReportCategory));

// ANCHOR QnA
app.post("/api/auth/qna", expressCallback(postQna));

// ANCHOR FAQ
app.get("/api/auth/faqs", expressCallback(getFaqList));

app.get("/api/auth/users/:userId/hiddenTest", expressCallback(getHiddenTest));


//For Test
app.post("/api/test", async (req, res) => {
  try {
    res.send("ok");
  } catch (err) {
    console.log(err);
  }
});

app.post("/api/auth/test", async (req, res) => {
  try {
    res.send("oki");
  } catch (err) {
    console.log(err);
  }
});
// ANCHOR server listening
const PORT = 2001;
httpServer.listen(PORT, () => {
  console.log(`http server is listening on ${PORT}`);
});

export default app;
