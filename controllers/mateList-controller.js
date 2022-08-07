import { mateListDb } from "../db-handler/index.js";
export { getMateList, deleteAllMateListByUser, }

// ANCHOR status code list
const ok = '200';
const created = '201';
const badRequest = '400';
const unauthorized = '401';
const forbidden = '403'
const serverError = '500'
const httpResponse = {
    headers: '',
    statusCode: '',
    body: ''
}

/**
 * 메이트 리스트 받기
 * @param {object} httpRequest 
 * @returns {Promise<object>}
 */
async function getMateList(httpRequest){
    try {
        const {body: {user: {_id}}, query: {timestamp, nickname}} = httpRequest;

        const ts = timestamp ? new Date(timestamp) : new Date()

        const mateList = nickname
        ? await mateListDb.getMateListByNickname(_id, ts, nickname)
        : await mateListDb.getAllMateListByUser(_id, ts)

        const addresssUpdated = mateList.map(({userInfo, _id, ...rest})=>{
            const {address: {sido, sigungu}} = userInfo
            return {
                ...rest,
                userInfo:{
                    ...userInfo,
                    address: sido.includes('도')
                    ? sigungu
                    : sido
                }
            }
        })

        httpResponse.statusCode = ok;
        httpResponse.body = {mateList: addresssUpdated}
        return httpResponse;
    } catch (err) {
        console.log(err)
        httpResponse.statusCode = serverError
        httpResponse.body = err.message
        return httpResponse
    }
}
/**
 * 탈퇴 관련 - 모든 유저 관련 메이트리스트 지우기
 * @param {String} userId 
 * @returns {Promise<void>}
 */
async function deleteAllMateListByUser(userId){
    try {
        await mateListDb.deleteAllMateListByUser(userId);
    } catch (err) {
        console.log(err)
        throw err;
    }
}