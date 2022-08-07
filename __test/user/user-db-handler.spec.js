import { expect } from "chai"
import {makeDb, userDb} from '../../db-handler/index.js'

let id

describe("get user with toonify list", ()=>{
    before(async()=>{
        const db = await makeDb();
        const cursor = db.collection('user').aggregate([{$sample: {size: 1}}])
        await cursor.forEach(({_id})=> id = _id)
    })
    it("should return id with toonify list", async()=>{
        const query = {_id: id};
        const projection = {'profile.toonify': true}
        const {profile: {toonify}} = await userDb.getUser(query, projection);        
        expect(toonify).to.be.an("array").to.have.property('0').and.to.be.a.lengthOf(4)
    })
})
describe("add new toonify collection", ()=>{
    it("should return array of toonify list", async()=>{
        const newToonify = ['a', 'b', 'c', 'd'];
        const query = {_id: id};
        const update = {$push: {'profile.toonify': newToonify}}
        const projection = {'profile.toonify': true}
        const {profile: {toonify}} = await userDb.updateUser({query, update, projection});
        expect(toonify).to.be.an("array").and.to.be.lengthOf.at.least(2)
    })
})
describe("set profile image", ()=>{
    it("should update profile image and get updated image route", async()=>{
        const query = {_id: id};
        const update = {$set: {'profile.mandatoryPics.profileImage' : 'a'}};
        const projection = {'profile.mandatoryPics.profileImage': true}
        const {profile: {mandatoryPics: profileImage}} = await userDb.updateUser({query, update, projection});
        expect(profileImage).to.have.property('profileImage', 'a')
    })
})
describe('get nickanamne and profile image', () => {
    it('should return nickanme and profile image from userid', async()=>{
        const profile = await userDb.getNicknameAndProfileImage(id);
        expect(profile).to.be.an('object').to.have.all.keys(['nickname', 'mandatoryPics'])
        .to.haveOwnProperty('mandatoryPics').to.haveOwnProperty('profileImage')
    })
})
describe('testing get nickname, profileImage, gender, age', () => {
    it('should return nickname, profileImage, age, gender', async()=>{
        const profile = await userDb.getNicknameProfileImageAgeGender(id);
        expect(profile).to.be.an('object').to.have.all.keys(['nickname', 'mandatoryPics', 'age', 'gender'])
        .to.haveOwnProperty('mandatoryPics').to.haveOwnProperty('profileImage')
    })
})
describe('find by expo token and delete it', () => {
    let _id = Date.now().toString(),
    expoToken = 'Expotoken[akfjsdlf]'
    before(async()=> {
        await userDb.insertUser({_id, expoToken})
    })
    after(async()=> await userDb.deleteUser(_id))
    it('should find user by expo token and delete', async()=>{
        await userDb.deleteExpoToken(expoToken)
        const checkToken = await userDb.findUserById(_id, {expoToken: true})
        // NOTE 이거 undefined로 설정 해도 항상 null로 취급됨...
        expect(checkToken).to.haveOwnProperty('expoToken').to.be.null
    })
})
