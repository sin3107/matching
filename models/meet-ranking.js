export default function buildMeetRanking(generateId){
    return({
        _id,
        userId, 
        otherUserId,
        meet,
        spots,
        meetCount,
        score,
        age,
        gender,
        updatedAt
    }) => {
        if(!_id) _id = generateId()
        return Object.freeze({
            _id,
            userId: String(userId),
            otherUserId: String(otherUserId),
            meet: Number(meet),
            spots: Number(spots),
            meetCount: Number(meetCount),
            score: Number(score),
            age: Number(age),
            gender: String(gender),
            updatedAt
        })
    }
}