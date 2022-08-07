import * as vision from "@google-cloud/vision";
import { getBaseFileName, getFileFromS3 } from "./file-handler.js";
const client = new vision.ImageAnnotatorClient();

const likelihood = {
  UNKNOWN: -1,
  VERY_UNLIKELY: 0,
  UNLIKELY: 1,
  POSSIBLE: 2,
  LIKELY: 3,
  VERY_LIKELY: 4,
};
Object.freeze(likelihood);

const safeSearchImage = async ({ pictures, filterLevel }) => {
  try {
    const results = [];
    let pass = true;
    for (const pic of pictures) {
      const baseFileName = getBaseFileName(pic);
      const buffer = await getFileFromS3(baseFileName);
      const res = await client.safeSearchDetection(buffer);
      const { adult, spoof, medical, violence, racy } =
        res[0].safeSearchAnnotation;
      const filtered =
        filterLevel > likelihood[adult] &&
        filterLevel > likelihood[spoof] &&
        filterLevel > likelihood[medical] &&
        filterLevel > likelihood[violence] &&
        filterLevel > likelihood[racy];
      results.push(filtered);
      pass = pass && filtered;
    }
    return { pass, results };
  } catch (e) {
    console.log(e);
    return { pass: true, results: [true, true, true, true, true] };
  }
};

export const googleCloudVision = { safeSearchImage };
