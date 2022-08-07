import NodeCache from "node-cache";

export const caching ={
    saveData,
    getData
}
const time = 60*3;
const cache = new NodeCache({stdTTL: time});
/**
 * save in node cache
 * @param {String} key 
 * @param {String} data 
 * @returns true or throw error
 * @error log & throw
 */
async function saveData(key, data){
    try {
        const time = 60*3;
        cache.del(key);
        const cacheSuccess = cache.set(key, data, time); 
        return cacheSuccess; // return true on success
    } catch (err) {
        console.log(err)
        throw err;
    }
}
/**
 * get data saved in node cache
 * @param {String} key 
 * @returns value or throw error
 * @error log & throw
 */
async function getData(key){
    try {
        let cacheValue = await cache.get(key); // get + delete. will return value and delete as well as. not sure if it's already deleted...
        await cache.del(key);

        return cacheValue 
    } catch (err) {
        console.log(err)
        throw err;
    }
}