export default function buldCoinLog(generateId){
    return ({
        _id,
        userId,
        coinAmount,
        type,
        detail
    })=> {
        if(!_id) _id = generateId()
        return Object.freeze({
            _id: String(_id),
            userId: String(userId),
            timestamp: new Date(),
            
            coinAmount: Number(coinAmount),

            type: Number(type),
            detail
        })
    }
}