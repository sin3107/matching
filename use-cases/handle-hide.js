import { hideDb, userDb, meetDb } from "../db-handler";
import errorMessage from "../helper/error.js";
import { generateId } from "../helper/id-generator";

const hide_use_case = {
  addHide,
  unHide,
};
const result = {
  status: false,
  body: null,
};
export { hide_use_case };

async function addHide({ hideBy, hideUserId }) {
  try {
    if (!hideBy) {
      result.status = false;
      result.body = errorMessage.nullError.hideByMissing;
      return result;
    }
    if (!hideUserId) {
      result.status = false;
      result.body = errorMessage.nullError.hideToMissing;
      return result;
    }
    const byUser = await userDb.findUserById(hideBy);
    const toUser = await userDb.findUserById(hideUserId);
    if (!byUser || !toUser) {
      result.status = false;
      result.body = errorMessage.dbError.userNotFound;
      return result;
    }
    const alreadyHide = await hideDb.isUser1HideUser2(hideBy, hideUserId);
    if (!alreadyHide) {
      await hideDb.insertHide({ _id: generateId(), hideBy, hideUserId });
      await meetDb.updateRankings(
        { userId: hideBy, otherUserId: hideUserId },
        { $set: { hide: true } }
      );
      result.status = true;
      result.body = null;
      return result;
    }
  } catch (err) {
    console.log(err);
    throw err;
  }
}

async function unHide({ hideBy, hideUserId }) {
  try {
    if (!hideBy) {
      result.status = false;
      result.body = errorMessage.nullError.hideByMissing;
      return result;
    }
    if (!hideUserId) {
      result.status = false;
      result.body = errorMessage.nullError.hideToMissing;
      return result;
    }
    const byUser = await userDb.findUserById(hideBy);
    const toUser = await userDb.findUserById(hideUserId);
    if (!byUser || !toUser) {
      result.status = false;
      result.body = errorMessage.dbError.userNotFound;
      return result;
    }
    const hide = await hideDb.isUser1HideUser2(hideBy, hideUserId);
    if (hide) {
      await meetDb.updateRankings(
        { userId: hideBy },
        { $set: { hide: false } }
      );
      await hideDb.unHideUserId(hideBy, hideUserId);
      result.status = true;
      result.body = null;
      return result;
    }
  } catch (err) {
    console.log(err);
    throw err;
  }
}
