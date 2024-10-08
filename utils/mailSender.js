const nodemailer = require("nodemailer");

const mailSender = async (email, title, body, attachment = null) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_PORT,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    // Create the email options
    const mailOptions = {
      from: 'Moseta - Renewable luxury',
      to: `${email}`,
      subject: `${title}`,
      html: `${body}`,
      attachments: attachment ? [attachment] : [], // Include attachment if provided
    };

    let info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.log(error);
  }
};

module.exports = mailSender;
