import multer from "multer";
import multers3 from "multer-s3";
import cors from "cors";
import { getExtname, s3, __dirname } from "../helper/file-handler.js";
import { config } from "dotenv";
import { generateId } from "../helper/id-generator.js";
config({ path: "config/.env" });

export { cors, uploadRegisterFile, uploadNoticeFiles, uploadS3 };
// ANCHOR option
const megabyte_5 = 20 * 1024 * 1024;
// ANCHOR uploader
const upload = multer({
  storage: multers3({
    s3: s3,
    bucket: process.env.S3_BUCKET,
    key: (req, file, cb) => {
      const fileName =
        Date.now().toString() +
        "-" +
        generateId() +
        getExtname(file.originalname);
      cb(null, fileName);
    },
    contentType: (req, file, cb) => cb(null, file.mimetype),
    acl: (req, file, cb) => cb(null, "public-read"),
  }),
  limits: { fileSize: megabyte_5 },
});
const uploadS3 = upload.array("files");
const uploadRegisterFile = upload.fields([
  { name: "main" },
  { name: "sub" },
  { name: "pictures" },
]);
const uploadNoticeFiles = upload.array("inserted");
