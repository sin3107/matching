import { config } from "dotenv";
import axios from "axios";
export const googleIAP = { getGoogleReceiptValidation };

config({ path: "config/.env" });
/**
 *
 * @param {String} receiptData
 * @returns {Promise<{}>}
 */

async function getGoogleReceiptValidation(receiptData) {
  try {
    (body = {}),
      (url = `https://www.googleapis.com/androidpublisher/v2/applications/${packageName}/purchases/products/${productId}/tokens/${token}?access_token=${tokenStorage.access_token}`);
    const data = await axios.get(url, { body });
    return {
      data,
    };
  } catch (err) {
    console.log(err.response ? err.response.data : err);
    throw err;
  }
}
