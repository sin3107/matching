export {
    delay
}
/**
 * 시간 만큼 기다리게 만드는 함수
 * @param {Number} ms 시간
 * @returns {Promise}
 */
function delay(ms){
    return new Promise(resolve => setTimeout(resolve, ms))
}