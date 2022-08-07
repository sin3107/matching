import { report_use_cases } from "../use-cases/handle-report.js";

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
    getReportCategory,
    postReport
}

async function getReportCategory(httpRequest) {
    try {
        const result = await report_use_cases.getReportCategory()
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

async function postReport(httpRequest){
    try {
        const result = await report_use_cases.addReport(httpRequest.body);
        if(result.status){
            httpResponse.statusCode = created;
            httpResponse.body = result.body;
            return httpResponse;
        } else {
            httpResponse.statusCode = badRequest;
            httpResponse.body = result.body;
            return httpResponse;
        }
    } catch (err) {
        console.log(err);
        httpResponse.statusCode = serverError;
        httpResponse.body = err.message;
        return httpResponse
    }
}