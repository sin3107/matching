import { expect } from "chai";
import { getToonifyCollection, postFaceCheck, postIdentitiesMandatoryPics, postNewToonify, putProfileImage } from "../../controllers/user-controller.js";
import errorMessage from '../../helper/error.js'

describe("GET toonify list", ()=>{
    it("should return 200 status code with toonify list", async()=>{
        const httpRequest = {params: {id: '8b3ad2012c2b497b960619a4cfd10313'}};
        const httpResponse = await getToonifyCollection(httpRequest);
        expect(httpResponse).to.have.property("statusCode", '200')
        && expect(httpResponse).to.have.property('body').to.have.property('toonify').and.to.be.an("array").to.be.lengthOf.at.least(2)
    })
    it("should return 400: no id", async()=>{
        const httpRequest = {params: "synergy"};
        const httpResponse = await getToonifyCollection(httpRequest);
        expect(httpResponse).to.have.property("statusCode", '400')
        && expect(httpResponse).to.have.property("body").to.include(errorMessage.nullError.idMissing)
    })
    it("should return 400: user doesn't exist", async()=>{
        const httpRequest = {params: {id: "gotToGo"}};
        const httpResponse = await getToonifyCollection(httpRequest);
        expect(httpResponse).to.have.property("statusCode", '400')
        && expect(httpResponse).to.have.property("body").to.include(errorMessage.dbError.userNotFound);
    })
})
describe("POST new toonify lsit", ()=>{
    it("should return 201 with toonify list", async()=>{
        const httpRequest = {
            body: {
                toonify: "./uploads/yeri.jpg"
            },
            params: {id: "8b3ad2012c2b497b960619a4cfd10313"}
        }
        const httpResponse = await postNewToonify(httpRequest);
        expect(httpResponse).to.have.property("statusCode", "201")
        && expect(httpResponse).to.have.property("body").to.have.property("toonify").and.to.be.an("array").to.be.lengthOf.at.least(2)
    })
    it("should return 400: no id", async()=>{
        const httpRequst = {
            body: "body",
            params: "params"
        }
        const httpResponse = await postNewToonify(httpRequst);
        expect(httpResponse).to.have.property("statusCode", '400')
        && expect(httpResponse).to.have.property("body").to.include(errorMessage.nullError.idMissing)
    })
    it("should return 400: no image", async()=>{
        const httpRequest = {
            body: "body", 
            params: {id: "id"}
        }
        const httpResponse =await postNewToonify(httpRequest);
        expect(httpResponse).to.have.property("statusCode", "400")
        && expect(httpResponse).to.have.property("body").to.include(errorMessage.nullError.toonifyMissing)
    })
    it("should return 400: no user found", async()=>{
        const httpRequest = {
            body: { toonify: "toonify"},
            params: {id: "fakeId"}
        }
        const httpResponse = await postNewToonify(httpRequest);
        expect(httpResponse).to.have.property('statusCode', '400')
        && expect(httpResponse).to.have.property("body").to.include(errorMessage.dbError.userNotFound);
    })
})
describe("PUT set new profile image", ()=>{
    it("should return 200: new profile image", async()=>{
        const httpRequest = {
            body: {profileImage: "./uploads/yeri.jpg"},
            params: {id: "8b3ad2012c2b497b960619a4cfd10313"}
        }
        const httpResponse = await putProfileImage(httpRequest);
        expect(httpResponse).to.have.property("statusCode", '200')
        && expect(httpResponse).to.have.property("body").to.have.property("profileImage", httpRequest.body.profileImage)
    })
    it("should return 400: no id", async()=>{
        const httpRequst = {
            params: "nextLevel",
            body: "body"
        }
        const httpResponse = await putProfileImage(httpRequst);
        expect(httpResponse).to.have.property("statusCode", '400')
        && expect(httpResponse).to.have.property("body").to.include(errorMessage.nullError.idMissing)
    })
    it("should return 400: no image", async()=>{
        const httpRequst = {
            params : {id: "eye"},
            body: "body"
        }
        const httpResponse = await putProfileImage(httpRequst);
        expect(httpResponse).to.have.property("statusCode", '400')
        && expect(httpResponse).to.have.property("body").to.include(errorMessage.nullError.profileImageMissing)
    })
    it("should return 400: no user found", async()=>{
        const httpRequest = {
            params: {id: "NeverFound"},
            body: {profileImage:"next level"}
        }
        const httpResponse = await putProfileImage(httpRequest);
        expect(httpResponse).to.have.property("statusCode", '400')
        && expect(httpResponse).to.have.property("body").to.include(errorMessage.dbError.userNotFound)
    })
})
describe("check mandatory pics ", ()=>{
    it("should return 200 status", async()=>{
        const httpRequest = {
            file: {
                main: "./uploads/front.jpg",
                sub: "./uploads/jang.jpg"
            }
        }
        const httpResponse = await postIdentitiesMandatoryPics(httpRequest);
        expect(httpResponse).to.have.property("statusCode", '200')
        && expect(httpResponse).to.have.property("body", null)
    })
    it("should return 400, both not found", async()=>{
        const httpRequest = {
            file: {peter: "should know better"}
        }
        const httpResponse = await postIdentitiesMandatoryPics(httpRequest);
        expect(httpResponse).to.have.property("statusCode", '400')
        && expect(httpResponse).to.have.property("body", errorMessage.nullError.pictureMissing)
    })
    it("should return 400, main not found", async()=>{
        const httpRequest = {
            file: {
                sub: "./uploads/yeri.jpg"
            }
        }
        const httpResponse = await postIdentitiesMandatoryPics(httpRequest);
        expect(httpResponse).to.have.property("statusCode", '400')
        && expect(httpResponse).to.have.property("body", errorMessage.nullError.pictureMissing)
    })
    it("should return 400, sub not found", async()=>{
        const httpRequest = {
            file: {
                main: "./uploads/cha.jpg",
            }
        }
        const httpResponse = await postIdentitiesMandatoryPics(httpRequest);
        expect(httpResponse).to.have.property("statusCode", '400')
        && expect(httpResponse).to.have.property("body", errorMessage.nullError.pictureMissing)
    })
})
describe("post check face", ()=>{
    it("should return 200 with null", async()=>{
        const httpRequest = {
            file: {pic: "./uploads/yeri.jpg"}
        }
        const httpResponse = await postFaceCheck(httpRequest);
        expect(httpResponse).to.have.property("statusCode", '200')
        && expect(httpResponse).to.have.property("body", null)
    })
    it("should return 400: no picture", async()=>{
        const httpRequest = {
            file: {you: "you"}
        }
        const httpResponse = await postFaceCheck(httpRequest);
        expect(httpResponse).to.have.property("statusCode", '400')
        && expect(httpResponse).to.have.property("body", errorMessage.nullError.pictureMissing)
    })
    it("should return 400: face not front", async()=>{
        const httpRequest = {
            file: {pic: "./uploads/junBack.jpg"}
        }
        const httpResponse = await postFaceCheck(httpRequest);
        expect(httpResponse).to.have.property("statusCode", '400')
        && expect(httpResponse).to.have.property("body", errorMessage.syntaxError.faceNotFront)
    })
})