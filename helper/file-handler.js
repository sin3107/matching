import Path, { extname } from "path";
import aws from "aws-sdk";
import { config } from "dotenv";
config({ path: "config/.env" });
const __dirname = Path.resolve();
aws.config.loadFromPath(__dirname + "/config/awsconfig.json");
const s3 = new aws.S3({});

export {
  saveImage,
  getBaseFileName,
  deleteFile,
  __dirname,
  s3,
  getFileFromS3,
  getExtname,
};
/**
 * @param {String} b64_encoded_output
 * @param {String} newFileName
 * @returns {Promise<String>} s3 object URL
 * @error log & throw
 *
 */
function saveImage(b64_encoded_output, newFileName) {
  try {
    const base64Buffer = Buffer.from(b64_encoded_output, "base64");
    s3.putObject(
      {
        ACL: "public-read",
        Body: base64Buffer,
        Bucket: process.env.S3_BUCKET,
        Key: newFileName,
        ContentType: "image",
      },
      (err) => console.log(err)
    );
    return `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${newFileName}`;
  } catch (err) {
    console.log(err);
    throw err;
  }
}
/**
 * get file name and return the base file name
 * @param {String} fileName
 * @returns {String} base file name
 * @error log & throw
 */
function getBaseFileName(fileName) {
  try {
    const arr = fileName.split("/");
    return arr[arr.length - 1];
  } catch (err) {
    console.log(err);
    throw err;
  }
}
/**
 * DELETE file
 * @param {string} fileName
 * @returns {Promise}
 * @error log
 */
function deleteFile(fileName) {
  const key = getBaseFileName(fileName);
  s3.deleteObject(
    {
      Bucket: process.env.S3_BUCKET,
      Key: key,
    },
    (err) => console.log(err)
  );
}
/**
 * get file key and return buffer
 * @param {String} fileName s3 key
 * @returns {Promise<Buffer>}
 */
async function getFileFromS3(fileName) {
  try {
    const { Body } = await s3
      .getObject({
        Bucket: process.env.S3_BUCKET,
        Key: fileName,
      })
      .promise();
    return Body;
  } catch (err) {
    console.log(err);
    throw err;
  }
}
function getExtname(fileName) {
  try {
    return extname(fileName);
  } catch (err) {
    console.log(err);
  }
}
