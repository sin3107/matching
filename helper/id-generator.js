import {
    v4 as uuidv4
} from 'uuid';

/**
 * generate id using uuidv4
 * @returns id
 */
export function generateId() {
    const uuid = uuidv4();
    const id = uuid.replace(/-/g, "");
    return id;
}

export function generateHash(str){
    let hash = 0;
    for (let i =0; i < str.length; i++){
        const char = str.charCodeAt(i)
        hash = (hash << 5) - hash + char;
        hash &= hash; // conver to 32bit integer
    }
    return new Uint32Array([hash])[0].toString(36).toUpperCase()
}