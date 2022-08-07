import { chatDb, userDb, meetDb } from "../db-handler/index.js";
import { ChatConversation, ChatMessage } from "../models/index.js";
import { scheduleJob } from "../helper/scheduler.js";
import errorMessage from "../helper/error.js";
import { deleteFile } from "../helper/file-handler.js";
import { expo_handler } from "../helper/expo-handler.js";
import { valid } from "../helper/utils.js";
import { payment_use_case } from "../use-cases/handle-payment.js";
import SocketHandler from "../helper/socket-handler.js";
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
const forbidden = "403";
const serverError = "500";

export {
  postMessage,
  socketMessageRead,
  socketJoinRooms,
  getConversation,
  getConversationList,
  putConversation,
  createConversation,
  socketOnlyRoom,
  deleteOldChat,
  deleteAllConversationByUser,
};
/**
 * get read socket. update db and resend read signal.
 * @param {*} socket
 * @param {*} io
 * @returns function
 * @error log
 */
function socketMessageRead(socket, io) {
  return async ({ conversationId, from }) => {
    await chatDb.readConversation(conversationId);
    SocketHandler.socketEmit({
      of: from,
      url: "/api/auth/chat/read",
      data: conversationId,
    });
  };
}
/**
 * 해당 유저의 모든 conversation에 join 시키기
 * @param {object} socket
 * @param {object} io
 * @returns {Function}
 */
function socketJoinRooms(socket, io) {
  return async ({ userId }) => {
    const conversations = await chatDb.getConversations(userId);
    if (conversations)
      conversations.map((conversation) => socket.join(conversation._id));
  };
}

/**
 * 방 하나에만 연결시키기
 * @param {object} socket
 * @param {object} io
 * @returns {Function}
 */
function socketOnlyRoom(socket, io) {
  return async ({ conversationId }) => {
    // 현재 들어가 있는 룸 다 나오기
    socket.rooms.forEach((room) => socket.leave(room));
    // 한 채팅방에만 연결하기
    socket.join(conversationId);
  };
}

/**
 * 채팅 방 만들기
 * @param {object} httpRequest {otherUserId: string}
 * @returns {Promise<{statusCode: string, body: {conversationId: string}}>}
 */
async function createConversation(httpRequest) {
  try {
    // NOTE 구매 확인? 같은 것 해야 함
    // 1. 채팅 무제한 패키지 같은 것 신청하였는지
    // 2. 했다면 그대로 만들고(로그만 남기고) 아니면 코인 차감
    // 3. 코인이 없다면? 충전? 그럼 다시 만들어야 하나...
    const {
      body: {
        otherUserId,
        user: { _id: myId },
      },
    } = httpRequest;

    // 간단 유효성 체크
    const hasUser = await userDb.findUserById(otherUserId);
    if (!hasUser) {
      httpResponse.statusCode = badRequest;
      httpResponse.body = errorMessage.dbError.userNotFound;
      return httpResponse;
    }

    // 아이템 구매 내역 체크
    const isPaid = await payment_use_case.buyChatItem(myId, otherUserId);
    if (isPaid.status === false) {
      httpResponse.statusCode = badRequest;
      httpResponse.body = isPaid.body;
      return httpResponse;
    }

    // NOTE 이미 있을 경우 conversation id를 돌려주기
    const hasConversation = await chatDb.getConversationByUsers(
      otherUserId,
      myId
    );
    if (hasConversation) {
      httpResponse.statusCode = ok;
      httpResponse.body = { conversationId: hasConversation._id };
      return httpResponse;
    }

    // 없을 경우 만들기
    const participants = [otherUserId, myId],
      conversation = ChatConversation({ participants }),
      conversationId = await chatDb.insertConversation(conversation);
    // 채팅 알림 한다면 새 채팅방이 만들어질때 보내준다
    httpResponse.statusCode = created;
    httpResponse.body = { conversationId };
    return httpResponse;
  } catch (err) {
    console.log(err);
    httpResponse.statusCode = serverError;
    httpResponse.body = err.message;
    return httpResponse;
  }
}
/**
 * Get file request and make message object. Returns the message object
 * @param {Object} httpRequest
 * @returns http response
 * @error log & return error response
 */
async function postMessage(httpRequest) {
  try {
    const {
      body: { conversationId, from, to, content },
      files,
    } = httpRequest;
    // NOTE 파일 핸들링. 현재 여러장 파일 받을 시 content가 무조건 string으로 나오기 때문에 array 저장이 안 됨...
    const filePaths = files && files[0] ? files[0].location : null,
      fileType = files && files[0] ? files[0].mimetype.split("/")[0] : null;
    // 최종 메시지 object 만들기
    const messageObj = ChatMessage({
      conversationId,
      from,
      to,
      contentType: fileType ? fileType : "text",
      content: filePaths ? filePaths : content,
    });
    await chatDb.insertMessage(messageObj, conversationId);
    // NOTE get nickname
    const { nickname, profilePic } = await userDb.getNicknameAndProfileImage(
      from
    );
    // expo or socket sending message
    if (await SocketHandler.isSocketConnected({ of: to, to: conversationId })) {
      SocketHandler.socketEmit({
        of: to,
        to: conversationId,
        url: "/api/auth/messages",
        data: messageObj,
      });
    } else {
      expo_handler.sendNotificationsToSomeUsers({
        userIds: [to],
        message: fileType || content,
        nickname,
      });
    }
    if (await SocketHandler.isSocketConnected({ of: to })) {
      SocketHandler.socketEmit({
        of: to,
        url: "/api/main/chat",
        data: { state: true },
      });
    }
    // conversation lastMessage & unread update{_id: conversation._id}
    await chatDb.updateLastMessage(conversationId, messageObj);
    // return ok
    httpResponse.statusCode = created;
    httpResponse.body = { status: true };
    return httpResponse;
  } catch (err) {
    console.log(err);
    httpResponse.statusCode = serverError;
    httpResponse.body = err.message;
    return httpResponse;
  }
}
/**
 * get user id from param and return all conversation list or null
 * @param {Object} httpRequest
 * @returns {Promise<{statusCode: string, body: object, headers}>} body: array or null
 * @error log & return http response
 */
async function getConversationList(httpRequest) {
  try {
    const {
      body: {
        user: { _id },
      },
      query: { pagination, nickname },
    } = httpRequest;
    const reqModel = {
      _id: { type: "str" },
      pagination: { type: "num", min: 1 },
      nickname: { type: "str", optional: true },
    };
    if (nickname) valid({ _id, pagination, nickname }, reqModel);
    else valid({ _id, pagination }, reqModel);
    const conversations = nickname
      ? await chatDb.getConversationsByNickname(
          _id,
          nickname,
          Number(pagination)
        )
      : await chatDb.getConversations(_id, Number(pagination));
    httpResponse.statusCode = ok;
    httpResponse.body = { conversations };
    return httpResponse;
  } catch (err) {
    console.log(err);
    httpResponse.statusCode = badRequest;
    httpResponse.body = err.message;
    return httpResponse;
  }
}
/**
 * return messages of one conversation
 * @param {Object} httpRequest
 * @returns http response
 * @error log & return http response
 */
async function getConversation(httpRequest) {
  try {
    const {
      params: { conversationId },
      query: { timestamp },
      body: {
        user: { _id: userId },
      },
    } = httpRequest;
    if (!userId) {
      httpResponse.statusCode = badRequest;
      httpResponse.body = errorMessage.nullError.idMissing;
      return httpResponse;
    }
    if (!conversationId) {
      httpResponse.statusCode = badRequest;
      httpResponse.body = errorMessage.nullError.conversationIdMissing;
      return httpResponse;
    }
    const hasConversation = await chatDb.getAConversation(conversationId);
    if (!hasConversation) {
      httpResponse.statusCode = badRequest;
      httpResponse.body = errorMessage.dbError.conversationNotFound;
      return httpResponse;
    }
    if (!hasConversation.participants.includes(userId)) {
      httpResponse.statusCode = badRequest;
      httpResponse.body = errorMessage.dbError.userNotFound;
      return httpResponse;
    }
    if (timestamp && isNaN(new Date(timestamp))) {
      httpResponse.statusCode = badRequest;
      httpResponse.body = errorMessage.syntaxError.timestampNotDate;
      return httpResponse;
    }
    const ts = timestamp || new Date();
    const messages = await chatDb.getMessages({
      userId,
      conversationId,
      timestamp: new Date(ts),
    });
    // TODO best mate?
    httpResponse.statusCode = ok;
    httpResponse.body = { messages };
    return httpResponse;
  } catch (err) {
    console.log(err);
    httpResponse.statusCode = serverError;
    httpResponse.body = err.message;
    return httpResponse;
  }
}
/**
 * 방 떠나기(나가기) 설정
 * 이 날짜부터 새로 joinedAt으로 설정하여 이 전 메시지를 볼 수 없고, 이 이후 메시지만 볼 수 있음
 * @param {object} httpRequest
 * @returns {Promise<{statusCode: string, body: {updated: object}}>}
 */
async function putConversation(httpRequest) {
  try {
    const {
      params: { conversationId },
      body: {
        user: { _id },
      },
    } = httpRequest;
    const updated = await chatDb.updateJoinedAtConversation(
      conversationId,
      _id
    );
    await deleteOldMesages(updated);
    httpResponse.statusCode = ok;
    httpResponse.body = { updated };
    return httpResponse;
  } catch (err) {
    console.log(err);
    httpResponse.statusCode = serverError;
    httpResponse.body = err.message;
    return httpResponse;
  }
}
/**
 * conversation id를 받아 각 멤버의 joinedAt보다 더 오래된 메시지 지우기
 * @param {String} conversationId
 * @returns {Promise<void>}
 */
async function deleteOldMesages({
  _id: conversationId,
  joinedAt: joinedAtObj,
}) {
  /**
   * 1. 넘어온 updated 정보
   * 2. 더 오래 된 joinedAt 날짜 얻기
   * 3. joinedAt보다 오래된 메시지 지우기 (contentType: 'text')
   * 4. joinedAt보다 옛날 메시지 다 찾기
   * 5. 각 메시지 마다 있는 content로 파일 지우기 -> 이거 에러도 대비해야 함. text가 Text로 섞여 들어갔을 수도 있음
   * 6. joinedAt보다 오래된 메시지들 다 지우기
   */
  // joinedAt 순 정렬 후 오래된 날짜 가져오기
  const olderDate = Object.values(joinedAtObj).sort((a, b) =>
    a > b ? 1 : a < b ? -1 : 0
  )[0];
  const oldFileMessages = await chatDb.getOldFileMessages(
    conversationId,
    olderDate
  );
  if (oldFileMessages.length === 0) return;
  // NOTE file 지우기 -> testing 완료
  await Promise.all(oldFileMessages.map(({ content }) => deleteFile(content)));
  // delete old messages
  await chatDb.deleteOldMessages(conversationId, olderDate);
}
const job = scheduleJob("00 12 * * *", deleteOldChat);
/**
 * delete old conversations everyday.
 * @returns nothing. just to stop the function
 */
async function deleteOldChat() {
  try {
    const oldConversations = await chatDb.getOldConversations();
    await Promise.all(
      oldConversations.map(async ({ _id }) => {
        const oldFileMessages = await chatDb.getOldFileMessages(
          _id,
          new Date()
        );
        await Promise.all(
          oldFileMessages.map(({ content }) => deleteFile(content))
        );
        await chatDb.deleteConversationById(_id);
        await chatDb.deleteMessages(_id);
      })
    );
  } catch (err) {
    console.log(err);
  }
}
/**
 * 유저 탈퇴 - 모든 채팅 방 지우기
 * 1. 모든 해당 유저와 관련된 파일 메시지 가져와서 지우기
 * 2. 모든 채팅방 지우기
 * 3. 모든 메시지 지우기
 * 4. conversation 다 지우기
 * @param {String} userId
 * @returns {Promise<void>}
 */
async function deleteAllConversationByUser(userId) {
  try {
    const fileMsgs = await chatDb.getAllFileMessagebyUser(userId);
    fileMsgs.forEach(({ content }) => deleteFile(content));

    await Promise.all([
      chatDb.deleteConversations(userId),
      chatDb.deleteAllMessageByUser(userId),
    ]);
  } catch (err) {
    console.log(err);
    throw err;
  }
}
