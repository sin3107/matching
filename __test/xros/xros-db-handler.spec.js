import { expect, use } from "chai";
import chaiThings from 'chai-things'
import { meetDb } from "../../db-handler/index.js";
import { GeoJson, MeetMatching } from "../../models/index.js";
use(chaiThings)

describe("allGeoJson mongo db", ()=>{
    describe('get all geo json db and check index', () => {
        it('should get all geo json db', async()=>{
            const allGeoJsonDb = await meetDb.getAllGeoJsonDb();
            expect(allGeoJsonDb).to.be.an("object") &&
            expect(allGeoJsonDb.s.namespace).to.have.property("collection", 'allGeoJson')
        })
        it("should have index of expire and userId", async()=>{
            const {expireIndex, useridIndex} = await meetDb.createAllGeoJsonIndexes();
            expect(expireIndex).to.be.a("string", "timestamp_1") 
            && expect(useridIndex).to.be.a("string", "userId_1")
        })
    })
    describe("save geoJson", ()=>{
        after(()=> meetDb.deleteMyGeoJson('userB'))
        it("must save given object and return saved _id", async() => {
            const temp = GeoJson({userId: 'userB', coordinates: randomCoordinates[0]})
            const id = await meetDb.insertAllGeoJson(temp);
            expect(id).to.be.a('string', temp._id);
        })
    })
    describe("find myGeoJson", ()=>{
        before(async()=>{
            await Promise.all(randomCoordinates.map(coordinates => {
                // NOTE one hour ago 조건 때문에 이렇게 함
                const geoJson = {
                    userId : 'userA',
                    coordinates,
                    timestamp: new Date(new Date().setHours(new Date().getHours() -2))
                }
                meetDb.insertAllGeoJson(geoJson)
            }))
        })
        it("should return myGeoJson array of one user", async()=>{
            const userId = "userA";
            const result = await meetDb.findMyGeoJson(userId);
            expect(result).to.be.an('array').to.be.lengthOf.at.least(randomCoordinates.length)
        })
        it("should return null when there's no record", async()=>{
            const userId = "my_id";
            const result = await meetDb.findMyGeoJson(userId);
            expect(result).to.be.a.null;
        })
    })
    describe("delete myGeoJson", ()=>{
        it("should delete myGeoJson of one user", async()=>{
            const userId = 'userA';
            await meetDb.deleteMyGeoJson(userId);
            const deleteCheck = await meetDb.findMyGeoJson(userId)
            expect(deleteCheck).to.be.null
        })
    })
})

describe("meetMatching mongo db", ()=>{
    describe("get meet db and check index", ()=>{
        it('should get meet db', async()=>{
            const meetMatchingDb = await meetDb.getMeetMatchingDb();
            expect(meetMatchingDb).to.be.an("object") &&
            expect(meetMatchingDb.s.namespace).to.have.property("collection", 'meetMatching')
        })
        it("should create index to expire document in 1 day & user id", async()=>{
            const {expireIndex, userIdIndex} = await meetDb.createMeetMatchingIndexes();
            expect(expireIndex).to.be.a("string", "timestamp_1") 
            && expect(userIdIndex).to.be.a("string", "userId_1")
        })
    })
    describe('insert meet matching document', () => {
        after(()=> meetDb.deleteMeetMatchingByUser('userA'))
        it("should insert meet matching and get inserted id", async()=>{
            const meetMatching = MeetMatching({
                userId: 'userA', 
                location: {type: "Point", coordinates: randomCoordinates[0]},
                timestamp: new Date(),
                meet: [
                    {userId: 'userB',
                    location: {type: "Point", coordinates: randomCoordinates[1]},
                    timestamp: new Date()
                    }
                ]}),
            insertedId = await meetDb.insertMeetMatching(meetMatching);
            expect(insertedId).to.be.equal(meetMatching._id)
        })
    })
    describe("get meetMatching list", ()=>{
        before(async()=>{
            Promise.all(randomCoordinates.map(() => {
                // NOTE 빠르게 통과하기 위해서....
                meetDb.insertMeetMatching({userId: 'userA', timestamp: new Date(new Date().setHours(new Date().getHours() -2))})
            }))
        })
        after(()=> meetDb.deleteMeetMatchingByUser('userA'))
        it("should return array of meetMatching of user A", async()=>{
            const userId = "userA";
            const result = await meetDb.findMeetMatching(userId);
            expect(result).to.be.an("array")
            .to.be.lengthOf(randomCoordinates.length)
        })
        it("should return null because of no match", async()=>{
            const userId = "userC";
            const result = await meetDb.findMeetMatching(userId);
            expect(result).to.be.a.null;
        })
    })
    describe("delete meetMatching", ()=>{
        const userId = "userA",
        userB = 'userB'
        beforeEach(async()=> {
            await Promise.all(randomCoordinates.map(async(coordinates) => {
                await meetDb.insertMeetMatching(MeetMatching({
                    userId,
                    location: {
                        type: "Point", 
                        coordinates
                    },
                    timestamp: new Date(new Date().setHours(new Date().getHours() -2)),
                    meet: [{
                        userId: userB,
                        location: {
                            type: "Point",
                            coordinates
                        },
                        timestamp: new Date()
                    }]
                }))
            }))
        })
        afterEach(async()=> await meetDb.deleteMeetMatchingByUser(userId))
        it("should delete meetMatching of one user", async()=>{
            await meetDb.deleteMeetMatchingByUser(userId)
            const checkDelete = await meetDb.findMeetMatching(userId);
            expect(checkDelete).to.be.null;
        })
        it("should delete user b from user a's meet list", async()=>{
            await meetDb.deleteUserFromMeetMatching(userId, userB);
            const checkUser = await meetDb.findMeetMatching(userId);
            expect(checkUser[0]).to.haveOwnProperty('meet')
            .to.not.include.something.that.deep.include({userId: userB})
        })
        it("should delete empty meet", async()=>{
            // NOTE 이 테스트 만을 위한 before
            await meetDb.deleteUserFromMeetMatching(userId, userB)
            await meetDb.deleteEmptyMeet(userId);
            const checkDelete = await meetDb.findMeetMatching(userId)
            expect(checkDelete).to.be.null;
        })
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