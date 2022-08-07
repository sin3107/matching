import chai, { expect, use } from "chai";
import chaiHttp from "chai-http";
import app from "../server.js";
import { config } from "dotenv";
config({ path: "config/.env" });
use(chaiHttp);
describe("POST end point test", () => {
  it("A->B send like successfully", async () => {
    const body = {
      io: "io",
      likeFrom: "AA",
      likeTo: "CC",
      timestamp: new Date(),
    };
    const accToken = process.env.ACCESS_TOKEN;

    const res = await chai
      .request(app)
      .post("/api/auth/like")
      .set({ Authorization: `Bearer ${accToken}` })
      .send(body);
    console.log(res.body);
  });
  it("A->B resend like", async () => {
    const body = {
      io: "io",
      likeFrom: "AA",
      likeTo: "CC",
      timestamp: new Date(),
    };
    const accToken = process.env.ACCESS_TOKEN;

    const res = await chai
      .request(app)
      .post("/api/auth/like")
      .set({ Authorization: `Bearer ${accToken}` })
      .send(body);
    console.log(res.body);
  });
  it("B->A send like for matching", async () => {
    const body = {
      io: "io",
      likeFrom: "CC",
      likeTo: "AA",
      timestamp: new Date(),
    };
    const accToken = process.env.ACCESS_TOKEN;

    const res = await chai
      .request(app)
      .post("/api/auth/like")
      .set({ Authorization: `Bearer ${accToken}` })
      .send(body);
    console.log(res.body);
  });
});
