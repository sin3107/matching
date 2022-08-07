import passport from "passport";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: "config/.env" });
}
import { ExtractJwt, Strategy as JwtStrategy } from "passport-jwt";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as NaverStrategy } from "passport-naver";
import { Strategy as KakaoStrategy } from "passport-kakao";
import { Strategy as AppleStrategy } from "passport-apple";
//import { Strategy as AppleStrategy } from 'passport-appleid';

import { userDb } from "../db-handler/index.js";
import { adminAuthDb } from "../admin/db-handler/index.js";
import errorMessage from "../helper/error.js";
import { user_use_cases } from "../use-cases/handle-user.js";

export { passport, buildAuthTokenMiddleware, initializePassportStrategies };

/**
 * verify jwt token (passport)
 * 그리고 유저 토큰 상태 및 유저 상태 확인한 후 통과 시켜 주기
 * @param {*} payload extracted from jwt
 * @param {*} done callback
 * @returns callback
 */
async function verifyJwt(payload, done) {
  try {
    const { _id } = payload,
      projection = { status: 1 };
    let user = "";

    if (payload.level) {
      user = await await adminAuthDb.findUserById(_id);
      if (!user) {
        return done(null, false, errorMessage.tokenError.noUserFound);
      } else {
        return done(null, user);
      }
    } else {
      user = await userDb.findUserById(_id, projection);

      if (!user) return done(null, false, errorMessage.tokenError.noUserFound);
      else if (
        user.status.accessToken === false ||
        user.status.refreshToken === false
      )
        return done(null, false, errorMessage.tokenError.unAuthorizedUser);
      else if (user.status.account !== 1)
        return done(null, false, errorMessage.authorization.notActiveAccount);
      else return done(null, user);
    }
  } catch (err) {
    return done(err);
  }
}
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET_KEY.toString(),
};
const jwtS = new JwtStrategy(jwtOptions, verifyJwt);

/**
 * authenticate facebook user through passport
 * @param {*} accessToken
 * @param {*} refreshToken
 * @param {*} profile
 * @param {*} done callback
 * @returns callback
 */
async function verifyFacebookUser(accessToken, refreshToken, profile, done) {
  try {
    const socialType = "facebook";
    // find if user exist
    const facebookId = profile.id.toString();
    const user = await userDb.findUserBySocialId(facebookId);
    const { status, body } = await handleSocialLogin(
      user,
      socialType,
      facebookId,
      accessToken,
      refreshToken
    );
    if (status) return done(null, body);
    else return done(null, false, body);
  } catch (err) {
    // if error, return error
    return done(err);
  }
}
const fbOptions = {
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: process.env.FACEBOOK_CALLBACK,
};
const facebook = new FacebookStrategy(fbOptions, verifyFacebookUser);

/**
 * authenticate google user through passport
 * @param {*} accesstoken
 * @param {*} refreshToken
 * @param {*} profile
 * @param {*} done
 * @returns callback
 */
async function verifyGoogleUser(accesstoken, refreshToken, profile, done) {
  try {
    const socialType = "google";
    const googleId = profile.id.toString();
    const user = await userDb.findUserBySocialId(googleId);
    const { status, body } = await handleSocialLogin(
      user,
      socialType,
      googleId,
      accesstoken,
      refreshToken
    );
    if (status) return done(null, body);
    else return done(null, false, body);
  } catch (err) {
    done(err);
  }
}
const googleOptions = {
  clientID: process.env.GOOGLE_APP_ID,
  clientSecret: process.env.GOOGLE_APP_SECERT,
  callbackURL: process.env.GOOGLE_CALLBACK,
};
const google = new GoogleStrategy(googleOptions, verifyGoogleUser);

/**
 * authenticate naver user through passport
 * @param {*} accesstoken
 * @param {*} refreshToken
 * @param {*} profile
 * @param {*} done
 * @returns callback
 */
async function verifyNaverUser(accesstoken, refreshToken, profile, done) {
  try {
    const socialType = "naver";
    const naverId = profile.id.toString();
    const user = await userDb.findUserBySocialId(naverId);
    const { status, body } = await handleSocialLogin(
      user,
      socialType,
      naverId,
      accesstoken,
      refreshToken
    );
    if (status) return done(null, body);
    else return done(null, false, body);
  } catch (error) {
    done(err);
  }
}
const naverOptions = {
  clientID: process.env.NAVER_CLIENT_ID,
  clientSecret: process.env.NAVER_CLIENT_SECRET,
  callbackURL: process.env.NAVER_CALLBACK,
};
const naver = new NaverStrategy(naverOptions, verifyNaverUser);

/**
 * authenticate kakako user through passport
 * @param {*} accesstoken
 * @param {*} refreshToken
 * @param {*} profile
 * @param {*} done
 * @returns
 */
async function verifyKakaoUser(accesstoken, refreshToken, profile, done) {
  try {
    const kakaoId = profile.id.toString();
    const user = await userDb.findUserBySocialId(kakaoId);
    const { body, status } = await handleSocialLogin(
      user,
      "kakao",
      kakaoId,
      accesstoken,
      refreshToken
    );
    if (status) return done(null, body);
    else return done(null, false, body);
  } catch (err) {
    done(err);
  }
}
const kakaoOptions = {
  clientID: process.env.KAKAO_CLIENT_ID,
  clientSecret: process.env.KAKAO_CLIENT_SECRET,
  callbackURL: process.env.KAKAO_CALLBACK,
};
const kakao = new KakaoStrategy(kakaoOptions, verifyKakaoUser);

/**
 * authenticate apple user through passport
 * @param {*} accesstoken
 * @param {*} refreshToken
 * @param {*} profile
 * @param {*} done
 * @returns
 */
async function verifyAppleUser(
  req,
  accessToken,
  refreshToken,
  idToken,
  profile,
  done
) {
  try {
    const appleId = jwt.decode(idToken)["sub"];
    const user = await userDb.findUserBySocialId(appleId);
    const { body, status } = await handleSocialLogin(
      user,
      "apple",
      appleId,
      accessToken,
      refreshToken
    );

    if (status) return done(null, body);
    else return done(null, false, body);
  } catch (err) {
    done(err);
  }
}

const appleOptions = {
  clientID: process.env.APPLE_CLIENT_ID,
  teamID: process.env.APPLE_TEAM_ID,
  callbackURL: process.env.APPLE_CALLBACK,
  keyID: process.env.APPLE_KEY_ID,
  privateKeyString: `-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgEmrDi7hZbqm/Iizd
PysJEoTTmj4s7OHV3hIVB5fFlDegCgYIKoZIzj0DAQehRANCAARR093J/vN/Yfea
jq1aqcl4/Z9JyrrJCb6QYqDjrnBGfBsQ4cfg7Uxnasd6hTJtYjZv+DReWKz7Gwwd
2aEXyYkS
-----END PRIVATE KEY-----`,
  passReqToCallback: true,
};
const apple = new AppleStrategy(appleOptions, verifyAppleUser);

/**
 * authenticate jwt middleware
 * @param {*} req http request
 * @param {*} res http response
 * @param {*} next express middleware
 * @returns
 */
function buildAuthTokenMiddleware(req, res, next) {
  return passport.authenticate(
    "jwt",
    { session: false },
    function (err, user, message) {
      if (err) {
        return res.status(400).send({ message: err });
      }
      if (user) {
        req.body.user = user;
        return next();
      }
      if (message.message === "No auth token") {
        return res.status(401).send(errorMessage.tokenError.noToken);
      }
      if (message.message === "invalid token") {
        return res.status(401).send(errorMessage.tokenError.invalidSignature);
      }
      if (message.message === "jwt expired") {
        return res.status(401).send(errorMessage.tokenError.tokenExpired);
      } else {
        console.log(message);
        return res.status(401).send({ message });
      }
    }
  )(req, res, next);
}

/**
 * initiallize passport strategies
 */
function initializePassportStrategies() {
  passport.use(jwtS);
  passport.use(facebook);
  passport.use(google);
  passport.use(naver);
  passport.use(kakao);
  passport.use(apple);
}

async function handleSocialLogin(
  user,
  socialType,
  socialId,
  accessToken,
  refreshToken
) {
  if (!user)
    return {
      status: true,
      body: {
        type: socialType,
        id: socialId,
        accessToken,
        refreshToken,
        userStatus: false,
      },
    };
  else
    return await user_use_cases.loginSocialUser({
      id: user._id,
      socialType,
      socialId,
    });
}
