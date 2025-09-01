const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async (email, subject, text) => {
    try {
        await sgMail.send({
            to: email,
            from: process.env.EMAIL_FROM, // email đã xác thực với SendGrid
            subject: subject,
            html: text, // hoặc template HTML
        });
    } catch (error) {
        console.error(error);
        throw error;
    }
};

module.exports = { sendEmail };
