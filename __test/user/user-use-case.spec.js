import { expect } from "chai";
import { user_use_cases } from "../../use-cases/handle-user.js";
import errorMessage from '../../helper/error.js'
import { makeDb, userDb } from "../../db-handler/index.js";

describe('save expo token', () => {
    let userId;
    describe('happy path', () => {
        let result;
        before(async()=> {
            const db = await makeDb(),
            cursor = await db.collection('user').aggregate([{$sample: {size: 1}}])
            await cursor.forEach(({_id}) => userId = _id)
            result = await user_use_cases.saveExpoToken(userId, {token: 'abc'})
        })
        it("should return true", ()=>
            expect(result).to.haveOwnProperty('status', true))
        it('should return nothing in body', ()=>
            expect(result).to.haveOwnProperty('body').to.be.null)
        it("should have updated in db", async()=>{
            const checkUpdate = await userDb.getUser({_id: userId}, {expoToken: true})
            expect(checkUpdate).to.haveOwnProperty('expoToken', 'abc')
        })
    })
    describe('unhappy path', () => {
        it('should return false: no user id', async()=>{
            const result = await user_use_cases.saveExpoToken(undefined, {})
            checkUnhappy(result, errorMessage.nullError.idMissing)
        })
        it("should return false: no token", async()=>{
            const result = await user_use_cases.saveExpoToken(userId, {})
            checkUnhappy(result, errorMessage.tokenError.noToken)
        })
        it('should return false: no user found in db', async()=>{
            const result = await user_use_cases.saveExpoToken("fakeUserId", {token: "a"})
            checkUnhappy(result, errorMessage.dbError.userNotFound)
        })
    })
    
})

// describe("get toonify list", ()=>{
//     it("should return status of true with toonify list", async()=>{
//         const id = '8b3ad2012c2b497b960619a4cfd10313';
//         const result = await user_use_cases.getToonifyList(id);
//         expect(result).to.have.property("status", true)
//         && expect(result).to.have.property("body").to.have.property("toonify").to.be.an("array").to.be.a.lengthOf.at.least(2)
//     })
//     it("should return status of false with error: user doesn't exist", async()=>{
//         const id = "neverexist",
//         result = await user_use_cases.getToonifyList(id);
//         expect(result).to.have.property("status", false)
//         && expect(result).to.have.property("body").to.include(errorMessage.dbError.userNotFound)
//     })
//     it("should return status of false with error: id missing", async()=>{
//         const result = await user_use_cases.getToonifyList();
//         expect(result).to.have.property("status", false)
//         && expect(result).to.have.property("body").to.include(errorMessage.nullError.idMissing);
//     })
// })
// describe("add new toonify list", ()=>{
//     it("should return status of true with toonify list", async()=>{
//         const id = '8b3ad2012c2b497b960619a4cfd10313';
//         const body ={
//             toonify: "./uploads/yeri.jpg"
//         }
//         const result = await user_use_cases.addToonify(id, body);
//         expect(result).to.have.property("status", true)
//         && expect(result).to.have.property("body").to.have.property("toonify").to.be.an("array").and.to.have.lengthOf.at.least(2)
//     })
//     it("should return status of false with error: id missing", async()=>{
//         const result = await user_use_cases.addToonify();
//         expect(result).to.have.property("status", false)
//         && expect(result).to.have.property("body").to.include(errorMessage.nullError.idMissing)
//     })
//     it("should return status of false with error: no image for toonify", async()=>{
//         const id = '8b3ad2012c2b497b960619a4cfd10313';
//         const body = {sinkout: "aespa"};
//         const result = await user_use_cases.addToonify(id, body);
//         expect(result).to.have.property("status", false)
//         && expect(result).to.have.property("body").to.include(errorMessage.nullError.toonifyMissing);
//     })
//     it("should return status of false with error: user not exist", async()=>{
//         const id = "evoEvolution";
//         const body = {toonify: "toonify"}
//         const result = await user_use_cases.addToonify(id, body);
//         expect(result).to.have.property("status", false)
//         && expect(result).to.have.property("body").to.include(errorMessage.dbError.userNotFound)
//     })
// })
// describe("update profile iamge", ()=>{
//     it("should return status of true with updated profile image", async()=>{
//         const id = '8b3ad2012c2b497b960619a4cfd10313';
//         const body = {profileImage: "./uploads/yeri.jpg"};
//         const result = await user_use_cases.setProfileImage(id, body);
//         expect(result).to.have.property("status", true)
//         && expect(result).to.have.property("body").to.have.property("profileImage", body.profileImage)
//     })
//     it("should return status of false with error: id missing", async()=>{
//         const result = await user_use_cases.setProfileImage();
//         expect(result).to.have.property("status", false)
//         && expect(result).to.have.property("body").to.include(errorMessage.nullError.idMissing)
//     })
//     it("shoud return status of false: no profile image", async()=>{
//         const id = "8b3ad2012c2b497b960619a4cfd10313"
//         const body = "sinkout";
//         const result = await user_use_cases.setProfileImage(id, body);
//         expect(result).to.have.property("status", false)
//         && expect(result).to.have.property("body").to.include(errorMessage.nullError.profileImageMissing)
//     })
//     it("should return status of false: no user found", async()=>{
//         const id = "heymamba";
//         const body = {profileImage: "./uploads/yeri.jpg"};
//         const result = await user_use_cases.setProfileImage(id, body);
//         expect(result).to.have.property("status", false)
//         && expect(result).to.have.property("body").to.include(errorMessage.dbError.userNotFound)
//     })
// })
// describe("check if face is frontal", ()=>{
//     it("should return status of true and nothing", async()=>{
//         const pic = "./uploads/yeri.jpg";
//         const result = await user_use_cases.checkFaceFrontal(pic);
//         expect(result).to.have.property("status", true)
//         && expect(result).to.have.property("body", "")
//         // NOTE 이거 사진 지워버리는데... 다 이걸로 테스트 해서.. 뭔가 파일 복사할 수는 없나...
//     })
//     it("should return status of false: no pictue", async()=>{
//         const result = await user_use_cases.checkFaceFrontal();
//         expect(result).to.have.property("status", false)
//         && expect(result).to.have.property("body", errorMessage.nullError.pictureMissing)
//     })
//     it("should return status of false: face not frontal", async()=>{
//         const pic = "./uploads/junBack.jpg";
//         const result = await user_use_cases.checkFaceFrontal(pic)
//         expect(result).to.have.property("status", false)
//         && expect(result).to.have.property("body", errorMessage.syntaxError.faceNotFront)
//     })
// })

function checkUnhappy(result, errMsg){
    return expect(result).to.haveOwnProperty('status', false)
    && expect(result).to.haveOwnProperty('body', errMsg)
}