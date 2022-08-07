import chai, { expect, use } from "chai";
import chaiHttp from "chai-http";
import { config } from "dotenv";
import app from "../server.js";
import errorMessage from "../helper/error.js";
import FormData from "form-data";
import { createReadStream } from "fs";
config({ path: "config/.env" });
use(chaiHttp);
const accToken = process.env.ACCESS_TOKEN;
describe("GET /api/auth/users/:id/toonify", () => {
  it("should succeed request: wit toonify list", async () => {
    const id = "8b3ad2012c2b497b960619a4cfd10313";
    const res = await chai
      .request(app)
      .get(`/api/auth/users/${id}/toonify`)
      .set({ Authorization: `Bearer ${accToken}` });
    expect(res).to.have.property("statusCode", 200) &&
      expect(res)
        .to.have.property("body")
        .to.have.property("toonify")
        .to.be.an("array")
        .and.to.be.lengthOf.at.least(2);
  });
  // it("should fail request: no user id", async()=>{
  //     const id = null;
  //     const res = await chai.request(app)
  //     .get(`/api/auth/users/${id}/toonify`)
  //     .set({"Authorization" : `Bearer ${accToken}`});
  //     console.log(res.body)
  //     // expect(res).to.have.property("statusCode", 400)
  //     // && expect(res).to.have.property("body").to.include(errorMessage.nullError.idMissing)
  // }) NOTE 이거 파람에서 떼 가는거는... 없을 수가 없군!
  it("should fail request: no user found", async () => {
    const id = "hey",
      res = await chai
        .request(app)
        .get(`/api/auth/users/${id}/toonify`)
        .set({ Authorization: `Bearer ${accToken}` });
    expect(res).to.have.property("statusCode", 400) &&
      expect(res)
        .to.have.property("body")
        .to.include(errorMessage.dbError.userNotFound);
  });
});
describe("POST /api/auth/users/:id/toonify", () => {
  // it("should succeed request: with toonify list",async()=>{
  //     const id = "8b3ad2012c2b497b960619a4cfd10313",
  //     formData = new FormData();
  //     formData.append('toonify', createReadStream('./uploads/yeri.jpg'))
  //     const res = await chai.request(app)
  //     .post(`/api/auth/users/${id}/toonify`)
  //     .set({"Authorization" : `Bearer ${accToken}`})
  //     .send(formData);
  //     expect(res).to.have.property('statusCode', 200)
  //     && expect(res).to.have.property('body').to.have.property('toonify').to.be.an('array').and.to.be.lengthOf.at.least(2)
  // })
  it("should fail request: no file", async () => {}); //NOTE 사실 이러면 multer error 가 날 텐데...multer error는 어떻게 잡지...
  it("should fial reqeust: no user found", async () => {});
});
describe("PUT /api/auth/users/:id/profileImage", () => {
  it("should succeed request: with new profile image", async () => {
    const id = "8b3ad2012c2b497b960619a4cfd10313";
    const res = await chai
      .request(app)
      .put(`/api/auth/users/${id}/profileImage`)
      .set({ Authorization: `Bearer ${accToken}` })
      .send({ profileImage: "./uploads/yeri.jpg" });
    expect(res).to.have.property("statusCode", 200) &&
      expect(res)
        .to.have.property("body")
        .to.have.property("profileImage", "./uploads/yeri.jpg");
  });
  it("should fail request: no image found", async () => {
    const id = "8b3ad2012c2b497b960619a4cfd10313";
    const res = await chai
      .request(app)
      .put(`/api/auth/users/${id}/profileImage`)
      .set({ Authorization: `Bearer ${accToken}` })
      .send({ profile: "profile" });
    expect(res).to.have.property("statusCode", 400) &&
      expect(res)
        .to.have.property("body")
        .to.include(errorMessage.nullError.profileImageMissing);
  }); //NOTE 이건 multer 에러 아님... String으로 줄 테니
  it("should fail request: no user found", async () => {
    const id = "noUserFound";
    const res = await chai
      .request(app)
      .put(`/api/auth/users/${id}/profileImage`)
      .set({ Authorization: `Bearer ${accToken}` })
      .send({ profileImage: "./uploads/yeri.jpg" });
    expect(res).to.have.property("statusCode", 400) &&
      expect(res)
        .to.have.property("body")
        .to.include(errorMessage.dbError.userNotFound);
  });
});
