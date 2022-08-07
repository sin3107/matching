import { cs_use_case } from "../use-cases/handle-cs.js";

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

export {
    getFaqList,
    postQna
}
/**
 * add article and return id
 * @param {object} httpRequest 
 * @returns {Promise<{statusCode: string, body: {id: string}}>}
 * @error log & return
 */
async function getFaqList(httpRequest){
    try {
        const {query: {createdAt, type}} = httpRequest;
        const result = await cs_use_case.getFaqList(createdAt, type);
        if(result.status){
            httpResponse.statusCode = ok;
            httpResponse.body = result.body;
            return httpResponse;
        }

        httpResponse.statusCode = badRequest;
        httpResponse.body = result.body;
        return httpResponse;

    } catch (err) {
        console.log(err);
        httpResponse.statusCode = serverError;
        httpResponse.body = err.message;
        return httpResponse
    }
}

async function postQna(httpRequest){
    try{
        const result = await cs_use_case.addQna(httpRequest.body);
        if(result.status){
            httpResponse.statusCode = ok;
            httpResponse.body = result.body;
            return httpResponse;
        }

        httpResponse.statusCode = badRequest;
        httpResponse.body = result.body;
        return httpResponse;
    } catch(err) {
        console.log(err);
        httpResponse.statusCode = serverError;
        httpResponse.body = err.message;
        return httpResponse
    }
}