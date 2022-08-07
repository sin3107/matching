export default function buildLike(generateId, errorMessage){
    return ({
        _id,
        likeFrom,
        likeTo,
        type,
    })=>{
        // ANCHOR null checking
        let err = new Error();
        if(!likeFrom){
            err.message = errorMessage.nullError.likeFromMissing.message;
            err.code = errorMessage.nullError.likeFromMissing.code
            throw err;
        }
        if(!likeTo){
            err.message = errorMessage.nullError.likeToMissing.message;
            err.code = errorMessage.nullError.likeToMissing.code
            throw err;
        }
        // ANCHOR syntax checking
        let typeErr = new TypeError();
        if(typeof likeFrom !== "string" || likeFrom.length < 2){
            typeErr.message = errorMessage.syntaxError.likeFromNotStr.message;
            typeErr.code = errorMessage.syntaxError.likeFromNotStr.code;
            throw typeErr;
        }
        if(typeof likeTo !=="string" || likeTo.length < 2){
            typeErr.message = errorMessage.syntaxError.likeToNotStr.message;
            typeErr.code = errorMessage.syntaxError.likeToNotStr.code;
            throw typeErr;
        }
        if(!_id) _id = generateId();
        return Object.freeze({
            _id: String(_id),
            likeFrom: String(likeFrom),
            likeTo: String(likeTo),
            timestamp: new Date(),
            type: Number(type)
        })
    }
}