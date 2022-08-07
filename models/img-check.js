export default function buildImgCheck(generateId){
    return ({
        _id,
        userId,
        pictures,
        insertPic,
        deletePic
    })=> {
        if(!_id) _id = generateId()
        
        return Object.freeze({
            _id: String(_id),
            userId: String(userId),
            pictures: [...pictures],
            insertPic: [...insertPic],
            deletePic: [...deletePic],
            timestamp: new Date()
        })
    }
}