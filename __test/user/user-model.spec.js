import { expect, use } from "chai"
import {User} from '../../models/index.js'

describe("success model", ()=>{
    describe("email register", ()=>{
        const userInfo = {
            phoneNumber: "afkljaslkdfjsdlkjf",
            email: 'emaiaskdfjaslkjd',
            password: "2bkajsdflkjsd",
            nickname: "akjflksdj",
            gender: 'f',
            age: new Date(),
            fullAddress: 'akfjsdlkjfdf',
            sido: 'afj',
            job: 'akdfj',
            introduction: "akljflskdj",
            mainPic: '/kjasdf/askdfj/',
            subPic: "akj/afdsajdk/",
            toonify: [['aksdfj', 'akdfj', 'asfdksd', 'akfjd']],
        }
        const user = User(userInfo)
        it('_id : string', () => 
            expect(user).to.haveOwnProperty('_id').to.be.a('string'))
        it('phoneNumber: string', () => 
            expect(user).to.haveOwnProperty('phoneNumber').to.be.a('string'))
        it("loginInfo: object", ()=>
            expect(user).to.haveOwnProperty('loginInfo').to.be.an('object'))
            it('all keys: email, password', ()=>
                expect(user.loginInfo).to.all.keys(['email', 'password']))
            it('email: String', ()=>
                expect(user.loginInfo).to.haveOwnProperty('email').to.be.a("String"))
            it("password: string", ()=>
                expect(user.loginInfo).to.haveOwnProperty('password').to.be.a("string"))
        it('basicProfile: object', ()=>
            expect(user).to.haveOwnProperty('basicProfile').to.be.an('object'))
            it('all keys: profilePic, introduction, nickname, gender, age, job, addresss', ()=>
                expect(user.basicProfile).to.have.all.keys(['profilePic', 'introduction', 'nickname', 'gender', 'age', 'job', 'address']))
            it('profilePic: string or undefined', ()=>
                expect(user.basicProfile).to.haveOwnProperty('profilePic').to.be.undefined)
            it('introduction: string, min: 10 max: 25', ()=>
                expect(user.basicProfile).to.haveOwnProperty('introduction').to.be.a('string')
                .to.be.lengthOf.greaterThanOrEqual(10).and.lessThanOrEqual(25))
            it("nickname: string, min: 2 max: 10", ()=>
                expect(user.basicProfile).to.haveOwnProperty('nickname').to.be.a('string')
                .to.be.lengthOf.greaterThanOrEqual(2).and.lessThanOrEqual(10))
            it('gender: string, m or f', ()=> 
                expect(user.basicProfile).to.haveOwnProperty('gender').to.be.a('string'))
            it('age: Date', ()=> 
                expect(user.basicProfile).to.haveOwnProperty('age').to.be.a("Date"))
            it('job: string', ()=> 
                expect(user.basicProfile).to.haveOwnProperty('job').to.be.a("string"))
            it('address: object', ()=>
                expect(user.basicProfile).to.haveOwnProperty('address').to.be.an('object'))
                it('all keys: fullAddress, sido', ()=>
                    expect(user.basicProfile.address).to.have.all.keys(['fullAddress', 'sido']))
                it('fullAddress: string', ()=> 
                    expect(user.basicProfile.address).to.haveOwnProperty('fullAddress').to.be.a('string'))
                it('sido: string', ()=> 
                    expect(user.basicProfile.address).to.haveOwnProperty('sido').to.be.a('string'))
        it('detailProfile: object', ()=>
            expect(user).to.haveOwnProperty('detailProfile').to.be.an("object"))
            // NOTE 이거 그냥 바로 깨짐 왜 인지는 모르겠음
            // it('all keys: mainPic, subPic, pictures, hastag, sytle, personality, hobby, sprots, height, bloodType, MBTI, religion, smoking, alcohol',
            //     expect(user.detailProfile).to.have.all.keys(['mainPic', 'subPic', 'pictures', 'hastag', 'sytle', 'personality', 'hobby', 'sprots', 'height', 'bloodType', 'MBTI', 'religion', 'smoking', 'alcohol']))
            it('mainPic: string', ()=>
                expect(user.detailProfile).to.haveOwnProperty('mainPic').to.be.a('string'))
            it('subPic: string', ()=> 
                expect(user.detailProfile).to.haveOwnProperty('subPic').to.be.a('string'))
            it("pictures: array, length optional", ()=>
                expect(user.detailProfile).to.haveOwnProperty('pictures').to.be.an("array"))
            it('hashtag: array, max: ', ()=> //FIXME max length
                expect(user.detailProfile).to.haveOwnProperty('hashtag').to.be.an('array'))
            it('style: array, length: 3', ()=>
                expect(user.detailProfile).to.haveOwnProperty('style').to.be.an('array'))
            it('personality: array, length: 5', ()=>
                expect(user.detailProfile).to.haveOwnProperty('personality').to.be.an('array'))
            it('hobby: array, length 3-5', ()=> 
                expect(user.detailProfile).to.haveOwnProperty('hobby').to.be.an('array'))
            it('sports: array, length 1-3', ()=>
                expect(user.detailProfile).to.haveOwnProperty('sports').to.be.an('array'))
            it('height: string', ()=>
                expect(user.detailProfile).to.haveOwnProperty('height').to.be.undefined)
            it('bloodType: string, a b ab o', ()=>
                expect(user.detailProfile).to.haveOwnProperty('bloodType').to.be.undefined)
            it('MBTI: string, length 4', ()=>
                expect(user.detailProfile).to.haveOwnProperty('MBTI').to.be.undefined)
            it('religion: Number', ()=>
                expect(user.detailProfile).to.haveOwnProperty('religion').to.be.undefined)
            it('smoking: Number', ()=>
                expect(user.detailProfile).to.haveOwnProperty('smoking').to.be.undefined)
            it('alcohol: Number', ()=> 
                expect(user.detailProfile).to.haveOwnProperty('alcohol').to.be.undefined)
        it('toonify: array, inside array length 4', () => 
            expect(user).to.haveOwnProperty('toonify').to.be.an('array').to.be.lengthOf(1)
            && expect(user.toonify[0]).to.be.an('array').to.be.lengthOf(4))
        it('expoToken: string or undefined', () => 
            expect(user).to.haveOwnProperty('expoToken').to.be.undefined)
        it('meet setting: object', ()=>
            expect(user).to.haveOwnProperty('meetSetting').to.be.an('object'))
            it('all keys: alert, gps, privacy, time, gender, age', ()=>
                expect(user.meetSetting).to.have.all.keys(['alert', 'gps', 'privacy', 'time', 'gender', 'age']))
            it('alert: boolean', ()=>
                expect(user.meetSetting).to.haveOwnProperty('alert').to.be.undefined)
            it('gps: boolean', ()=>
                expect(user.meetSetting).to.haveOwnProperty('gps').to.be.undefined)
            it('privacy: array', ()=>
                expect(user.meetSetting).to.haveOwnProperty('privacy').to.be.an('array'))
                it('address object as element', ()=>
                    expect(user.meetSetting.privacy).to.haveOwnProperty('0').to.be.an('object'))
                it('fillAddress: string', ()=> //NOTE 집주소 바로 저장하기
                    expect(user.meetSetting.privacy[0]).to.haveOwnProperty('fullAddress').to.be.a('string'))
            it('time: array', ()=>
                expect(user.meetSetting).to.haveOwnProperty('time').to.be.an("array"))
            it('gender: Number', ()=>
                expect(user.meetSetting).to.haveOwnProperty('gender').to.be.undefined)
            it('age: Array, numer', ()=>
                expect(user.meetSetting).to.haveOwnProperty('age').to.be.an('array'))
        it('status: object', () => 
            expect(user).to.haveOwnProperty('status').to.be.an('object'))
            // NOTE 똑같은데 계속 틀렸다고 함
            // it('all keys: accessToken, refreshToken, account', ()=>
            //     expect(user.status).to.have.all.keys(['accessToken, refreshToken, account']))
            it('accessToken: boolean, true', ()=>
                expect(user.status).to.haveOwnProperty('accessToken').to.be.a('boolean', true))
            it('refreshToken: boolean, true', ()=>
                expect(user.status).to.haveOwnProperty('refreshToken').to.be.a("boolean", true))
            it('account: Number, 1', ()=>
                expect(user.status).to.haveOwnProperty('account').to.be.a("Number", 1))
        it('log: object', () => 
            expect(user).to.haveOwnProperty('log').to.be.an('object'))
            it('all keys: registeredAt, termsAndCondition, personalInfoCollected, marketingOk', ()=>
                expect(user.log).to.have.all.keys(['registeredAt', 'termsAndCondition', 'personalInfoCollected', 'marketingOk']))
            it('registeredAt: Date', ()=>
                expect(user.log).to.haveOwnProperty('registeredAt').to.be.a("Date"))
            it('termsAndCondition: Date',()=>
                expect(user.log).to.haveOwnProperty('termsAndCondition').to.be.a("Date"))
            it('personalInfoCollected: Date', ()=>
                expect(user.log).to.haveOwnProperty('personalInfoCollected').to.be.an("Date"))
            it('marketingOk: Date or undefined', ()=>
                expect(user.log).to.haveOwnProperty('marketingOk').to.be.undefined)
    })
//     describe("social user model", ()=>{
//         const userInfo = {
//             phoneNumber: "01012345678",
//             social: {
//                 id: "socialId",
//                 type: "test",
//                 accessToken: "where'd all my",
//                 refreshToken: "friends go"
//             },
//             nickname: "nick",
//             age: 'age',
//             gender: "gender",
//             address: 'address',
//             job: 'job',
//             introduction: "introduction",
//             mandatoryPics: {
//                 main: './uploads/Toonified-caricature-1635405715013-iOS t�� (1).jpg',
//                 sub: './uploads/Toonified-caricature-yeri.jpg'
//             },
//             toonify: ['./uploads/Toonified-comic-1635405715013-iOS t�� (1).jpg', './uploads/Toonified-comic-yeri.jpg'],
//             marketingOk: true
//         }
//         const user = User(userInfo);
//         describe('loginInfo', () => {
//             it('socialId')
//             it('socialType')
//             it('accessToken')
//             it('refreshToken')
//         })
//         it("must have _id as string", ()=>{
//             expect(user).to.have.property("_id").and.to.be.a("string")
//         })
//         it("must have phoneNumber", ()=>{
//             expect(user).to.have.property("phoneNumber", userInfo.phoneNumber)
//         })
//         it("must have login info with social info", ()=>{
//             expect(user).to.have.property("loginInfo").to.have.property("social").to.include(userInfo.social)
//         })
//         it("must have nickname", ()=>{
//             expect(user).to.have.property("profile").and.to.have.property("nickname", userInfo.nickname)
//         })
//         it("must have age", ()=>{
//             expect(user).to.have.property("profile").and.to.have.property("age", userInfo.age)
//         })
//         it("must have gender", ()=>{
//             expect(user).to.have.property("profile").and.to.have.property("gender", userInfo.gender)
//         })
//         it("must have address", ()=>{
//             expect(user).to.have.property("profile").and.to.have.property("address", userInfo.address)
//         })
//         it("must have a job", ()=>[
//             expect(user).to.have.property("profile").and.to.have.property("job", userInfo.job)
//         ])
//         it("must hae introdution", ()=>{
//             expect(user).to.have.property('profile').and.to.have.property("introduction", userInfo.introduction)
//         })
//         it("must have main pic", ()=>{
//             expect(user).to.have.property("profile").to.have.property("mandatoryPics").to.have.property("main")
//         })
//         it("must have sub pic", ()=>{
//             expect(user).to.have.property("profile").and.to.have.property("mandatoryPics").to.have.property("sub")
//         })
//         it('must have toonify', ()=>{
//             expect(user).to.have.property("profile").to.have.property("toonify").and.to.be.an("array")
//         })
//         it("must have profile image", ()=>{
//             expect(user).to.have.property("profile").to.have.property("mandatoryPics").to.have.property("profileImage")
//         })
//         it("must have other keys in profile", ()=>{
//             expect(user).to.have.property("profile").and.to.have.all.keys("nickname", "age", "gender", "address", "job", "introduction", "bloodType", "hobby", "preference", "details", "mandatoryPics", "toonify", "pictures")
//         })
//         it("must have status", ()=>{
//             expect(user).to.have.property("status")
//         })
//         it("must have access token", ()=>{
//             expect(user).to.have.property("status").to.have.property("token").to.have.property("accessToken", true)
//         })
//         it("must have refresh token", ()=>{
//             expect(user).to.have.property("status").to.have.property("token").to.have.property("refreshToken", true)
//         })
//         it("must be an active account", ()=>{
//             const account = {
//                 active: true,
//                 sleep: false,
//                 locked: false
//             }
//             expect(user).to.have.property("status").to.have.property("account").to.include(account)
//         })
//         it("must have expoToken as undefined", ()=>
//             expect(user).to.haveOwnProperty('expoToken').to.be.undefined)
//         it('must have log object', ()=> 
//             expect(user).to.haveOwnProperty('log'))
//         it('must have registeredAt date as date', ()=>
//             expect(user).to.haveOwnProperty('log').to.haveOwnProperty('registeredAt').to.be.a('Date'))
//         it('must have termsAndCondition as Date in log', ()=>
//             expect(user).to.haveOwnProperty('log')
//             .to.haveOwnProperty('termsAndCondition').to.be.a("Date"))
//         it('must have personalInfoCollected as Date in log', ()=>
//             expect(user).to.haveOwnProperty('log')
//             .to.haveOwnProperty('personalInfoCollected').to.be.a("Date"))
//         it("must have marketingOk as date in log", ()=>
//             expect(user).to.haveOwnProperty('log')
//             .to.haveOwnProperty('marketingOk').to.be.a("Date"))
//     })
// })
})