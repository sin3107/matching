import { expect } from "chai";
import { getMeet, postMeet } from "../../controllers/meet-controller.js"
import { makeDb, meetDb } from "../../db-handler/index.js";
import { meet_use_case } from "../../use-cases/handle-meet.js";

let userId1, userId2
describe("GET meet controller", ()=>{
    before(async()=> {
        // NOTE timestamp 로 인해 직접 넣어주기
        await meetDb.insertAllGeoJson({
            userId: userId1,
            timestamp: new Date(new Date().setHours(new Date().getHours() -2)),
            location: {
              type: "Point",
              coordinates: randomCoordinates[0]
            }
        })
        await meetDb.insertAllGeoJson({
            userId: userId1,
            timestamp: new Date(new Date().setHours(new Date().getHours() -3)),
            location: {
              type: "Point",
              coordinates: randomCoordinates[1]
            }
        })
        await meetDb.insertMeetMatching({
            userId: userId1,
            timestamp: new Date(new Date().setHours(new Date().getHours() -2)),
            location: {
              type: "Point",
              coordinates: randomCoordinates[0]
            },
            meet: [{
              userId: userId2,
              location: {
                type: "Point",
                coordinates: randomCoordinates[0]
              },
              timestamp: new Date(new Date().setHours(new Date().getHours() -2)),
            }]
        })
        await meetDb.insertMeetMatching({
            userId: userId1,
            timestamp: new Date(new Date().setHours(new Date().getHours() -3)),
            location: {
              type: "Point",
              coordinates: randomCoordinates[1]
            },
            meet: [{
              userId: userId2,
              location: {
                type: "Point",
                coordinates: randomCoordinates[1],
                timestamp: new Date(new Date().setHours(new Date().getHours() -3)),
              }
            }]
        })
    })
    after(async()=> {
        // await meetDb.deleteMyGeoJson(userId1)
        // await meetDb.deleteMeetMatchingByUser(userId1)
        // await meetDb.deleteMeetMatchingCountByUser(userId1)
    })
    describe("happy path", ()=>{
        let httpResponse;
        before(async()=> httpResponse = await getMeet({params: {id: userId1}}))
        it("should return status code of 200", ()=>
            expect(httpResponse).to.haveOwnProperty('statusCode', '200'))
        it('should return body with two list', ()=>
            expect(httpResponse).to.haveOwnProperty('body').to.have.all.keys(['myGeoJsonList', 'meetList']))
    })
})
const randomCoordinates = [
    [
       129.05945420265198,
       35.157415835199494
     ],
     [
       129.05911087989807,
       35.15695093866194
     ],
     [
       129.0583062171936,
       35.1564684960498
     ],
     [
       129.0575551986694,
       35.15493343234088
     ],
     [
       129.059100151062,
       35.15296850852892
     ],
     [
       129.0647327899933,
       35.15316149421907
     ],
     [
       129.0646255016327,
       35.15330184716076
     ],
     [
       129.0629947185516,
       35.15710882834999
     ],
     [
       129.06302690505981,
       35.1571790014463
     ]
   ]