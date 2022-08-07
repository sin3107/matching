import { generateHash, generateId } from "../../helper/id-generator.js"

describe('추천인 해쉬 테스트', () => { 
    it("몇자 되냐?", ()=>{
        console.log(generateHash(generateId()))
        console.log(generateHash(generateId()))
        console.log(generateHash(generateId()))
        console.log(generateHash(generateId()))
        console.log(generateHash(generateId()))
        console.log(generateHash('733affe3cc1142c4b9b79873f1a63efe'))
    })
 })