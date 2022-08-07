import chai, { expect, use } from "chai";
import chaiHttp from "chai-http";
import app from "../server.js";
import { config } from "dotenv";
config({ path: "config/.env" });

use(chaiHttp);

describe("meet end point", () => {
  describe("GET meet list", () => {
    describe("successfull request: user exist", () => {
      const id = "b92860a046ba4dba9b5dd78365c043b6";
      const accToken = process.env.ACCESS_TOKEN;
      it("should return array of users and my geo point, meet matching", async () => {
        const res = await chai
          .request(app)
          .get(`/api/auth/users/${id}/meet`)
          .set({ Authorization: `Bearer ${accToken}` });
        expect(res.body)
          .to.be.an("object")
          .and.to.have.all.keys("myGeoJsonList", "meetList");
      });
      it("should be status of 200", async () => {
        const res = await chai
          .request(app)
          .get(`/api/auth/users/${id}/meet`)
          .set({ Authorization: `Bearer ${accToken}` });
        expect(res).to.have.property("statusCode", 200);
      });
      it("should include myGeoJsonList to be array", async () => {
        const res = await chai
          .request(app)
          .get(`/api/auth/users/${id}/meet`)
          .set({ Authorization: `Bearer ${accToken}` });
        expect(res)
          .to.have.property("body")
          .to.have.property("myGeoJsonList")
          .to.be.an("array")
          .with.lengthOf.at.least(1);
      });
      it("should include meet matching list and it should be an array", async () => {
        const res = await chai
          .request(app)
          .get(`/api/auth/users/${id}/meet`)
          .set({ Authorization: `Bearer ${accToken}` });
        expect(res)
          .to.have.property("body")
          .to.have.property("meetList")
          .to.be.an("array")
          .with.lengthOf.at.least(1);
      });
    });
    describe("successful request: but user's record doesn't exist", () => {
      const id = "joy";
      const accToken = process.env.ACCESS_TOKEN;
      it("should return null in res.body", async () => {
        const res = await chai
          .request(app)
          .get(`/api/auth/users/${id}/meet`)
          .set({ Authorization: `Bearer ${accToken}` });
        expect(res).to.have.property("body").and.to.be.a("string", "");
      });
      it("should have status code of 200", async () => {
        const res = await chai
          .request(app)
          .get(`/api/auth/users/${id}/meet`)
          .set({ Authorization: `Bearer ${accToken}` });
        expect(res).to.have.property("statusCode", 200);
      });
    });
    describe("", () => {}); // NOTE no result.false return: if id doesn't exist return false? no
  });
  describe("POST meet point", () => {
    describe("successfull post", () => {
      it("should return status code of 201 and body of null", async () => {
        const accToken = process.env.ACCESS_TOKEN;
        const body = {
          geoJson: {
            userId: "test from endpoint",
            coordinates: [10, 20],
            timestamp: Date.now(),
            age: 10,
            gender: "f",
          },
        };
        const res = await chai
          .request(app)
          .post("/api/auth/meet")
          .set({ Authorization: `Bearer ${accToken}` })
          .send(body);
        expect(res).to.have.property("body", "") &&
          expect(res).to.have.property("statusCode", 201);
      });
    });
    describe("no geo json post", () => {
      it("should return status code of 400 & error message in body", async () => {
        const accToken = process.env.ACCESS_TOKEN;
        const body = { hey: "hey" };
        const res = await chai
          .request(app)
          .post("/api/auth/meet")
          .set({ Authorization: `Bearer ${accToken}` })
          .send(body);
        expect(res).to.have.property("statusCode", 400) &&
          expect(res)
            .to.have.property("body")
            .to.have.all.keys("message", "code");
      });
    });
  });
});
