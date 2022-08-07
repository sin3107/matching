export default function makeDeletedUserDb(makeDb){
    return Object.freeze({
        getDb,
        insertDeletedUser,
        findUserByPhoneNumber
    })
    /**
     * 탈퇴 유저 db 가져오기
     * @returns {Promise<object>}
     */
    async function getDb(){
        return (await makeDb()).collection('deletedUser')
    }
    /**
     * 탈퇴 유저 저장하기
     * @param {object} user 
     * @returns {Promise<string>}
     */
    async function insertDeletedUser(user){
        try {
            const db = await getDb(),
            {insertedId} = await db.insertOne(user)
            return insertedId
        } catch (err) {
            console.log(err)
            throw err;
        }
    }
    /**
     * 전화번호로 유저 찾기
     * @param {String} phoneNumber 
     * @returns {Promise<object>}
     */
    async function findUserByPhoneNumber(phoneNumber){
        try {
            const db = await getDb(),
            query = { phoneNumber }
            return db.findOne(query)
        } catch (err) {
            console.log(err)
            throw err;
        }
    }
}