import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config({ path: "config/.env" });

const jwtHandler = {
  decodeJWT,
  getAccessJWT,
  getRefreshJWT,
};
export { jwtHandler };

const key = process.env.JWT_SECRET_KEY.toString();
const expiresIn = "7d";
const options = {
  audience: "meet front",
  issuer: "meet back",
};

/**
 * decode token
 * @param {Object} token jwt token
 * @returns decoded data
 * @error log & throw
 */
function decodeJWT(token) {
  try {
    const options = {
      ignoreExpiration: true,
    };
    const decoded = jwt.verify(token, key, options);
    return decoded;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

/**
 * generate access token
 * @param {Object} payload data to be encoded to token
 * @returns access token
 * @error log & throw
 */
function getAccessJWT(payload) {
  try {
    let accessOption = { expiresIn: expiresIn, ...options };
    const accessToken = jwt.sign(payload, key, accessOption);
    return accessToken;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

/**
 * generate refresh token
 * @param {Object} payload data to be encoded to token
 * @returns refresh token
 * @error log & throw
 */
function getRefreshJWT(payload) {
  try {
    const refreshToken = jwt.sign(payload, key, options);
    return refreshToken;
  } catch (err) {
    console.log(err);
    throw err;
  }
}
