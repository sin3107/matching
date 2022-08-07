import { expect } from "chai"
import { Like } from "../../models/index.js";
import errorMessage from '../../helper/error.js'

let userA = 'userA',
userB = 'userB'
describe('like model', () => {
    describe('happy path for like model', () => {
        let like;
        before(()=> like = Like({likeFrom: userA, likeTo: userB}))
        it('should be frozen object', ()=> 
            expect(like).to.be.an('object').and.to.be.frozen)
        it("should have _id field as stirng", ()=> 
            expect(like).to.haveOwnProperty('_id').to.be.a('string'))
        it("should have likeFrom field as string", ()=> 
            expect(like).to.haveOwnProperty('likeFrom').to.be.a('string'))
        it('should have likeTo field as string', ()=> 
            expect(like).to.haveOwnProperty('likeTo').to.be.a('string'))
        it('should have tiemstamp field as date', ()=>
            expect(like).to.haveOwnProperty('timestamp').to.be.a('date'))
    })
    describe('unhappy path - null checking', () => {
        it('should throw error: no likeFrom', ()=> {
            expect(()=> Like({}))
            .to.throw(Error, errorMessage.nullError.likeFromMissing.message)
            .with.property('code', errorMessage.nullError.likeFromMissing.code)
        })
        it('should throw error: no like to', ()=> {
            expect(()=> Like({likeFrom: userA}))
            .to.throw(Error, errorMessage.nullError.likeToMissing.message)
            .with.property('code', errorMessage.nullError.likeToMissing.code)
        })
    })
    describe('unhappy path - type checking', () => {
        it('should throw type error: likeFrom is not string', ()=> {
            expect(()=> Like({likeFrom: ['adf'], likeTo: userB}))
            .to.throw(TypeError, errorMessage.syntaxError.likeFromNotStr.message)
            .with.property('code', errorMessage.syntaxError.likeFromNotStr.code)
        })
        it('should throw type error', ()=> {
            expect(()=> Like({likeFrom: userA, likeTo: {}}))
            .to.throw(TypeError, errorMessage.syntaxError.likeToNotStr.message)
            .with.property('code', errorMessage.syntaxError.likeToNotStr.code)
        })
    })
})
