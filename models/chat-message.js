export default function buildChatMessage(generateId, errorMessage){
    return ({
        _id,
        conversationId,
        from,
        to,
        contentType,
        content,
    }) => {
        //ANCHOR null checking
        if(!conversationId){
            let err = new Error();
            err.message = errorMessage.nullError.conversationIdMissing.message;
            err.code = errorMessage.nullError.conversationIdMissing.code;
            throw err;
        }
        if(!from){
            let err = new Error();
            err.message = errorMessage.nullError.fromMissing.message;
            err.code = errorMessage.nullError.fromMissing.code;
            throw err;
        }
        if(!to){
            let err = new Error();
            err.message = errorMessage.nullError.toMissing.message;
            err.code = errorMessage.nullError.toMissing.code;
            throw err;
        }
        if(!contentType){
            let err = new Error();
            err.message = errorMessage.nullError.contentTypeMissing.message;
            err.code = errorMessage.nullError.contentTypeMissing.code;
            throw err;
        }
        if(!content){
            let err = new Error();
            err.message = errorMessage.nullError.contentMissing.message;
            err.code = errorMessage.nullError.contentMissing.code;
            throw err;
        }
        // ANCHOR format object
        if(!_id) _id = generateId();
        // ANCHOR return object
        const chatMessage = Object.freeze({
            _id: String(_id),
            conversationId: String(conversationId),
            from: String(from),
            to: String(to),
            contentType: String(contentType),
            content: String(content),
            timestamp: new Date()
        })
        return chatMessage;
    }
}