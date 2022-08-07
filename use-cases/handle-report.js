import { reportDb, userDb } from '../db-handler/index.js'
import errorMessage from '../helper/error.js'
import { generateId } from "../helper/id-generator.js"
import out from '../helper/out.js'
import { valid } from '../helper/utils.js'
import { systemMessage_use_case } from './handle-systemMessage.js';

const report_use_cases = {
    getReportCategory,
    addReport
}

export {
    report_use_cases
}


const result = {
    status: false,
    body: null
}

async function getReportCategory() {
    try {
        const dbResult = await reportDb.getReportCategory()

        if(dbResult) {
            result.status = true
            result.body = out(dbResult)
            return result
        }
        result.status = false
        result.body = {success: false, ...errorMessage.dbError.userNotFound}

        return result

    } catch (err) {
        throw err
    }
}

async function addReport(body) {
    try { 
        const { user: {_id: userId} } = body

        let addModel = {
            reportType: {type: 'num'},
            itemId: {type: 'str'},
            category: {type: 'str'},
            content: {type: 'str'}
        }
        let data = valid(body, addModel)

        let id = generateId()

        let query = {
            _id: id,
            type: 1,
            ...data,
            createdAt: new Date()
        }

        const isUserExist = await userDb.findUserById(userId);
        if(!isUserExist){
            result.status = false;
            result.body = errorMessage.dbError.userNotFound;
            return result;
        }

        
        const savedId = await reportDb.insertReport(query)
        result.status = true;
        result.body = {id: savedId}

        await systemMessage_use_case.addSystemMessage(userId, {type: 0, content: "신고가 접수되었습니다."})

        return result
    } catch(err) {
        result.status = false;
        result.body = err.message;
        return result;
    }
}