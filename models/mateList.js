export default function buildMateList(generateId){
    return({
        _id,
        users,
        matching= [],
        meetMatchingCount =0
    }) => {
        if(!_id) _id = generateId()
        return Object.freeze({
            _id: String(_id),
            users: [...users],
            matching: [...matching],
            meetMatchingCount: Number(meetMatchingCount),
            timestamp: new Date(),
            status: true
        })
    }
}