export default function buildSystemMessage(generateId){
    return ({
        _id,
        type,
        userId,
        content,
    }) =>{
        if(!_id) _id = generateId();
        return Object.freeze({
            _id: String(_id),
            type: Number(type),
            userId: String(userId),
            content: String(content),
            createdAt: new Date()
        })
    }
}