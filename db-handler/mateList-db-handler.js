export default function makeMateListDb(makeDb){
    // global vairable
    const limit = 10

    return Object.freeze({
        getMateListDb,
        insertMateList,
        incMeetMatchingCount,
        addMeetMatching,
        addCommunityMatching,
        getMeetMatchingCount,
        getMateList,
        findMatching,
        getAllMateListByUser,
        setStatusFalse,
        deleteAllMateListByUser,
        setMateListStatusTrue,
        getMateListByNickname,
    })
    /**
     * return mateList db
     * @returns {Promise<object>}
     */
    async function getMateListDb(){
        try {
            const db = await makeDb();
            return db.collection('mateList')
        } catch (err) {
            console.log(err)
            throw err;
        }
    }
    /**
     * get mate list and inset one
     * @param {object} mateList 
     * @returns {Promise<string>}
     * @error log & throw
     */
    async function insertMateList(mateList){
        try {
            const db = await getMateListDb(),
            {insertedId} = await db.insertOne(mateList);
            return insertedId;
        } catch (err) {
            console.log(err)
            throw err;
        }
    }
    /**
     * inc meet matching count between two user
     * @param {String} user1 
     * @param {String} user2 
     * @returns {Promise<object>}
     * $upsert 쓸 수도 있지만 찾는 쿼리가 $all이 들어 있어서 몽고에서 에러를 일으킴.
     * 한 번 찾고 inc() 하는 것 추천
     */
    async function incMeetMatchingCount(user1, user2){
        try {
            const db = await getMateListDb(),
            query = {users: {$all: [user1, user2]}, status: true},
            update = {$inc: {meetMatchingCount: 1}},
            option = {returnDocument: 'after'},
            {value} = await db.findOneAndUpdate(query, update, option)
            return value;
        } catch (err) {
            console.log(err)
            throw err;
        }
    }
    /**
     * add meet matching betweenn two user.
     * @param {String} user1 
     * @param {String} user2 
     * @returns {Promise<object>}
     * @error log & throw
     */
    async function addMeetMatching(user1, user2){
        try {
            const db = await getMateListDb(),
            query = {users: {$all: [user1, user2]}, status: true},
            update = {$addToSet: {matching: 'meet'}},
            option = {returnDocument: "after"},
            {value} = await db.findOneAndUpdate(query, update, option)
            return value
        } catch (err) {
            console.log(err)
            throw err;
        }
    }
    /**
     * get two user and add community matching
     * @param {String} user1 
     * @param {String} user2 
     * @returns {Promise<object>}
     */
    async function addCommunityMatching(user1, user2){
        try {
            const db = await getMateListDb(),
            query = {users: {$all: [user1, user2]}, status: true},
            update = {$addToSet: {matching: 'community'}},
            option = {returnDocument: "after"},
            {value} = await db.findOneAndUpdate(query, update, option)
            return value
        } catch (err) {
            console.log(err)
            throw err;
        }
    }
    /**
     * get meet matching count between two users
     * @param {String} user1 
     * @param {String} user2 
     * @returns {Promise<Number>}
     */
    async function getMeetMatchingCount(user1, user2){
        try {
            const db = await getMateListDb(),
            query = {users: {$all: [user1, user2]}, status: true},
            projection = {meetMatchingCount: 1},
            doc = await db.findOne(query, {projection})
            if(!doc) return undefined;
            return doc.meetMatchingCount;
        } catch (err) {
            console.log(err)
            throw err;
        }
    }
    /**
     * get mate list between two users
     * @param {String} user1 
     * @param {String} user2 
     * @returns {Promise<object>}
     */
    async function getMateList(user1, user2){
        try {
            const db = await getMateListDb(),
            query = {users: {$all: [user1, user2]}, status: true}
            return db.findOne(query);
        } catch (err) {
            console.log(err)
            throw err;
        }
    }
    /**
     * 두 유저 사이에 크로스나 커뮤 등 아무 매칭 된 결과 값이 있는지 찾기
     * @param {String} user1 
     * @param {String} user2 
     * @returns {Promise<object}
     */
    async function findMatching(user1, user2){
        try {
            const db = await getMateListDb(),
            query = {users: {$all : [user1, user2]}, 'matching.0': {$exists: true}, status: true}
            return db.findOne(query)
        } catch (err) {
            console.log(err)
            throw err;
        }
    }
    /**
     * get all mate list by one user(only matched one)
     * @param {String} userId 
     * @param {Date} timestamp
     * @returns {Promise<Array>}
     * @error log & throw
     */
    async function getAllMateListByUser(userId, timestamp){
        try {
            const db = await getMateListDb(),
            filteringStage = { $match: { users: userId, 'matching.0': {$exists: true}, timestamp: {$lt: timestamp}, status: true } },
            sortStage = { $sort: { timestamp: -1 } },
            limitStage = { $limit: limit },
            joinStage = {
                $lookup: {
                    from: 'user',
                    localField: "users",
                    foreignField: "_id",
                    as: 'user'
                }
            },
            removeIdStage = {
                $project: { _id: 0 }
            },
            filteringMyIdStage = {
                $project: {
                    matching: 1,
                    timestamp: 1,
                    user: {
                        $filter: {
                            input: "$user",
                            as: "user",
                            cond: { $ne: [ "$$user._id", userId ] }
                        }
                    }
                }
            },
            userProjectionStage = {
                $project: {
                    matching: 1,
                    timestamp: 1,
                    'user._id': 1,
                    'user.basicProfile.nickname': 1,
                    'user.basicProfile.profilePic': 1,
                    'user.basicProfile.address': 1,
                    'user.basicProfile.age': 1,
                    'user.basicProfile.gender': 1
                }
            },
            userToRoot = {
                $replaceRoot: { newRoot: { $mergeObjects: [ { $arrayElemAt: [ '$user', 0 ] }, '$$ROOT' ] } }
            },
            finalProjection = {
                $project: {
                    matching: 1,
                    timestamp: 1,
                    'userInfo.userId': '$_id',
                    'userInfo.nickname': '$basicProfile.nickname',
                    'userInfo.profileImage': "$basicProfile.profilePic",
                    'userInfo.address': "$basicProfile.address",
                    'userInfo.age': "$basicProfile.age",
                    'userInfo.gender': '$basicProfile.gender'
                }
            }
            return db.aggregate([
                filteringStage,
                sortStage,
                limitStage,
                joinStage,
                removeIdStage,
                filteringMyIdStage,
                userProjectionStage,
                userToRoot,
                finalProjection
            ]).toArray()
        } catch (err) {
            console.log(err)
            throw err;
        }
    }
    /**
     * 닉네임으로 검색하기
     * @param {String} userId 
     * @param {Date} timestamp 
     * @param {String} nickname 
     * @returns {Promise<Array>}
     */
    async function getMateListByNickname(userId, timestamp, nickname){
        try {
            const db = await getMateListDb(),
            filteringStage = { $match: { users: userId, 'matching.0': {$exists: true}, timestamp: {$lt: timestamp}, status: true } },
            joinStage = {
                $lookup: {
                    from: 'user',
                    localField: "users",
                    foreignField: "_id",
                    as: 'user'
                }
            },
            removeIdStage = {
                $project: { _id: 0 }
            },
            filteringMyIdStage = {
                $project: {
                    matching: 1,
                    timestamp: 1,
                    user: {
                        $filter: {
                            input: "$user",
                            as: "user",
                            cond: { $ne: [ "$$user._id", userId ] }
                        }
                    }
                }
            },
            findNicknameRegexStage = {
                $match: { 'user.basicProfile.nickname': { $regex: nickname, $options: 'i' } }
            },
            userProjectionStage = {
                $project: {
                    matching: 1,
                    timestamp: 1,
                    'user._id': 1,
                    'user.basicProfile.nickname': 1,
                    'user.basicProfile.profilePic': 1,
                    'user.basicProfile.address': 1,
                    'user.basicProfile.age': 1,
                    'user.basicProfile.gender': 1
                }
            },
            userToRoot = {
                $replaceRoot: { newRoot: { $mergeObjects: [ { $arrayElemAt: [ '$user', 0 ] }, '$$ROOT' ] } }
            },
            finalProjection = {
                $project: {
                    matching: 1,
                    timestamp: 1,
                    'userInfo.userId': '$_id',
                    'userInfo.nickname': '$basicProfile.nickname',
                    'userInfo.profileImage': "$basicProfile.profilePic",
                    'userInfo.address': "$basicProfile.address",
                    'userInfo.age': "$basicProfile.age",
                    'userInfo.gender': '$basicProfile.gender'
                }
            },
            sortStage = { $sort: { timestamp: -1 } },
            limitStage = { $limit: limit }
            return db.aggregate([
                filteringStage,
                joinStage,
                removeIdStage,
                filteringMyIdStage,
                findNicknameRegexStage,
                userProjectionStage,
                userToRoot,
                finalProjection,
                sortStage,
                limitStage
            ]).toArray()
        } catch (err) {
            console.log(err)
            throw err;
        }
    }
    /**
     * status: false로 만들기
     * @param {String} user1 
     * @param {String} user2 
     * @returns {Promise<void>}
     */
    async function setStatusFalse(user1, user2){
        try {
            const db = await getMateListDb(),
            query = {users: {$all: [user1, user2]}},
            update = { $set: { status: false }}
            return db.updateOne(query, update)
        } catch (err) {
            console.log(err)
            throw err;
        }
    }
    /**
     * delete all mate list by one user
     * @param {String} userId 
     * @returns {Promise<void>}
     */
    async function deleteAllMateListByUser(userId){
        try {
            const db = await getMateListDb(),
            query = {users: userId}
            return db.deleteMany(query);
        } catch (err) {
            console.log(err)
            throw err;
        }
    }
    /**
     * 차단 되어 status:false 되었던 것 다시 status: true 하기
     * @param {String} user1 
     * @param {String} user2 
     * @returns {Promise<void>}
     */
    async function setMateListStatusTrue(user1, user2){
        try {
            const db = await getMateListDb(),
            query = { users: { $all: [ user1, user2 ] } },
            update = { $set: { status: true } }
            return db.updateOne(query, update)
        } catch (err) {
            console.log(err)
            throw err;
        }
    }
}