import {expect} from 'chai'
import { MateList } from '../../models/index.js';

describe('model - 제일 처음(누적 크로스만 채우기)', ()=> {
    let model;
    before(()=> model = MateList({
        users: ['a', 'b'],
        meetMatchingCount :1 
    }))
    it("_id field: string", ()=>
        expect(model).to.haveOwnProperty('_id').to.be.a('string'))
    it('users: String array, length 2', ()=>
        expect(model).to.haveOwnProperty('users').to.be.an('array')
        .to.be.lengthOf(2).to.haveOwnProperty('0').to.be.a('string'))
    it('matching: empty array', ()=> 
        expect(model).to.haveOwnProperty('matching').to.be.an('array')
        .to.be.empty)
    it('meetMatchingCount: Number', ()=>
        expect(model).to.haveOwnProperty('meetMatchingCount').to.be.a('Number', 1))
})
describe('model - 크로스 좋아요 하고 난 후(당연히 db에서 컨트롤 될 것 이지만...)', () => {
    let model;
    before(()=> model = MateList({
        users: ['a', 'b'],
        matching : ['meet'],
        meetMatchingCount :1
    }))
    it('_id field: Stirng', ()=>
        expect(model).to.haveOwnProperty('_id').to.be.a("string"))
    it('users: string array, length 2', ()=>
        expect(model).to.haveOwnProperty('users').to.be.an('array')
        .to.be.lengthOf(2).to.haveOwnProperty('0').to.be.a('string'))
    it("matching: meet array", ()=>
        expect(model).to.haveOwnProperty('matching').to.be.an('array')
        .to.be.lengthOf(1).to.have.members(['meet']))
    it('meetMatchingCount: Number -1', ()=>
        expect(model).to.haveOwnProperty('meetMatchingCount').to.be.a("Number", 1))
})
