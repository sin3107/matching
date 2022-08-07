export default function buildBillLog(generateId){
    return ({
        _id,
        userId,
        price,
        productId,
        productType,
        productDetail = null,
    })=> {
        if(!_id) _id = generateId()
        
        return Object.freeze({
            _id: String(_id),
            userId: String(userId),
            timestamp: new Date(),

            price: Number(price),
            error: true,

            // 코인 혹은 패키지 상품 id
            productId: String(productId),
            // 패키지의 경우 items 구별이 필요하기 때문에 detail 필요
            productDetail: productDetail 
            ? Number(productDetail)
            : null,

            // NOTE 코인인지 패키지인지 구분하기
            productType: Number(productType),

            // TODO 나중에 구글 및 애플 인앱 결제에 맞게 변화시키기
            paymentInfo: {}
        })
    }
}