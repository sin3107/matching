import { noticeDb } from "../db-handler/index.js";

export {
    getNoticeList,
    getOneNotice,
    getEventBanner
}

const httpResponse = {
    headers: '',
    statusCode: '',
    body: ''
}
// ANCHOR status code list
const ok = '200';
const created = '201';
const badRequest = '400';
const unauthorized = '401';
const serverError = '500';

/**
 * 공지사항 리스트 받기
 * @param {object} httpRequest 
 * @returns {Promise<object>}
 */
async function getNoticeList(httpRequest){
    try {
        const { query: { createdAt } } = httpRequest;
        const ts = createdAt ? new Date(createdAt) : new Date()
        const list = await noticeDb.getNoticeList(ts);

        // content 양 줄이기
        const shortList = list.map(({content, ...rest}) => {
            return {
                ...rest,
                content: content.substring(-1, 50)
            }
        })

        httpResponse.statusCode = ok;
        httpResponse.body = { list: shortList };
        return httpResponse;
    } catch (err) {
        console.log(err)
        httpResponse.statusCode = serverError;
        httpResponse.body = err.message;
        return httpResponse;
    }
}

/**
 * 공지 1개 보기
 * @param {object} httpRequest 
 * @returns {Promise<object>}
 */
async function getOneNotice(httpRequest){
    try {
        const { params: { noticeId } } = httpRequest;
        const notice = await noticeDb.getOneNotice(noticeId);

        httpResponse.statusCode = ok;
        httpResponse.body = { notice };
        return httpResponse;
    } catch (err) {
        console.log(err)
        httpResponse.statusCode = serverError;
        httpResponse.body = err.message;
        return httpResponse;
    }
}

/**
 * 이벤트 배너 출력
 * @param {object} httpRequest 
 * @returns {Promise<object>}
 */
 async function getEventBanner(httpRequest){
    try {
        const { query: { createdAt } } = httpRequest;
        const ts = createdAt ? new Date(createdAt) : new Date()
        const list = await noticeDb.getEventBanner(ts);

        httpResponse.statusCode = ok;
        httpResponse.body = { list: list };
        return httpResponse;
    } catch (err) {
        console.log(err)
        httpResponse.statusCode = serverError;
        httpResponse.body = err.message;
        return httpResponse;
    }
}