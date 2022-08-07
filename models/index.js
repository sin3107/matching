import buildUser from "./user.js";
import { generateHash, generateId } from "../helper/id-generator.js";
import errorMessage from '../helper/error.js'
import buildChatMessage from "./chat-message.js";
import buildChatConversation from "./chat-conversation.js";
import buildMeetMatching from "./meet-matching.js";
import buildGeoJson from "./meet-geojson.js";
import buildLike from "./like.js";
import buildBlock from "./block.js";
import buildAticle from "./article.js";
import buildArticleComment from "./article-comment.js";
import buildMateList from "./mateList.js";
import buildMeetRanking from "./meet-ranking.js";
import buildCommunity from "./community.js";
import buildBillLog from "./bill-log.js";
import buildCoinLog from "./coin-log.js";
import buildItemLog from "./item-log.js";
import buildMeetHidden from "./meet-hidden.js";
import buildQna from "./qna.js";
import buildImgCheck from "./img-check.js";
import buildSystemMessage from "./system-message.js"

const User = buildUser(generateId, generateHash);
const ChatMessage = buildChatMessage(generateId, errorMessage);
const ChatConversation = buildChatConversation(generateId, errorMessage);
const GeoJson = buildGeoJson(generateId, errorMessage);
const MeetMatching = buildMeetMatching(generateId, errorMessage);
const Like = buildLike(generateId, errorMessage);
const Block = buildBlock(generateId, errorMessage)
const Article = buildAticle(generateId, errorMessage);
const ArticleComment = buildArticleComment({generateId, errorMessage});
const MateList = buildMateList(generateId)
const MeetRanking = buildMeetRanking(generateId)
const Community = buildCommunity(generateId)
const BillLog = buildBillLog(generateId)
const CoinLog = buildCoinLog(generateId)
const ItemLog = buildItemLog(generateId)
const MeetHidden = buildMeetHidden(generateId)
const Qna = buildQna(generateId)
const ImgCheck = buildImgCheck(generateId)
const SystemMessage = buildSystemMessage(generateId)

export {
    User,
    ChatMessage,
    ChatConversation,
    GeoJson,
    MeetMatching,
    Like,
    Block,
    Article,
    ArticleComment,
    MateList,
    MeetRanking,
    Community,
    BillLog,
    CoinLog,
    ItemLog,
    MeetHidden,
    Qna,
    ImgCheck,
    SystemMessage
};