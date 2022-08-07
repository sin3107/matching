export default function buildCommunity(generateId){
    return ({
        _id, 
        userId,
        title,
        content,
        files
    }) => {
        if(!_id) _id = generateId()
        return Object.freeze({
            _id: String(_id),
            userId: String(userId),
            title: String(title),
            content: String(content),
            files: files? [...files] : [],
            createdAt: new Date(),
            modifiedAt: undefined,
            views: 0,
            like: 0,
            comments: 0
        })
    }
}