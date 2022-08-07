export default function buildUser(generateId, generateHash) {
  return ({
    _id,
    phoneNumber,
    email,
    password,
    socialId,
    socialAToken,
    socialRToken,
    socialType,
    nickname,
    gender,
    age,
    fullAddress,
    sido,
    sigungu,
    coordinates,
    job,
    introduction,
    mainPic,
    profilePic,
    pictures = [],
    hashtag = [],
    style = [],
    personality = [],
    hobby = [],
    sports = [],
    height = "",
    bloodType = "",
    MBTI = "",
    religion,
    smoking,
    alcohol,
    marketingOk,
    referrer,
  } = {}) => {
    // ANCHOR Format Data
    if (!_id) _id = generateId();
    const loginInfo = email
      ? {
          email: String(email),
          password: String(password),
        }
      : {
          socialId: String(socialId),
          socialAToken: String(socialAToken),
          socialRToken: socialRToken ? String(socialRToken) : undefined,
          socialType: String(socialType),
        };
    const referrerCode = generateHash(_id);
    // ANCHOR return data
    return Object.freeze({
      _id: String(_id),
      phoneNumber: String(phoneNumber),
      loginInfo: { ...loginInfo },
      basicProfile: {
        profilePic: profilePic ? String(profilePic) : undefined,
        introduction: String(introduction),
        nickname: String(nickname),
        gender: String(gender),
        age: new Date(age),
        job: String(job),
        address: {
          fullAddress: String(fullAddress),
          sido: String(sido),
          sigungu: String(sigungu),
          coordinates: [...coordinates],
          updatedAt: new Date(),
        },
      },
      detailProfile: {
        mainPic: String(mainPic),
        pictures: [...pictures],
        hashtag: [...hashtag],
        style: [...style],
        personality: [...personality],
        hobby: [...hobby],
        sports: [...sports],
        height: height ? String(height) : undefined,
        bloodType: bloodType ? String(bloodType) : undefined,
        MBTI: MBTI ? String(MBTI) : undefined,
        religion: religion ? Number(religion) : undefined,
        smoking: smoking ? Number(smoking) : undefined,
        alcohol: alcohol ? Number(alcohol) : undefined,
      },
      expoToken: undefined,
      referrerCode: String(referrerCode),
      referrer: referrer || undefined,
      meetSetting: {
        alert: undefined,
        gps: undefined,
        privacy: [{ fullAddress: String(fullAddress) }],
        time: [],
        gender: undefined,
        age: { start: 0, end: 100 },
      },
      status: {
        accessToken: true,
        refreshToken: true,
        account: 1,
      },
      log: {
        registeredAt: new Date(),
        termsAndCondition: new Date(),
        personalInfoCollected: new Date(),
        marketingOk: marketingOk,
      },
      coins: 30000,
      pass: [],
    });
  };
}
