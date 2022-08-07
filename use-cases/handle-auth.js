import errorMessage from '../helper/error.js';
import {deletedUserDb, userDb} from '../db-handler/index.js'
import {jwtHandler} from "../helper/jwt-handler.js";
import {sms} from '../helper/sms-handler.js';
import { caching } from "../helper/cache-data-handler.js";
import { cryptoHandler } from '../helper/crypto.js';

const auth_use_cases = {
    generateNewAccessToken,
    sendPhoneVerificationCode,
    verifyPhoneCode
}
export {
    auth_use_cases
}
const result = {
    status: false,
    body: ''
}
/**
 * verify old access code and generate new access token
 * @param {Object} body 
 * @returns token or error message
 * @error log & throw 
 */
async function generateNewAccessToken (body){
    try {
        const {accessToken: oldAccess, refreshToken: oldRefresh} = body;
        if(!oldAccess || !oldRefresh){
            result.status = false;
            result.body = errorMessage.tokenError.noToken;
            return result;
        }
        const refreshPayload = jwtHandler.decodeJWT(oldRefresh)
        // decode access token even it's expired 
        const accessPayload = jwtHandler.decodeJWT(oldAccess);
        // verify if they have same id
        if(refreshPayload._id !== accessPayload._id){
            result.status = false;
            result.body = errorMessage.tokenError.invalidSignature;
            return result;
        }
        // verify if they have same iat
        if(refreshPayload.iat !== accessPayload.iat){
            result.status = false;
            result.body = errorMessage.tokenError.invalidSignature;
            return result;
        }
        // verify if the iat is yesterday or whatever
        const accessNumericDate = parseInt(accessPayload.iat) * 1000
        const todayNumericDate = Date.now()
        const dayLength = todayNumericDate - accessNumericDate;
        
        const one_day = parseInt('86400000')
        const tokenLifespan = one_day * 7;

        if(dayLength > tokenLifespan){
            result.status = false;
            result.body = errorMessage.tokenError.invalidSignature;
            return result;
        }
        // verify if user exists
        const {_id} = refreshPayload;
        const projection = {status: true}
        const user = await userDb.findUserById(_id, projection)
        if(!user){
            result.status = false;
            result.body = errorMessage.tokenError.noUserFound;
            return result;
        }
        // verify user is whitelisted from db
        if(!user.status.accessToken || !user.status.refreshToken){
            result.status = false;
            result.body = errorMessage.tokenError.unAuthorizedUser
            return result;
        }
        // if they are all okay, get new access token and refresh token together
        const payload = {
            _id : user._id
        }
        const newAccess = jwtHandler.getAccessJWT(payload);
        const newRefresh = jwtHandler.getRefreshJWT(payload);
        // return tokens
        if(newAccess && newRefresh){
            result.status = true;
            result.body ={ accessToken: newAccess, refreshToken: newRefresh}
            return result;
        }
        // or else try to send error message
        result.status = false;
        result.body = errorMessage.unknownError;
        return result;
    } catch (err) {
        console.log(err)
        throw err;
    }
}
/**
 * get phone number and send verification code. 
 * @param {String} phone 
 * @param {Number} dbExistOk 
 * @returns nothing or error message
 * @error log & throw 
 */
async function sendPhoneVerificationCode(phone, dbExistOk){
    try {
        // phone number check
        if(phone.length !== 11){
            result.status= false;
            result.body = errorMessage.phoneError.invalidPhoneNumber;
            return result;
        }
        // check phone number in db (because it costs money when sending sms)
        const phoneEncrypted = cryptoHandler.encrypt(phone)
        const isPhoneExist1 = await userDb.findUserByPhoneNumber(phoneEncrypted),
        isPhoneExist2 = await deletedUserDb.findUserByPhoneNumber(phoneEncrypted)
        if((isPhoneExist1 || isPhoneExist2) && !dbExistOk){
            result.status = false;
            result.body = errorMessage.dbError.phoneExist;
            return result;
        }
        // generate 6 digit of code
        const code = Math.floor(100000 + Math.random() * 900000)
        // store the phone and code together to memory
        await caching.saveData(phone, code);
        // send sms
        const smsSent = await sms.sendSMS(phone, code); //NOTE 한 가지 중요한건 만약 유저가 존재하지 않는 번호를 했을때 이건... 500으로 갈거란 말이지...
        if(smsSent){
            result.status =true;
            result.body = ''
            return result;
        }
        result.status = false;
        result.body = errorMessage.phoneError.failSendingMsg;
        return result;
    } catch (err) {
        console.log(err)
        throw err;
    }
}
/**
 * get phone number and code. verify code. return http response body
 * @param {string} phone 
 * @param {string} code 
 * @returns nothing or error message
 * @error log & throw 
 */
async function verifyPhoneCode (phone, code){
    try {
        // check the syntax
        const isPhoneNumber = Number.isSafeInteger(Number(phone));
        const isCodeNumber = Number.isSafeInteger(Number(code));
        if(phone.length !== 11 || code.length !== 6 || !isPhoneNumber || !isCodeNumber){
            result.status = false;
            result.body = errorMessage.phoneError.invalidPhoneOrCode;
            return result;
        }
        // get cached data from memory
        const cacheData = await caching.getData(phone);
        // if key is not found
        if(!cacheData){
            result.status = false;
            result.body = errorMessage.phoneError.noPhoneFound
            return result;
        }
        // if key is found, code is correct
        if(code === cacheData.toString()){
            result.status = true;
            result.body = ''
            return result;
        }
        // or else
        result.status = false;
        result.body = errorMessage.phoneError.invalidCode
        return result;

    } catch (err) {
        console.log(err)
        throw err;
    }
}