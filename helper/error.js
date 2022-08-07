const unknownError = {
  message: "알 수 없는 오류가 발생하였습니다",
  code: "000", // NOTE SyntaxError: Octal literals are not allowed in strict mode.
};
// ANCHOR null checking
const emailMissing = {
  message: "이메일은 필수 항목입니다. 이메일을 보내주세요.",
  code: 100,
};
const passwordMissing = {
  message: "비밀번호는 필수 항목입니다. 비밀번호를 보내주세요.",
  code: 101,
};
const jobMissing = {
  message: "직업은 필수 항목입니다. 직업을 보내주세요.",
  code: 102,
};
const introductionMissing = {
  message: "소개는 필수 항목입니다. 소개를 보내주세요.",
  code: 103,
};
const phoneNumberMissing = {
  message: "핸드폰 번호는 필수 항목입니다. 핸드폰 번호를 보내주세요.",
  code: 104,
};
const nicknameMissing = {
  message: "닉네임은 필수 항목입니다. 닉네임을 보내주세요.",
  code: 105,
};
const ageMissing = {
  message: "나이는 필수 항목입니다. 나이를 보내주세요.",
  code: 106,
};
const addressMissing = {
  message: "지역은 필수 항목입니다. 지역을 보내주세요.",
  code: 107,
};
const mainPicMissing = {
  message: "메인 사진은 필수 항목입니다. 메인 사진을 보내주세요.",
  code: 108,
};
const loginInfoMissing = {
  message:
    "이메일 혹은 소셜 로그인 정보는 필수 항목입니다. 이메일 혹은 소셜 로그인 정보를 보내주세요.",
  code: 109,
};
const socialIdMissing = {
  message: "소셜 아이디는 필수 항목입니다. 소셜 아이디를 보내주세요.",
  code: 110,
};
const socialATMissing = {
  message: "소셜 Access Token 필수 항목입니다. Access token을 보내주세요.",
  code: 111,
};
const socialRTMissing = {
  message: "소셜 Refresh token은 필수 항목입니다. Refresh token을 보내주세요.",
  code: 112,
};
const socialTypeMissing = {
  message: "소셜 타입은 필수 항목입니다. 소셜 타입을 보내주세요.",
  code: 113,
};
const idMissing = {
  message: "아이디는 필수 항목입니다. 유저의 아이디를 보내주세요.",
  code: 115,
};
const conversationIdMissing = {
  message: "채팅방 아이디는 필수 항목입니다. 채팅방 아이디를 보내주세요.",
  code: 116,
};
const fromMissing = {
  message: "보낸이는 필수 항목입니다. 보낸이를 보내주세요.",
  code: 117,
};
const toMissing = {
  message: "받는이는 필수 항목입니다. 받는이를 보내주세요.",
  code: 118,
};
const contentTypeMissing = {
  message: "컨텐츠 타입은 필수 항목입니다. 컨텐츠 타입을 보내주세요.",
  code: 119,
};
const contentMissing = {
  message: "컨텐츠는 필수 항목입니다. 컨텐츠를 보내주세요.",
  code: 120,
};
const timestampMissing = {
  message: "타임스탬프는 필수 항목입니다. 타임스탬프를 보내주세요.",
  code: 121,
};
const participantsMissing = {
  message: "채팅방 참가자는 필수 항목입니다. 채팅방 참가자를 보내주세요.",
  code: 122,
};
const genderMissing = {
  message: "성별은 필수 항목입니다. 성별을 보내주세요.",
  code: 123,
};
const coordinatesMissing = {
  message: "좌표는 필수 항목입니다. 좌표를 보내주세요.",
  code: 124,
};
const locationMissing = {
  message: "장소는 필수 항목입니다. 장소를 보내주세요.",
  code: 125,
};
const meetUserIdMissing = {
  message: "크로스 된 유저 아이디는 필수 항목입니다.",
  code: 126,
};
const meetLocationMissing = {
  message: "크로스 된 장소는 필수 항목입니다.",
  code: 127,
};
const meetTimestampMissing = {
  message: "크로스 된 시간은 필수 항목입니다.",
  code: 128,
};
const meetMissing = {
  message: "크로스 정보는 필수 항목입니다.",
  code: 129,
};
const likeFromMissing = {
  message: "누가 좋아하는지는 필수 항목입니다.",
  code: 130,
};
const likeToMissing = {
  message: "누구를 좋아하는지는 필수 항목입니다.",
  code: 131,
};
const profileImageMissing = {
  message: "프로필 이미지로 설정할 이미지는 필수 항목입니다.",
  code: 133,
};
const pictureMissing = {
  message: "사진이 없습니다. 사진을 보내주세요.",
  code: 134,
};
const blockByMissing = {
  message: "누가 차단했는지 알려주세요.",
  code: 135,
};
const blockToMissing = {
  message: "누구를 차단했는지 알려주세요.",
  code: 136,
};
const titleMissing = {
  message: "제목은 필수 항목입니다. 제목을 보내주세요.",
  code: 137,
};
const postIdMissing = {
  message: "게시글 아이디는 필수 항목입니다. 게시글 항목을 보내주세요.",
  code: 138,
};
const commentIdMissing = {
  message: "댓글 아이디는 필수 항목입니다. 댓글 아이디를 보내주세요",
  code: 139,
};
const matchingInfoWhereMissing = {
    message: "크로스에서 만났는지 시크릿 AR에서 만났는지 알려주세요.",
    code: 140,
  },
  matchingInfoWhoMissing = {
    message: "어느 분을 만났는지 닉네임을 적어주세요!",
    code: 141,
  },
  likeImSendMissing = {
    message:
      "보낸 메세지인지 받은 메세지인지 알수 없습니다. Boolean형식으로 보내주세요.",
    code: 142,
  },
  blockFieldMissing = {
    message: "blockBy, blockToPhone, blockToUserId등이 없습니다",
    code: 143,
  };
const hideByMissing = {
  message: "누가 숨김했는지 알려주세요.",
  code: 144,
};
const hideToMissing = {
  message: "누구를 숨김했는지 알려주세요.",
  code: 145,
};
const likeTypeMissing = {
  message: "어디서 친구해요를 보냈는지 알려주세요.",
  code: 146,
};
// ANCHOR format, syntax checking
const meetNotArray = {
  message: "크로스 정보가 어레이가 아닙니다.",
  code: 200,
};
const wrongGeoJson = {
  message: "잘못된 geo json입니다. 위도나 경도를 확인해주세요.",
  code: 201,
};
const idNotString = {
  message: "아이디가 스트링이 아닙니다.",
  code: 202,
};
const coordinatesNotArray = {
  message: "좌표가 어레이가 아니거나, 2개의 멤버를 가지고 있지 않습니다.",
  code: 203,
};
const timestampNotNumber = {
  message: "타임스탬프가 숫자가 아닙니다.",
  code: 204,
};
const likeFromNotStr = {
  message: "누가 좋아하는지가 정확하지 않습니다.",
  code: 205,
};
const likeToNotStr = {
  message: "누구를 좋아하는지가 정확하지 않습니다.",
  code: 206,
};
const timestampNotDate = {
  message: "타임스탬프가 Date가 아닙니다",
  code: 207,
};
const blockByNotStr = {
  message: "차단한 사람의 정보가 문자가 아닙니다.",
  code: 210,
};
const blockToUidNotStr = {
  message: "차단 닫한 사람의 유저 아이디가 문자가 아닙니다.",
  code: 211,
};
const blockToPnoNotStr = {
  message: "차단 당한 사람의 전화번호가 스트링이 아닙니다.",
  code: 212,
};
const titleNotStr = {
  message: "제목이 스트링이 아닙니다",
  code: 213,
};
const contentNotStr = {
    message: "내용이 스트링이 아닙니다.",
    code: 214,
  },
  matchingInfoWherNotBoolean = {
    message: "매칭 정보 - 어디서 만났는지가 Boolean이 아닙니다.",
    code: 215,
  },
  matchingInfoWhoNotStr = {
    message: "매칭 정보 - 누구를 만났는지가 스트링이 아닙니다.",
    code: 216,
  },
  wrongPage = {
    message: "페이지는 1 이상이어야 합니다",
    code: 217,
  },
  filesNotArr = {
    message: "파일이 array가 아닙니다",
    code: 218,
  },
  filesMemberNotStr = {
    message: "파일의 멤버가 스트링이 아닙니다",
    code: 219,
  },
  tooLongMessage = {
    message: "메시지가 너무 깁니다.",
    code: 220,
  },
  ageNotDate = {
    message: "나이가 Date가 아닙니다",
    code: 221,
  },
  matchingNotArr = {
    message: "매칭이 array가 아닙니다",
    code: 222,
  };
// ANCHOR db checking, error handling
const emailExist = {
  message: "이미 가입한 이메일입니다.",
  code: 300,
};
const emailNotFound = {
  message: "가입된 이메일이 아닙니다.",
  code: 301,
};
const idNotFound = {
  message: "아이디를 찾을 수 없습니다.",
  code: 302,
};
const nicknameExist = {
  message: "닉네임이 이미 존재합니다.",
  code: 303,
};
const userNotFound = {
  message: "유저가 존재하지 않습니다.",
  code: 304,
};
const phoneExist = {
  message: "전화번호가 이미 존재합니다.",
  code: 305,
};
const userExist = {
  message: "이미 가입된 유저입니다. 로그인 해주세요.",
  code: 306,
};
const userInsertError = {
  message: "가입하는 데 실패하였습니다. 조금 후 다시 시도해주세요.",
  code: 307,
};
const likeResend = {
  message: "좋아요를 이미 보냈습니다. 7일 후 시도해주세요.",
  code: 308,
};
const postIdNotFound = {
  message: "게시물이 디비에 존재하지 않습니다.",
  code: 309,
};
const commentIdNotFound = {
  message: "댓글이 디비에 존재하지 않습니다.",
  code: 310,
};
const conversationNotFound = {
  message: "채팅방이 디비에 존재하지 않습니다.",
  code: 311,
};
const articleAlreadyLiked = {
  message: "이미 좋아한 게시글입니다.",
  code: 312,
};
const alreadyBlocked = {
    message: "이미 차단한 계정입니다",
    code: 313,
  },
  alreadyLikeMatched = {
    message: "이미 매칭 된 계정입니다. 친구해요를 보낼 수 없습니다",
    code: 314,
  },
  addressChangedTooSoon = {
    message: "주소를 바꾼지 3개월이 지나지 않았습니다. 3개월 뒤에 바꿔주세요",
    code: 315,
  },
  radiosNotFound = {
    message: "반경 설정이 디비에 존재하지 않습니다.",
    code: 316,
  },
  matchingNotFound = {
    message: "매칭된 이력이 없습니다..",
    code: 317,
  }

// ANCHOR login error
const passwordNotMatched = {
  message: "비밀번호가 일치하지 않습니다.",
  code: 403,
};

// ANCHOR token
const noToken = {
  message: "토큰을 찾을 수 없습니다.",
  code: 500,
};
const invalidSignature = {
  message: "유효하지 않은 토큰입니다.",
  code: 501,
};
const tokenExpired = {
  message: "이미 유효기간이 지난 토큰입니다.",
  code: 502,
};
const noUserFound = {
  message: "유저를 찾을 수 없습니다. 유효하지 않은 유저입니다.",
  code: 503,
};
const unAuthorizedUser = {
  message: "토큰을 사용할 수 없는 유저입니다. 관리자에게 문의하세요.",
  cdoe: 504,
};
// ANCHOR Phone Verification Error
const failSavingCode = {
  message: "코드를 저장하는 것에 실패했습니다. 재시도 해주세요.",
  code: 600,
};
const failSendingMsg = {
  message: "메시지를 보내는 것에 실패했습니다. 재시도 해주세요.",
  code: 601,
};
const noPhoneFound = {
  message: "알 수 없는 전화 번호입니다. 코드를 재전송 해 주세요.",
  code: 602,
};
const invalidCode = {
  message: "코드가 유효하지 않습니다. 코드를 재전송 해주세요.",
  code: 603,
};
const invalidPhoneNumber = {
  message: "정확한 핸드폰 번호가 아닙니다. 재입력 해 주세요.",
  code: 604,
};
const invalidPhoneOrCode = {
  message: "핸드폰 번호 혹은 코드가 정확하지 않습니다. 확인해주세요.",
  code: 605,
};
// ANCHOR chat Error
const participantsOver = {
  message: "채팅방은 두 명을 초과할 수 없습니다. 새로 채팅방을 만들어주세요.",
  code: 700,
};
// ANCHOR authorization error
const notAuthorizedUser = {
    message: "권한이 없는 유저입니다.",
    code: 800,
  },
  notMyAccount = {
    message: "본인이 아닙니다. 로그인 정보를 확인해주세요",
    code: 801,
  },
  notActiveAccount = {
    message: "계정을 쓸 수 없습니다. 관리자에게 문의해주세요.",
    code: 802,
  };
// ANCHOR 결제
const productNotFound = {
    message: "찾으려는 상품이 존재하지 않습니다.",
    code: 900,
  },
  payRequire = {
    message: "코인이 부족합니다. 충전해 주세요",
    code: 901,
  },
  duplicatedProduct = {
    message: "해당 상품은 1회만 구입가능합니다.",
    code: 902,
  };
// ANCHOR 지도
const tooFar = {
  message: "너무 멀리 떨어져 있습니다...",
  code: 1000,
};

const error = {
  unknownError: unknownError,
  nullError: {
    emailMissing,
    passwordMissing,
    jobMissing,
    introductionMissing,
    phoneNumberMissing,
    nicknameMissing,
    ageMissing,
    addressMissing,
    mainPicMissing,
    loginInfoMissing,
    socialIdMissing,
    socialATMissing,
    socialRTMissing,
    socialTypeMissing,
    idMissing,
    conversationIdMissing,
    fromMissing,
    toMissing,
    contentMissing,
    contentTypeMissing,
    timestampMissing,
    participantsMissing,
    genderMissing,
    coordinatesMissing,
    locationMissing,
    meetMissing,
    meetUserIdMissing,
    meetLocationMissing,
    meetTimestampMissing,
    likeFromMissing,
    likeToMissing,
    profileImageMissing,
    pictureMissing,
    blockByMissing,
    blockToMissing,
    titleMissing,
    postIdMissing,
    commentIdMissing,
    matchingInfoWhereMissing,
    matchingInfoWhoMissing,
    likeImSendMissing,
    blockFieldMissing,
    hideByMissing,
    hideToMissing,
    likeTypeMissing,
  },
  syntaxError: {
    meetNotArray,
    wrongGeoJson,
    idNotString,
    coordinatesNotArray,
    timestampNotNumber,
    likeFromNotStr,
    likeToNotStr,
    timestampNotDate,
    blockByNotStr,
    blockToUidNotStr,
    blockToPnoNotStr,
    titleNotStr,
    contentNotStr,
    matchingInfoWherNotBoolean,
    matchingInfoWhoNotStr,
    wrongPage,
    filesNotArr,
    filesMemberNotStr,
    tooLongMessage,
    ageNotDate,
    matchingNotArr,
  },
  dbError: {
    emailExist,
    emailNotFound,
    idNotFound,
    nicknameExist,
    userNotFound,
    phoneExist,
    userExist,
    userInsertError,
    likeResend,
    postIdNotFound,
    commentIdNotFound,
    conversationNotFound,
    radiosNotFound,
    matchingNotFound,
    articleAlreadyLiked,
    alreadyBlocked,
    alreadyLikeMatched,
    addressChangedTooSoon
  },
  loginError: {
    passwordNotMatched,
  },
  tokenError: {
    noToken,
    invalidSignature,
    tokenExpired,
    noUserFound,
    unAuthorizedUser,
  },
  phoneError: {
    failSavingCode,
    failSendingMsg,
    noPhoneFound,
    invalidCode,
    invalidPhoneNumber,
    invalidPhoneOrCode,
  },
  chat: {
    participantsOver,
  },
  authorization: {
    notAuthorizedUser,
    notMyAccount,
    notActiveAccount,
  },
  payment: {
    productNotFound,
    payRequire,
    duplicatedProduct,
  },
  mapError: {
    tooFar,
  },
};
export default error;
