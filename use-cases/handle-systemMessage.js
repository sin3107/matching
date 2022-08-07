import {
  userDb,
  systemMessageDb,
  chatDb,
  likeDb,
} from "../db-handler/index.js";
import errorMessage from "../helper/error.js";
import out from "../helper/out.js";
import { SystemMessage } from "../models/index.js";
import { valid } from "../helper/utils.js";

const result = {
  status: false,
  body: "",
};
export const systemMessage_use_case = {
  getMySystemMessage,
  getMySystemAlert,
  addSystemMessage,
  deleteMySystemMessage,
};

async function getMySystemMessage(id, createdAt) {
  try {
    const hasUser = await userDb.findUserById(id);
    if (!hasUser) {
      result.status = false;
      result.body = errorMessage.dbError.userNotFound;
      return result;
    }

    if (createdAt && isNaN(new Date(createdAt))) {
      result.status = false;
      result.body = errorMessage.syntaxError.timestampNotDate;
      return result;
    }
    const ct = createdAt ? new Date(createdAt) : new Date();

    const dbResult = await systemMessageDb.getSystemMessage(id, ct);

    result.status = true;
    result.body = out(dbResult);
    return result;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

async function getMySystemAlert(id) {
  try {
    const hasUser = await userDb.findUserById(id);
    if (!hasUser) {
      result.status = false;
      result.body = errorMessage.dbError.userNotFound;
      return result;
    }

    const chat = await chatDb.getMyUnreadChat(id);
    const like = await likeDb.findLikeToMe(id);
    const mate = false;
    const noti = 0;

    result.status = true;
    result.body = out({ chat, like, mate, noti });
    return result;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

async function addSystemMessage(userId, body) {
  try {
    const reqModel = {
      type: { type: "num" },
      content: { type: "str" },
    };

    valid(body, reqModel);
    let query = SystemMessage({ userId, ...body });
    let dbResult = await systemMessageDb.insertSystemMessage(query);

    if (dbResult.insertedId) {
      result.status = true;
      result.body = out({ insertedId: dbResult.insertedId });
      return result;
    }

    result.status = false;
    result.body = out({ insertedId: dbResult.insertedId });
    return result;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

async function deleteMySystemMessage(id, userId) {
  try {
    let dbResult = await systemMessageDb.deleteSystemMessage(id, userId);

    if (dbResult.deletedCount > 0) {
      result.status = true;
      result.body = out({ deletedCount: dbResult.deletedCount });
      return result;
    }
    result.status = false;
    result.body = { success: false, ...errorMessage.dbError.userNotFound };
    return result;
  } catch (err) {
    console.log(err);
    throw err;
  }
}
