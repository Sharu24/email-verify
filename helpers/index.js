const nodemailer = require("nodemailer");
const config = require("../config");

const helpers = {};

helpers.verifyEmail = async (email, token) => {
  let transporter = await nodemailer.createTransport(config.mailServer);

  transporter
    .sendMail({
      from: '"Sharu Infotech Limited"<admin@isharu.in>',
      to: email,
      subject: "Welcome to Sharu Infotech Limited - Email Verification",
      html: `
            <h1>Please Click on the following link to verify your email</h1>
            <p><b><a href='http://localhost:3000/users/verify/${token}'>click Me</a></b></p>
            `
    })
    .then(info => {
      console.log("Message Sent %", info.messageId);
    })
    .catch(err => console.log("Error - ", err));
};

module.exports = helpers;
