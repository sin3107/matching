import bcrypt from "bcrypt";
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  randomFillSync,
  scryptSync,
} from "crypto";
import { config } from "dotenv";

const passwordHandler = { hashPassword, comparePassword };
const cryptoHandler = { encrypt, decrypt };
export { passwordHandler, cryptoHandler };

config({ path: "config/.env" });
const saltRounds = 10,
  algorithm = process.env.CRYPTO_ALGORITHM,
  password = process.env.CRYPTO_PASSWORD,
  salt = process.env.CRYPTO_SALT;
const key = scryptSync(password, salt, 24),
  ivString = process.env.CRYPTO_IV;

/**
 * make password to hash
 * @param String plainPassword
 * @returns hash password
 * @error log & throw
 */
async function hashPassword(plainPassword) {
  try {
    const hashPassword = await bcrypt.hash(plainPassword, saltRounds);
    return hashPassword;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

/**
 * compare plain password and hash password if it's match
 * @param {String} plainPassword
 * @param {String} hashPassword
 * @returns true or false
 * @error log & throw
 */
async function comparePassword(plainPassword, hashPassword) {
  try {
    const match = await bcrypt.compare(plainPassword, hashPassword);
    return match;
  } catch (err) {
    console.log(err);
    throw err;
  }
}
function encrypt(data) {
  try {
    const iv = Buffer.from(ivString, "hex");
    const cipher = createCipheriv(algorithm, Buffer.from(key), iv);
    const encrypted = cipher.update(data);
    const finalized = Buffer.concat([encrypted, cipher.final()]);
    return finalized.toString("hex");
  } catch (err) {
    console.log(err);
    throw err;
  }
}
function decrypt(data) {
  try {
    const iv = Buffer.from(ivString, "hex"),
      encrypted = Buffer.from(data, "hex");
    const decipher = createDecipheriv(algorithm, Buffer.from(key), iv);
    const decrypted = decipher.update(encrypted);
    const finalizedDecrypted = Buffer.concat([decrypted, decipher.final()]);
    return finalizedDecrypted.toString();
  } catch (err) {
    console.log(err);
    throw err;
  }
}
