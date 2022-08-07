import { expect } from "chai"
import { cryptoHandler } from "../../helper/crypto.js"

describe('crypto - encryption', () => {
    let encrypted
    before(()=> encrypted = cryptoHandler.encrypt('testing testing'))
    it("should be a string that has : between", ()=> 
        expect(encrypted).to.be.a('string')
        .to.be.lengthOf(32))
})
describe('crypto - decryption', () => {
    let data = 'test test',
    encrypted
    before(()=> encrypted = cryptoHandler.encrypt(data))
    it("should decrypt given data", ()=> {
        const decrypted = cryptoHandler.decrypt(encrypted)
        expect(decrypted).to.be.equal(data)
    })
})
