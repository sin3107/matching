export default function buildMeetHidden(generateId){
    return({
        _id,
        userId, 
        otherUserId,
        meet,
        spots,
        day_ago,
        date,
    }) => {
        if(!_id) _id = generateId()
        return Object.freeze({
            _id,
            userId: String(userId),
            otherUserId: String(otherUserId),
            meet: Number(meet),
            spots: Number(spots),
            day_ago: Number(day_ago),
            date: new Date(date),
        })
    }
}