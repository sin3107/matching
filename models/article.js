export default function buildAticle(generateId, errorMessage){
    return ({
        _id,
        userId,
        title,
        content,
        files =[],
        matchingInfo = {
            matching: undefined,
            userId : undefined
        }
    }) =>{
        // ANCHOR null checking
        const nullErr = new Error();
        if(!userId){
            nullErr.message = errorMessage.nullError.idMissing.message;
            nullErr.code = errorMessage.nullError.idMissing.code;
            throw nullErr;
        }
        if(!title){
            nullErr.message = errorMessage.nullError.titleMissing.message;
            nullErr.code = errorMessage.nullError.titleMissing.code;
            throw nullErr
        }
        if(!content){
            nullErr.message = errorMessage.nullError.contentMissing.message;
            nullErr.code = errorMessage.nullError.contentMissing.code;
            throw nullErr;
        }
        if(matchingInfo.matching === undefined){
            nullErr.message = errorMessage.nullError.matchingInfoWhereMissing.message;
            nullErr.code = errorMessage.nullError.matchingInfoWhereMissing.code;
            throw nullErr;
        }
        if(!matchingInfo.userId){
            nullErr.message = errorMessage.nullError.matchingInfoWhoMissing.message;
            nullErr.code = errorMessage.nullError.matchingInfoWhoMissing.code;
            throw nullErr;
        }
        // ANCHOR type error
        const typeErr = new TypeError();
        if(typeof userId !=="string"){
            typeErr.message = errorMessage.syntaxError.idNotString.message;
            typeErr.code = errorMessage.syntaxError.idNotString.code;
            throw typeErr;
        }
        if(typeof title !== 'string'){
            typeErr.message = errorMessage.syntaxError.titleNotStr.message;
            typeErr.code = errorMessage.syntaxError.titleNotStr.code;
            throw typeErr;
        }
        if(typeof content !=='string'){
            typeErr.message = errorMessage.syntaxError.contentNotStr.message;
            typeErr.code = errorMessage.syntaxError.contentNotStr.code;
            throw typeErr;
        }
        // ANCHOR formating
        if(!_id) _id = generateId();
        return Object.freeze({
            _id: String(_id),
            userId: String(userId),
            createdAt: new Date(),
            modifiedAt: undefined,
            title: String(title),
            content: String(content),
            files: [...files],
            matchingInfo: {
                matching: [...matchingInfo.matching],
                userId: String(matchingInfo.userId)                
            },
            views: 0,
            like: 0,
            comments: 0
        })
    }
}