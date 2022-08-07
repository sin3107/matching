import {
  blockDb,
  chatDb,
  likeDb,
  mateListDb,
  userDb,
  meetDb,
} from "../db-handler/index.js";
import { Block } from "../models/index.js";
import errorMessage from "../helper/error.js";
import { cryptoHandler } from "../helper/crypto.js";
import { deleteFile } from "../helper/file-handler.js";
import { valid } from "../helper/utils.js";

const block_use_case = {
  addBlock,
  unblock,
  getBlockList,
  deleteAllBlockByUser,
};
const result = {
  status: false,
  body: null,
};
export { block_use_case };
/**
 * get block by and block to, add block and delete all record betweent two user
 * @param {Array} blocks {blockBy, blockToPhone, blockToUserId}
 * @returns {Promise<{status: boolean: body: null}>} or error message
 * @error log & return
 */
async function addBlock(blocks) {
  try {
    // 에러 확인하기
    const failed = [];
    const checkErrors = await Promise.all(
      blocks.map(async (block) => {
        const { blockBy, blockToPhone, blockToUserId, blockedName } = block;
        if (!blockBy || (!blockToPhone && !blockToUserId)) {
          failed.push({ err: errorMessage.nullError.blockFieldMissing, block });
          return;
        }
        const hasUser = await userDb.findUserById(blockBy);
        if (!hasUser) {
          failed.push({ err: errorMessage.nullError.blockByMissing, block });
          return;
        }
        if (blockToUserId) {
          const isUserExist = await userDb.findUserById(blockToUserId);
          if (!isUserExist) {
            failed.push({ err: errorMessage.nullError.blockToMissing, block });
            return;
          }
        }
        // NOTE 이미 차단한 상대인지 확인
        // NOTE 이미 차단한 유저를 또 유저 차단으로 차단할 리는 없지만 혹시나 해서 확인
        if (blockToUserId) {
          const hasBlocked = await blockDb.getBlockToUser(
            blockBy,
            blockToUserId
          );
          if (hasBlocked) {
            failed.push({ err: errorMessage.dbError.alreadyBlocked, block });
            return;
          }
        }
        const phoneEncrypted = blockToPhone
          ? cryptoHandler.encrypt(blockToPhone)
          : undefined;
        // NOTE 이미 지인 차단한 유저를 또 지인 차단할 경우 막기
        // NOTE 이미 유저 차단한 유저를 지인 차단 할 경우, 생성 가능하게 해 주기 ->
        // 이 경우 똑같은 유저를 2번 차단하게 되어 크로스에서 차단 거를 때 오버헤드가 될 수도 있음
        // 이 경우 똑같은 유저를 2번 차단하여도 각각 지인 차단과 유저 차단을 했기 때문에 각각의 리스트에 똑같은 유저가 들어가게 되고,
        // 각각의 차단을 풀어줘야 한다. 유저 차단만 풀었다 해서 지인 차단이 풀리지 않는다.
        if (blockToPhone) {
          const hasBlocked = await blockDb.getBlockToPhone(
            blockBy,
            phoneEncrypted
          );
          if (hasBlocked) {
            failed.push({ err: errorMessage.dbError.alreadyBlocked, block });
            return;
          }
        }
        return block;
      })
    );
    const filtered = checkErrors.filter((x) => x);

    // 차단하기
    await Promise.all(
      filtered.map(async ({ blockToPhone, blockedName, ...rest }) => {
        let blockToUserId;
        // 데이터 추가하기
        const phoneEncrypted = blockToPhone
          ? cryptoHandler.encrypt(blockToPhone)
          : undefined;
        if (blockToPhone) {
          // NOTE 해당 전화번호의 유저가 존재할 경우 유저 아이디 추가해주기
          const isUserExist = await userDb.findUserByPhoneNumber(
            phoneEncrypted
          );
          blockToUserId = isUserExist ? isUserExist._id : undefined;
        }
        const block = Block({
          blockToPhone: phoneEncrypted,
          blockToUserId,
          blockedName,
          ...rest,
        });
        await blockDb.insertBlock(block);
        // NOTE 차단 후 관련 정보 다 지우기
        const { blockBy, blockToUserId: userId } = block;
        if (userId) {
          // 크로스 기록, 친구해요 기록, 채팅, 메이트 지우기
          await deleteMeet(blockBy, userId);
          await deleteLike(blockBy, userId);
          await deleteChat(blockBy, userId);
          await deleteMateList(blockBy, userId);
        }
      })
    );
    if (failed.length > 0) {
      result.status = false;
      result.body = { failed };
      return result;
    } else {
      result.status = true;
      result.body = null;
      return result;
    }
  } catch (err) {
    console.log(err);
    throw err;
  }
}
/**
 * get block by and block to, unblock block
 * @param {Object} {blockBy, blockToUserId, blockToPhone}
 * @returns {Promise<{status: boolean, body: null}>} or error message
 * @error log & throw
 */
async function unblock(blocks) {
  try {
    const failed = [];
    const errorChecked = await Promise.all(
      blocks.map(async (block) => {
        const { blockBy, blockToUserId, blockToPhone } = block;
        if (!blockBy || (!blockToUserId && !blockToPhone)) {
          failed.push({ err: errorMessage.nullError.blockFieldMissing, block });
          return;
        }
        return block;
      })
    );
    const filtered = errorChecked.filter((x) => x);
    await Promise.all(
      filtered.map(async ({ blockBy, blockToUserId, blockToPhone }) => {
        if (blockToUserId) {
          await blockDb.unBlockUserId(blockBy, blockToUserId);
          await mateListDb.setMateListStatusTrue(blockBy, blockToUserId);
        }
        if (blockToPhone) {
          const phoneEncrypted = cryptoHandler.encrypt(blockToPhone);
          await blockDb.unBlockPhone(blockBy, phoneEncrypted);
        }
      })
    );
    if (failed.length > 0) {
      result.status = false;
      result.body = { failed };
    }
    result.status = true;
    result.body = {};
    return result;
  } catch (err) {
    console.log(err);
    throw err;
  }
}
/**
 * 유저 탈퇴로 차단 정보 지우기
 * 1. 유저 차단은 전부 지우기
 * 2. 지인 차단의 경우 -> userId만 지우기
 * @param {String} userId
 * @returns {Promise<void>}
 */
async function deleteAllBlockByUser(userId) {
  try {
    await Promise.all([
      blockDb.deleteManyBlock(userId),
      blockDb.deleteUserIdFromBlockToPhone(userId),
    ]);
  } catch (err) {
    console.log(err);
    throw err;
  }
}
/**
 * get user id and return all user information that the user has been blocked
 * @param {String} blockBy block by user id
 * @param {String} type
 * @param {String} pagination
 * @returns {Promise<{status: boolean, body: {blockUserList: Array, blockPhoneList: Array}}>}
 * @error log & throw
 */
async function getBlockList(blockBy, type, pagination) {
  try {
    const reqModel = {
      blockBy: { type: "str" },
      type: { type: "str" },
      pagination: { type: "num", min: 1 },
    };
    valid({ blockBy, type, pagination }, reqModel);
    // 유저 차단
    if (type === "user") {
      const blockUserList = await blockDb.getBlockToUserList(
        blockBy,
        Number(pagination)
      );
      result.status = true;
      result.body = { blockUserList };
      return result;
    }
    // 지인 차단
    else if (type === "phoneNumber") {
      const blocks = await blockDb.getBlockToPhoneList(blockBy, pagination),
        blockToPhoneList = blocks.map(({ blockToPhone, blockedName }) => ({
          phone: cryptoHandler.decrypt(blockToPhone),
          name: blockedName,
        }));
      result.status = true;
      result.body = { blockToPhoneList };
      return result;
    }
  } catch (err) {
    console.log(err);
    throw err;
  }
}
/**
 * 크로스 기록 지우기
 * 랭킹 기록 지우기
 * @param {String} userId1 userId
 * @param {String} userId2 userId
 * @return {Promise<void>}
 * @error log & throw
 */
async function deleteMeet(userId1, userId2) {
  try {
    await Promise.all([
      meetDb.deleteMeetMatchingBetweenUsers(userId1, userId2),
      meetDb.deleteRankingBetweenUser(userId1, userId2),
    ]);
  } catch (err) {
    console.log(err);
    throw err;
  }
}
/**
 * delete 친구해요
 * @param {String} userId1 user id
 * @param {String} userId2 user id
 * @return {Promise<void>}
 * @error log & throw
 */
async function deleteLike(userId1, userId2) {
  try {
    await likeDb.deletLikeBetweenUser(userId1, userId2);
  } catch (err) {
    console.log(err);
    throw err;
  }
}
/**
 * 채팅방 및 채팅 기록 지우기
 * @param {String} userId1 blockBy
 * @param {String} userId2 blockTo
 * @return {Promise<void>}
 * @error log & throw
 */
async function deleteChat(userId1, userId2) {
  try {
    const conversation = await chatDb.getConversationByUsers(userId1, userId2);
    if (!conversation) return;
    // 파일들 지우기
    const { _id } = conversation;
    const oldFiles = await chatDb.getOldFileMessages(_id, new Date());
    await Promise.all(oldFiles.map(({ content }) => deleteFile(content)));
    await chatDb.deleteConversationById(_id);
    await chatDb.deleteMessages(_id);
  } catch (err) {
    console.log(err);
    throw err;
  }
}
/**
 * mate 지우지 않고 status: false 로 하기
 * @param {String} userId1
 * @param {String} userId2
 * @returns {Promise<void>}
 */
async function deleteMateList(userId1, userId2) {
  try {
    return mateListDb.setStatusFalse(userId1, userId2);
  } catch (err) {
    console.log(err);
    throw err;
  }
}
