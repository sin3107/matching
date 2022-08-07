import { config } from "dotenv";
import axios from "axios";
export const geocoder = { getCoordinatesFromAddress };

config({ path: "config/.env" });
/**
 *
 * @param {String} fullAddress
 * @returns {Promise<{roadAddress: String, coordinates: Array, sido: String}>}
 */
async function getCoordinatesFromAddress(fullAddress) {
  try {
    const headers = {
        "X-NCP-APIGW-API-KEY-ID": process.env.NAVER_MAP_CLIENT_ID,
        "X-NCP-APIGW-API-KEY": process.env.NAVER_MAP_CLIENT_SECRET,
      },
      params = { query: fullAddress },
      url = process.env.NAVER_MAP_API_URL;
    const {
      data: { addresses },
    } = await axios.get(url, { headers, params });
    //console.log(addresses[0].addressElements)
    const roadAddress = addresses[0].roadAddress,
      coordinates = [Number(addresses[0].x), Number(addresses[0].y)],
      sidoArr = addresses[0].addressElements
        .map((m) => {
          if (m.types.find((t) => t === "SIDO")) return m;
        })
        .filter((x) => x),
      sido = sidoArr[0].longName;
    return {
      roadAddress,
      coordinates,
      sido,
    };
  } catch (err) {
    console.log(err.response ? err.response.data : err);
    throw err;
  }
}
