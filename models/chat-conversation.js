export default function buildChatConversation(generateId, errorMessage){
    return ({
        _id,
        participants =[],
        lastMessage = {},
        unread = 0
    })=>{
        //ANCHOR null checking
        if(participants.length < 1){
            let err = new Error();
            err.message = errorMessage.nullError.participantsMissing.message;
            err.code = errorMessage.nullError.participantsMissing.code;
            throw err;
        }
        // ANCHOR 무결성 검사
        if(participants.length > 2){
            let err = new Error();
            err.message = errorMessage.nullError.participantsOver.message;
            err.code = errorMessage.nullError.participantsOver.code;
            throw err;
        }
        // ANCHOR format data
        if(!_id) _id = generateId();
        // ANCHOR return object
        const chatConversation = Object.freeze({
            _id,
            participants,
            lastMessage,
            unread,
            joinedAt: {
                [participants[0]]: new Date(),
                [participants[1]]: new Date()
            }
        });
        return chatConversation;
    }
}