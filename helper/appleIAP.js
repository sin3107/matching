import { config } from "dotenv";
import axios from "axios";
export const appleIAP = { getAppleReceiptValidation };

config({ path: "config/.env" });
/**
 *
 * @param {String} fullAddress
 * @returns {Promise<{roadAddress: String, coordinates: Array, sido: String}>}
 */

async function getAppleReceiptValidation(receiptData) {
  try {
    // https://buy.itunes.apple.com/verifyReceipt

    // 테스트결제 코드입니다.
    // 실 데이터로 결제시에는 데이터 수정 및 상단 url 입력해야 합니다.
    let body = { "receipt-data": receiptData };
    let url = "https://sandbox.itunes.apple.com/verifyReceipt";
    const data = await axios.post(url, JSON.stringify(body));
    return data;
  } catch (err) {
    console.log(err.response ? err.response.data : err);
    throw err;
  }
}
