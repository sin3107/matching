export default function buildBlock(generateId, errorMessage) {
  return ({ _id, blockBy, blockToUserId, blockToPhone, blockedName }) => {
    // ANCHOR null checking
    const err = new Error();
    if (!blockBy) {
      err.message = errorMessage.nullError.blockByMissing.message;
      err.code = errorMessage.nullError.blockByMissing.code;
      throw err;
    }
    if (!blockToUserId && !blockToPhone) {
      err.message = errorMessage.nullError.blockToMissing.message;
      err.code = errorMessage.nullError.blockToMissing.code;
      throw err;
    }
    //ANCHOR syntax checking
    const syntaxErr = new SyntaxError();
    if (typeof blockBy !== "string") {
      syntaxErr.message = errorMessage.syntaxError.blockByNotStr.message;
      syntaxErr.code = errorMessage.syntaxError.blockByNotStr.code;
      throw syntaxErr;
    }
    if (blockToUserId && typeof blockToUserId !== "string") {
      syntaxErr.message = errorMessage.syntaxError.blockToUidNotStr.message;
      syntaxErr.code = errorMessage.syntaxError.blockToUidNotStr.code;
      throw syntaxErr;
    }
    if (blockToPhone && typeof blockToPhone !== "string") {
      syntaxErr.message = errorMessage.syntaxError.blockToPnoNotStr.message;
      syntaxErr.code = errorMessage.syntaxError.blockToPnoNotStr.code;
      throw syntaxErr;
    }
    //ANCHOR formating
    if (!_id) _id = generateId();

    return Object.freeze({
      _id: String(_id),
      blockBy: String(blockBy),
      blockToUserId: blockToUserId ? String(blockToUserId) : undefined,
      blockToPhone: blockToPhone ? String(blockToPhone) : undefined,
      blockedName: blockedName ? String(blockedName) : undefined,
    });
  };
}
