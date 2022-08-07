import {
    expect,
    use
} from "chai";
import chaiPromise from 'chai-as-promised'
import {
    redis_handler
} from "../../helper/redis-handler.js";
use(chaiPromise);

describe('레디스 테스트', () => {
    describe('군집 반경 얻기', () => {
        let groupRadius;
        before(async () => groupRadius = await redis_handler.getGroupRadius())
        it('should have all keys: radius, unit', () =>
            expect(groupRadius).to.have.all.keys('radius', 'unit'))
        it('should be a string but can convert to number: radius', () => {
            expect(groupRadius).to.haveOwnProperty('radius').to.be.a("string") &&
                expect(groupRadius.radius).to.satisfy((radius) => {
                    return Number(radius)
                })
        })
        it('should be a string: unit', () =>
            expect(groupRadius).to.haveOwnProperty('unit').to.be.a("string"))
    });
    describe('유저 크로스 반경 얻기', () => {
        let userRadius;
        before(async () => userRadius = await redis_handler.getUserRadius())
        it('should have all keys: radius, unit', () =>
            expect(userRadius).to.have.all.keys('radius', 'unit'))
        it('should be a string but can convert to number: radius', () => {
            expect(userRadius).to.haveOwnProperty('radius').to.be.a("string") &&
                expect(userRadius.radius).to.satisfy((radius) => {
                    return Number(radius)
                })
        })
        it('should be a string: unit', () =>
            expect(userRadius).to.haveOwnProperty('unit').to.be.a("string"))
    });
    // NOTE 이거 잘못될 가능성은? 이게 거의 db handler 급이라 use -case 에서 다 걸러주긴 할꺼지만... 한번 살펴보기
    it("군집에 새로운 정보 저장", async () => {
        const member = 'test'
        await redis_handler.upsertGroupToList([10, 30], member)
        const check = await redis_handler.getCoordinates('locations:list', member)
        expect(check).to.be.an("array")
    })

    it('군집 중심 좌표 이동하기', async () => {
        const member = 'test',
        newCoord = ['40','30'],
        redisWillSaveAs = [40.000000298023224, 30.000000249977013]
        await redis_handler.upsertGroupToList(newCoord, member)
        const check = await redis_handler.getCoordinates('locations:list', member)
        expect(check).to.be.an('array')
    })
    it('유저를 그룹에 저장하기', async () => {
        
    })
    it('모든 군집 가져오기', async () => {})
    it("군집 1개 안에 있는 모든 유저 가져오기", async () => {})
    it('key 안에 있는 해당 member의 좌표 가져오기', async () => {})
    it('가까운 군집 1개 찾기', async () => {})
    it("가까운 유저들 찾기", async () => {})
    it("군집 안 유저들 지우기", async () => {})
    it("군집 리스트 지우기", async () => {})
    it("매칭 정보 저장하기", async () => {})
    it('매칭 리스트 가져오기', async () => {})
    it('매칭 리스트 지우기', async () => {})
    it('차단 정보 저장하기', async () => {})
    it('유저의 차단 정보 전부 가져오기', async () => {})
    it("차단 리스트 삭제하기", async () => {})
});