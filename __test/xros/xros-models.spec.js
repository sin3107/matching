import { expect } from "chai";
import {  GeoJson, MeetMatching } from "../../models/index.js";
import errorMessage from '../../helper/error.js'

describe("Models", ()=>{
    describe("creating geoJson",()=>{
        describe("successful model", ()=>{
            const temp = GeoJson({userId: "a", coordinates: [10, 20], age: 10, gender: 'f'})
            it("must be frozen object", ()=>{
                expect(temp)
                .to.be.an('object').and.to.be.frozen
            })
            it("must have _id", ()=>{
                expect(temp)
                .to.have.property('_id')
                .and.to.be.a("string")
            })
            it("must have userId", ()=>{
                expect(temp)
                .to.have.property('userId')
                .and.to.be.a("string")
            })
            it("must have timestamp", ()=>{
                expect(temp)
                .to.have.property('timestamp')
                .and.to.be.a("date")
            })
            it("must have location", ()=>{
                expect(temp)
                .to.have.property('location')
                .and.to.be.an("object")
            })
            it("must have type nested in location", ()=>{
                expect(temp.location)
                .to.have.property('type')
                .and.to.be.a("string")
            })
            it("must have coordinates nested in location", ()=>{
                expect(temp.location)
                .to.have.property('coordinates')
                .and.to.be.an("array")
                .to.be.lengthOf(2)
            })
        })
        describe("null error throwing", ()=>{
            it("must throw error: no user id", ()=>{
                expect(()=>GeoJson())
                .to.throw(Error, errorMessage.nullError.idMissing.message)
                .with.property('code', errorMessage.nullError.idMissing.code)
            })
            it("must throw error: no coordinates", ()=>{
                expect(()=>GeoJson({userId: 'a'}))
                .to.throw(Error, errorMessage.nullError.coordinatesMissing.message)
                .with.property('code', errorMessage.nullError.coordinatesMissing.code)
            })
        })
        describe("type error throwing", ()=>{
            it("must throw type error: user id not string", ()=>{
                expect(()=>GeoJson({userId: {}, coordinates: []}))
                .to.throw(TypeError, errorMessage.syntaxError.idNotString.message)
                .with.property("code", errorMessage.syntaxError.idNotString.code)
            })
            it("must throw type error: wrong coordinates", ()=>{
                expect(()=>GeoJson({userId: "userId", coordinates: {}}))
                .to.throw(TypeError, errorMessage.syntaxError.coordinatesNotArray.message)
                .with.property("code", errorMessage.syntaxError.coordinatesNotArray.code)
            })
            it("must throw type error: coordinates length not 2", ()=>{
                expect(()=>GeoJson({userId: "userId", coordinates: [1]}))
                .to.throw(TypeError, errorMessage.syntaxError.coordinatesNotArray.message)
                .with.property("code", errorMessage.syntaxError.coordinatesNotArray.code);
            })
            it('must throw error: wrong longtitude - below -180', ()=>{
                expect(()=> GeoJson({userId: 'userId', coordinates: [-181, -90]}))
                .to.throw(Error, errorMessage.syntaxError.wrongGeoJson.message)
                .with.property('code', errorMessage.syntaxError.wrongGeoJson.code)
            })
            it('must throw error: wrong longtitude - over 180', ()=>{
                expect(()=> GeoJson({userId: 'userId', coordinates: [181, 90]}))
                .to.throw(Error, errorMessage.syntaxError.wrongGeoJson.message)
                .with.property('code', errorMessage.syntaxError.wrongGeoJson.code)
            })
            it('must throw error: wrong latitude - below -90', ()=>{
                expect(()=> GeoJson({userId: 'userId', coordinates: [-180, -91]}))
                .to.throw(Error, errorMessage.syntaxError.wrongGeoJson.message)
                .with.property('code', errorMessage.syntaxError.wrongGeoJson.code)
            })
            it('must throw error: wrong latitude - over 90', ()=>{
                expect(()=> GeoJson({userId: 'userId', coordinates: [180, 91]}))
                .to.throw(Error, errorMessage.syntaxError.wrongGeoJson.message)
                .with.property('code', errorMessage.syntaxError.wrongGeoJson.code)
            })
        })
    })
    describe("generating meet matching model", ()=>{
        describe("successful model", ()=>{
            const meetMatching = MeetMatching({
                userId: 'a',
                location: {
                    type: "Point",
                    coordinates: [10, 20]
                },
                timestamp: new Date(),
                meet: [{
                    userId: "A",
                    location: {
                        type: "Point",
                        coordinates: [100, 9]
                    },
                    timestamp: new Date()
                }]
            })
            it("must have _id", ()=>{
                expect(meetMatching)
                .to.have.property('_id')
                .and.to.be.a('string')
            })
            it("must have userId", ()=>{
                expect(meetMatching)
                .to.have.property("userId")
                .and.to.be.a("string")
            })
            it("must have location object", ()=>{
                expect(meetMatching)
                .to.have.property('location')
                .and.to.be.an('object')
            })
            it("must have type nested in location", ()=>{
                expect(meetMatching.location)
                .to.have.property('type')
                .to.be.a('string')
            })
            it("must have coordinates nested in location", ()=>{
                expect(meetMatching.location)
                .to.have.property('coordinates')
                .and.to.be.an('array')
                .and.to.have.all.keys(0,1)
            })
            it("must have timestamp", ()=>{
                expect(meetMatching)
                .to.have.property('timestamp')
                .and.to.be.a('date')
            })
            it("must have meet array and length of at least 1", ()=>{
                expect(meetMatching)
                .to.have.property('meet')
                .and.to.be.an('array')
                .to.have.lengthOf.at.least(1)
            })  
        })
        describe("null error", ()=>{
            it("must throw error: no user id", ()=>{
                expect(()=> MeetMatching())
                .to.throw(Error, errorMessage.nullError.idMissing.message)
                .with.property('code', errorMessage.nullError.idMissing.code)
            })
            it("must throw error: no location", ()=>{
                expect(()=> MeetMatching({userId: 'a'}))
                .to.throw(Error, errorMessage.nullError.locationMissing.message)
                .with.property('code', errorMessage.nullError.locationMissing.code)
            })
            it("must throw error: no timestamp", ()=>{
                expect(()=> MeetMatching({userId: 'A', location: 'b'}))
                .to.throw(Error, errorMessage.nullError.timestampMissing.message)
                .with.property('code', errorMessage.nullError.timestampMissing.code)
            })
            it("must throw error: no meet array", ()=>{
                expect(()=> MeetMatching({userId: "a", location: 'b', timestamp: 'c'}))
                .to.throw(Error, errorMessage.nullError.meetMissing.message)
                .with.property('code', errorMessage.nullError.meetMissing.code)
            })
        })
        describe("syntax error", ()=>{
            it("must throw error: meet not array" , ()=>{
                expect(()=> MeetMatching({userId: "a", location: 'b', timestamp: 'c', meet: {}}))
                .to.throw(TypeError, errorMessage.syntaxError.meetNotArray.message)
                .with.property("code", errorMessage.syntaxError.meetNotArray.code)
            })
        })
    })
})