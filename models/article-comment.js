export default function buildArticleComment({generateId, errorMessage}){
    return ({
        _id,
        userId,
        content
    })=>{
        //ANCHOR null checking
        const nullErr = new Error();
        if(!userId) {
            nullErr.message = errorMessage.nullError.idMissing.message;
            nullErr.code = errorMessage.nullError.idMissing.code;
            throw nullErr;
        }
        if(!content){
            nullErr.message = errorMessage.nullError.contentMissing.message;
            nullErr.code = errorMessage.nullError.contentMissing.code;
            throw nullErr
        }
        // ANCHOR format data
        if(!_id) _id= generateId();
        // ANCHOR return object
        return Object.freeze({
            _id: String(_id),
            userId: String(userId),
            content: String(content),
            createdAt : new Date(),
            modifiedAt: undefined
        });
    }
}