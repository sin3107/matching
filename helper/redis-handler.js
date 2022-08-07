import { createClient } from 'redis'
import { meetDb } from '../db-handler/index.js'
import { generateId } from '../helper/id-generator.js';

export {
    redis_handler
}

const client = createClient({url:'redis://meetredis-001.2opurd.0001.apn2.cache.amazonaws.com:6379'}),
redis_handler = makeRedisDb()

function makeRedisDb(){
    return Object.freeze({
        getGroupRadius,
        getUserRadius,
        connectRedis,
        upsertGroupToList,
        insertUserToGroup,
        getAllGroupList,
        getAllUserInGroup,
        getCoordinates,
        getOneCloseGroup,
        findCloseUsers,
        deleteUserGroups,
        deleteGroupList,
        insertMatching,
        getMatchingList,
        deletMatchingList,
        insertBlocks,
        getAllBlockByUser,
        deleteBlocks,
        deleteAllDataInRedis,
    })
    /**
    * connect to redis
    * @returns {object}
    */
   async function connectRedis(){
       if(!client.isOpen)
       await client.connect()
       return client;
   }
    /**
     * 군집의 반경 얻기
     * @returns {Promise<{radius: string, unit: string}>}
     */
    async function getGroupRadius(){
        const groupRadios = await meetDb.getRadios('groupRadios')

        if(!groupRadios) {
            const _id = generateId()
            await meetDb.insertRadios({_id: _id, key: 'groupRadios', value: '10'})
        }
        let value = groupRadios ? groupRadios.value : 10

        return {
            radius: parseInt(value),
            unit: 'km'
        }
    }
    /**
     * 유저의 크로스 반경 얻기
     * @returns {Promise<{radius: string, unit: string}>}
     */
    async function getUserRadius(){
        const meetRadios = await meetDb.getRadios('meetRadios')

        if(!meetRadios) {
            const _id = generateId()
            await meetDb.insertRadios({_id: _id, key: 'meetRadios', value: '1'})
        }
        let value = meetRadios ? meetRadios.value : 1


        return {
            radius: parseInt(value),
            unit: 'km'
        }
    }
    // ANCHOR 군집 저장 및 거리 계산
    /**
     * 군집에 추가하기
     * @param {String} groupKey
     * @param {String} groupId 
     * @returns {Promise<Number>}
     */
    async function upsertGroupToList(groupKey, [long, lat], groupId){
        await connectRedis();
        return client.geoAdd(groupKey, {
            longitude: long,
            latitude: lat,
            member: String(groupId)
        })
    }
    /**
     * add geo info to 군집
     * @param {String} groupId 
     * @param {String} userId 
     * @returns {Promise<Number}
     */
    async function insertUserToGroup([long, lat], groupId, userId){
        await connectRedis();
        return client.geoAdd(groupId, {
            longitude: long,
            latitude: lat,
            member: userId
        })
    }
    /**
     * 군집 리스트 전부 가져오기
     * @param {String} groupKey
     * @returns {Promise<[String]>}
     */
    async function getAllGroupList(groupKey){
        await connectRedis();
        return client.zRange(groupKey, 0, -1)
    }
    /**
     * 군집 내 모든 유저 가져오기
     * @param {String} groupId 
     * @returns {Promise<[String]>}
     */
    async function getAllUserInGroup(groupId){
        await connectRedis();
        return client.zRange(groupId, 0, -1)
    }
    /**
     * 해당 멤버의 좌표 얻기(number & array 변환되어)
     * @param {String} key 대상 key
     * @param {String} member 대상 멤버
     * @returns {Promise<[Number, Number]>} [long, lat]
     */
    async function getCoordinates(key, member){
        await connectRedis();
        // NOTE 이거 없는거면 null 뜨는데 그런거 destruct 하면 에러 뜸
        const res = (await client.geoPos(key, member))[0]
        if(!res) return null;
        const {longitude, latitude} = res;
        return [Number(longitude), Number(latitude)]
    }
    /**
     * 가장 가까운 군집 1개 찾기 - group id return
     * @param {String} groupKey
     * @returns {Promise<String>} group id
     */
    async function getOneCloseGroup(groupKey, [long, lat]){
        await connectRedis();
        const {radius, unit} = await getGroupRadius()
        return (await client.sendCommand(['GEORADIUS', `${groupKey}`, `${long}`, `${lat}`, radius, unit]))[0]
    }
    /**
     * 군집 내에서 가까운 유저들 찾아주기
     * @param {String} groupId 
     * @param {String} userId 
     * @returns {Promise<[string]>} user id array
     */
    async function findCloseUsers(groupId, userId){
        await connectRedis();
        const {radius, unit} = await getUserRadius();
        return client.sendCommand(['GEORADIUSBYMEMBER', `${groupId}`, `${userId}`, radius, unit])
    }
    /**
     * 모든 군집 지우기
     * @param {String} groupKey
     */
    async function deleteUserGroups(groupKey){
        await connectRedis();
        const groupArr = await getAllGroupList(groupKey);
        await Promise.all(groupArr.map(g => client.del(g)))
    }
    /**
     * 군집 리스트 지우기
     * @param {String} groupKey
     * @returns {Promise<>}
     */
    async function deleteGroupList(groupKey){
        await connectRedis();
        return client.del(groupKey)
    }
    // ANCHOR 매칭 정보
    /**
     * 매칭 정보 레디스에 저장하기 - JSON stringify
     * @param {String} matchingKey
     * @param {String} userId 
     * @param {String} otherUserId 
     * @param {[Number, Number]} otherCoordinates 
     * @returns {Promise}
     */
    async function insertMatching(matchingKey, userId, otherUserId, otherCoordinates){
        await connectRedis();
        return client.lPush(matchingKey, JSON.stringify({
            userId,
            otherUserId,
            coordinates: otherCoordinates
        }))
    }
    /**
     * JSON stringify 된 매칭 정보 array
     * @param {String} matchingKey
     * @returns {Promise<[String]>}
     */
    async function getMatchingList(matchingKey){
        await connectRedis();
        return client.lRange(matchingKey, 0, -1)
    }
    /**
     * 매칭 리스트 지우기
     * @param {String} matchingKey
     * @returns {Promise}
     */
    async function deletMatchingList(matchingKey){
        await connectRedis();
        return client.del(matchingKey)
    }
    // ANCHOR 차단 관련 레디스
    /**
     * 차단 유저 array를 전부 레디스에 저장하기.
     * @param {[{blockBy: string, blockTo: string}]} blocks 
     * @returns {Promise}
     */
    async function insertBlocks(blocks){
        await connectRedis();
        await Promise.all(blocks.map(async({blockBy, blockTo})=>{
            await client.lPush(blockBy, blockTo)
            await client.lPush(blockTo, blockBy)
        }))
        blocks.length =0;
    }
    /**
     * 유저의 모든 차단 정보 넘기기
     * @param {String} userId 
     * @returns {Promise<[string]>}
     */
    async function getAllBlockByUser(userId){
        await connectRedis();
        return client.lRange(userId, 0, -1)
    }
    /**
     * 레디스에 저장 된 차단 정보 전부 지우기
     * @param {[{blockBy: string, blockTo: string}]} blocks 
     * @returns {Promise}
     */
    async function deleteBlocks(blocks){
        await connectRedis();
        await Promise.all(blocks.map(async({blockBy, blockTo})=>{
            await client.del(blockBy)
            await client.del(blockTo)
        }))
        blocks.length = 0;
    }
    async function deleteAllDataInRedis(){
        try {
            await connectRedis();
            const keys = await client.keys('*')
            await Promise.all(keys.map(key => client.del(key)))
        } catch (err) {
            console.log(err)
            throw err;
        }
    }
}