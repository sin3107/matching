import { generateId } from "../helper/id-generator.js";

export default function makeStatisticDb(makeDb){
    return Object.freeze({
        getUserStatisticDb,
        findToday,
        findTodayList,
        findTodayAge,
        initUserCount,
        insertUserCount,
        updateUserCount,
        insertUserCountByGender,
        updateUserCountByGender,
        insertUserCountByAge,
        updateUserCountByAge,
        updateUserCountByAgeNull,
        findAccessToday,
        insertAccessCount,
        updateAccessCount,
        initAccessCount,
        getAccessCountByWeek,
        getAccessCountByMonth,
        getAccessCountByYear,
        getAccessUserById,
        deleteTodayAccessUser
    })    

    async function getUserStatisticDb(){
        return (await makeDb()).collection('userStatistic')
    }

    async function getAccessStatisticDb(){
        return (await makeDb()).collection('accessStatistic')
    }

    async function getAccessUserDb(){
        return (await makeDb()).collection('accessUser')
    }

    async function findToday(day, type) {
        try {
            const db = await getUserStatisticDb()
            return await db.findOne({day: day, type: type})
        } catch(err) {
            console.log(err)
            throw err
        }
    }

    async function findTodayList(day) {
        try {
            const db = await getUserStatisticDb()
            return await db.find({day: day}).toArray()
        } catch(err) {
            console.log(err)
            throw err
        }
    }

    async function findTodayAge(day, type, age) {
        try {
            let ag = 'count.'+age
            const db = await getUserStatisticDb()
            return await db.findOne({day: day, type: type, [ag]: { $exists: true }})
        } catch(err) {
            console.log(err)
            throw err
        }
    }

    async function initUserCount(initData) {
        try {
            const _id = generateId()
            initData['_id'] = String(_id)
            const db = await getUserStatisticDb()
            await db.insertOne(initData)

        } catch(err) {
            console.log(err)
            throw err
        }
    }

    async function insertUserCount(year, month, day, type) {
        try {
            const _id = generateId()
            const db = await getUserStatisticDb()
            await db.insertOne({_id: String(_id), type: type, count: 1, day :day, month: month, year: year})

        } catch(err) {
            console.log(err)
            throw err
        }
    }

    async function updateUserCount(day, type) {
        try {
            const db = await getUserStatisticDb()
            await db.updateOne({day :day, type: type}, {$inc: {count:1}})

        } catch(err) {
            console.log(err)
            throw err
        }
    }

    async function insertUserCountByGender(year, month, day, type, gender) {
        try {
            const _id = generateId()
            let man = 0
            let woman = 0

            if(gender === "men") men=+1
            else woman=+1

            const db = await getUserStatisticDb()
            await db.insertOne({_id: String(_id), type: type, count: {woman: woman, man: man}, day :day, month: month, year: year})

        } catch(err) {
            console.log(err)
            throw err
        }
    }

    async function updateUserCountByGender(day, type, gender) {
        try {
            let gen = 'count.'+gender
            const db = await getUserStatisticDb()
            await db.updateOne({day :day, type: type}, {$inc: { [gen] :1}})
        } catch(err) {
            console.log(err)
            throw err
        }
    }


    async function insertUserCountByAge(year, month, day, type, age) {
        try {
            const _id = generateId()

            const db = await getUserStatisticDb()
            await db.insertOne({_id: String(_id), type: type, count: {[age] : 1}, day :day, month: month, year: year})

        } catch(err) {
            console.log(err)
            throw err
        }
    }

    async function updateUserCountByAge(day, type, age) {
        try {
            let ag = 'count.'+age
            const db = await getUserStatisticDb()
            await db.updateOne({day :day, type: type}, {$inc: { [ag] :1}})
        } catch(err) {
            console.log(err)
            throw err
        }
    }

    async function updateUserCountByAgeNull(day, type, age) {
        try {
            const db = await getUserStatisticDb()
            await db.updateOne({day :day, type: type}, {$set: {count : age}})
        } catch(err) {
            console.log(err)
            throw err
        }
    }

////////////////////////////////////////////////

    async function findAccessToday(query) {
        try {
            const db = await getAccessStatisticDb()
            return await db.findOne(query)
        } catch(err) {
            console.log(err)
            throw err
        }
    }

    async function updateAccessCount(query, update) {
        try {
            const db = await getAccessStatisticDb()
            return await db.updateOne(query, update)
        } catch(err) {
            console.log(err)
            throw err
        }
    }

    async function insertAccessCount(query) {
        try {
            const _id = generateId()
            query['_id'] = _id
            const db = await getAccessStatisticDb()
            return await db.insertOne(query)
        } catch(err) {
            console.log(err)
            throw err
        }
    }

    async function initAccessCount(day) {
        try {
            const _id = generateId()
            const db = await getAccessStatisticDb()
            await db.insertOne({_id: _id, type: 0, count: 0, date: day})
        } catch(err) {
            console.log(err)
            throw err
        }
    }

    // 주 별
    async function getAccessCountByWeek() {
        try {
            const db = await getAccessStatisticDb()
            return await db.find({type: 0}).sort({date: -1}).limit(7).toArray()
        } catch(err) {
            console.log(err)
            throw err
        }
    }

    
    // 월 별
    async function getAccessCountByMonth(month) {
        try {
            const db = await getAccessStatisticDb()
            return await db.find({type: 0, date: {$regex : `^${month}`}}).sort({date: -1}).toArray()
        } catch(err) {
            console.log(err)
            throw err
        }
    }

    // 년도 별
    async function getAccessCountByYear(year) {
        try {
            const db = await getAccessStatisticDb()
            return await db.find({type: 2, date: {$regex : `^${year}`}}).sort({date: -1}).toArray()
        } catch(err) {
            console.log(err)
            throw err
        }
    }


    // 접근자 내역
    async function getAccessUserById(userId) {
        try {
            const db = await getAccessUserDb()
            return await db.findOne({userId: userId})
        } catch(err) {
            console.log(err)
            throw err
        }
    }

    async function deleteTodayAccessUser() {
        try {
            const db = await getAccessUserDb()
            await db.deleteMany({})
        } catch(err) {
            console.log(err)
            throw err
        }
    }

}