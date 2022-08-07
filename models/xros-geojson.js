export default function buildGeoJson(generateId, errorMessage){
    return({
        _id,
        userId,
        coordinates,
        timestamp
    }={}) =>{
        // ANCHOR format data
        if(!_id) _id = generateId();
        if(!timestamp) timestamp = new Date()
        return Object.freeze({
            _id: String(_id),
            userId: String(userId),
            coordinates: [...coordinates],
            timestamp: new Date(timestamp),
        })
    }
}