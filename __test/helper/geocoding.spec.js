import { expect } from "chai"
import { geocoder } from "../../helper/geocoding.js"

describe('주소 -> 좌표 변환 테스트 네이버', () => { 
    it('주소 -> 좌표 제대로 변환해야 함', async()=>{
        const addr = '제주특별자치도 서귀포시 신중로 55 '
        const {coordinates, sido} = await geocoder.getCoordinatesFromAddress(addr)
        console.log(coordinates[1] + ', '+ coordinates[0])
        expect(coordinates).to.be.an('array').to.be.lengthOf(2)
    })
 })