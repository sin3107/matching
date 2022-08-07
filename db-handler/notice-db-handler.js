export default function makeNoticeDb(makeDb){
    const limit = 20;
    return Object.freeze({
        getNoticeDb,
        getNoticeList,
        getOneNotice,
        getEventBanner
    })
    /**
     * 공지 db 가져오기
     * @returns {Promise<object>}
     */
    async function getNoticeDb(){
        return (await makeDb()).collection('notice')
    }

    /**
     * 공지사항 리스트 보기
     * @param {Date} createdAt 
     * @returns {Promise<Array>}
     */
    async function getNoticeList(createdAt){
        try {
            const db = await getNoticeDb(),
            query = { createdAt: { $lt: createdAt } },
            projection = { title: 1, content: 1, createdAt: 1, event: 1}

            return db.find(query, {projection})
            .sort({ createdAt: -1 }).limit(limit)
            .toArray()
        } catch (err) {
            console.log(err)
            throw err;
        }
    }
    /**
     * 공지사항 1개 보기
     * @param {String} noticeId 
     * @returns {Promise<object>}
     */
    async function getOneNotice(noticeId){
        try {
            const db = await getNoticeDb(),
            query = { _id: noticeId }
            
            return db.findOne(query)
        } catch (err) {
            console.log(err)
            throw err;
        }
    }

    async function getEventBanner(createdAt){
        try {
            const db = await getNoticeDb(),
            query = {event: { $exists: true}, createdAt: { $lt: createdAt }},
            projection = {files: 1, event: 1}

            let result = await db.find(query, {projection})
            .sort({ createdAt: -1 }).limit(limit)
            .toArray()

            await result.map((row) => {
                row.files = row.files[0]
            })
            return result

        } catch(err) {
            console.log(err)
            throw err
        }
    }
}