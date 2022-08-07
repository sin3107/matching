export default function buildItemLog(generateId){
    return ({
        _id,
        userId,
        itemId,
        otherUserId,
        useAmount,
    })=> {
        if(!_id) _id = generateId()
        
        return Object.freeze({
            _id: String(_id),
            userId: String(userId),
            timestamp: new Date(),

            // 구매 아이템 내역
            itemId: Number(itemId),
            otherUserId: otherUserId ? String(otherUserId) : null,

            // 0일 경우 패키지, 다른 숫자일 경우 코인
            useAmount: Number(useAmount)
        })
    }
}