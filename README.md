# matching-app server

거리기반 매칭앱

.env.sample 참고하여 .env 작성

## Environment
* encoding = utf-8
* NodeJS@16
* express
* node
* mongodb
* radis
* client port 3000
* server client proxy -> /api

### Package Setup
[npm](https://www.npmjs.com/)
* npm install 
 * express
 * dotenv
 * cors
 * crypto
 * jsonwebtoken
 * mongodb
 * axios
 * multer
 * multer-s3
 * node-cache
 * node-schedule
 * nodemailer
 * passport
 * passport-apple
 * passport-facebook
 * passpoer-google-oauth20
 * passport-naver
 * passport-kakao
 * passport-jwt
 * redis
 * socket.io
 * uuid
* 실행 실패 시 npm i 후 테스트 진행

### App Start
* linux server
 * ```$ npm install -g pm2```
 * ```$ pm2 start server/app.js -i 4 --name "app"```
* local
  * ```$ node server/app```
