import dotenv from "dotenv";
import axios from "axios";
import crypto from "crypto";
dotenv.config({ path: "config/.env" });

export const sms = { sendSMS };

/**
 * send sms by naver api
 * @param {String} phone
 * @param {String} code
 * @returns result or throw error
 * @error log & throws
 */
async function sendSMS(phone, code) {
  try {
    const user_phone_number = phone.toString();
    const timestamp = Date.now().toString();
    const content = `[Meet] 인증번호 [${code}]를 입력해주세요.`;

    const content_type = "application/json";
    const accessKey = process.env.NAVER_API_ACCESS_KEY_ID.toString();
    const signature = makeSignature(timestamp);

    const serviceId = process.env.NAVER_SENS_SERVICE_ID.toString();
    const url = `https://sens.apigw.ntruss.com/sms/v2/services/${serviceId}/messages`;

    const config = {
      headers: {
        "Content-Type": content_type,
        "x-ncp-apigw-timestamp": timestamp,
        "x-ncp-iam-access-key": accessKey,
        "x-ncp-apigw-signature-v2": signature,
      },
    };
    const body = {
      type: "SMS",
      from: process.env.NAVER_SENS_FROM_NUMBER.toString(),
      content: content,
      messages: [
        {
          to: user_phone_number,
        },
      ],
    };
    const result = await axios.post(url, body, config);
    return result;
  } catch (err) {
    console.log(err.response ? err.response.data : err);
    throw err.response ? err.response.data : err;
  }
}

/**
 * make signature for header
 * @param {String} timestamp
 * @returns signature (string)
 */
function makeSignature(timestamp) {
  try {
    const message = [];
    const serviceId = process.env.NAVER_SENS_SERVICE_ID.toString();
    const hmac = crypto.createHmac("sha256", process.env.NAVER_API_SECRET_KEY);
    const url = `/sms/v2/services/${serviceId}/messages`;
    const space = " ";
    const newLine = "\n";
    const method = "POST";

    message.push(method);
    message.push(space);
    message.push(url);
    message.push(newLine);
    message.push(timestamp);
    message.push(newLine);
    message.push(process.env.NAVER_API_ACCESS_KEY_ID);
    //message 배열에 위의 내용들을 담아준 후에
    const signature = hmac.update(message.join("")).digest("base64");
    //message.join('') 으로 만들어진 string 을 hmac 에 담고, base64로 인코딩한다
    return signature.toString(); // toString()이 없었어서 에러가 자꾸 났었는데, 반드시 고쳐야함.
  } catch (err) {
    console.log(err.response ? err.response.data : err);
    throw err.response ? err.response.data : err;
  }
}
