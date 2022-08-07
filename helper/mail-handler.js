import { config } from "dotenv";
import nodemailer from "nodemailer";
config({ path: "config/.env" });
const mail_handler = {
  sendMail,
};
export { mail_handler };

async function sendMail(mail, subject, content) {
  try {
    const mailConfig = {
      service: "Naver",
      host: "smtp.naver.com",
      port: 587,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    };
    let message = {
      from: process.env.MAIL_USER,
      to: mail,
      subject: subject,
      text: content,
    };
    let transporter = nodemailer.createTransport(mailConfig);
    transporter.sendMail(message);
  } catch (err) {
    console.log(err);
    throw err;
  }
}
