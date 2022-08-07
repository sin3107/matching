import { systemMessage_use_case } from "../use-cases/handle-systemMessage.js";

const httpResponse = {
    headers: '',
    statusCode: '',
    body: ''
}


const ok = '200';
const created = '201';
const badRequest = '400';
const unauthorized = '401';
const serverError = '500'

export { 
    getMySystemMessage,
    getMySystemAlert
}

async function getMySystemMessage(httpRequest) {
    try {
        const {body: {user: {_id}}, query: {createdAt}} = httpRequest
        const result = await systemMessage_use_case.getMySystemMessage(_id, createdAt)
        if(result.status) {
            httpResponse.statusCode = ok
            httpResponse.body = result.body
            return httpResponse
        } else {
            httpResponse.statusCode = badRequest
            httpResponse.body = result.body
            return httpResponse
        }
    } catch (err) {
        console.log(err)
        httpResponse.statusCode = serverError
        httpResponse.body = err.message
        return httpResponse
    }
}

async function getMySystemAlert(httpRequest) {
    try {
        const {body: {user: {_id}}} = httpRequest
        const result = await systemMessage_use_case.getMySystemAlert(_id)
        if(result.status) {
            httpResponse.statusCode = ok
            httpResponse.body = result.body
            return httpResponse
        } else {
            httpResponse.statusCode = badRequest
            httpResponse.body = result.body
            return httpResponse
        }
    } catch (err) {
        console.log(err)
        httpResponse.statusCode = serverError
        httpResponse.body = err.message
        return httpResponse
    }
}