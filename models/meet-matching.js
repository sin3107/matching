export default function buildMeetMatching(generateId, errorMessage){
    return({
        _id,
        userId,
        otherUserId,
        timestamp,
        coordinates
    }={}) =>{
        // ANCHOR formating
        if(!_id) _id = generateId();
        
        return Object.freeze({
            _id: String(_id),
            userId: String(userId),
            otherUserId: String(otherUserId),
            timestamp: new Date(timestamp),
            coordinates: [Number(coordinates[0]), Number(coordinates[1])]
        })
    }
}