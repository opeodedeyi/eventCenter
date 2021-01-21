const nodemailer = require('nodemailer')
const nodemailerSendgrid = require('nodemailer-sendgrid')
require('dotenv').config()

const transport = nodemailer.createTransport(
    nodemailerSendgrid({
        apiKey: process.env.SENDGRID_API_KEY
    })
);


const sendEmail = async (user, title, body) => {

    transport.sendMail({
        from: 'opeyemiodedeyi@gmail.com',
        to: `${user.fullname} <${user.email}>`,
        subject: title,
        html: `
        <!DOCTYPE html>
        <html>
        <header>
          <title>Event center</title>
        </header>
        
        <body style="background-color: #E9ECF2;">
          <center>
            <table style="color: #627085;
                          font-family: 'ProximaNova-Regular', Helvetica, Arial, sans-serif;
                          max-width:500px;">
        
            </table>
            <table style="background-color: #fff;
                            font-family: 'ProximaNova-Regular', Helvetica, Arial, sans-serif;
                            font-size: 0.9rem;
                            color: #627085;
                            max-width:500px;
                            border-radius:4px;
                            margin: 20px 20px 20px 20px;
                            padding: 40px;
                            box-shadow:0 1px 3px #B7C0CC, 0 1px 2px #B7C0CC;">
              <tr>
                <td style="font-size: 1.4rem;
                  padding-top:20px;padding-bottom:20px;">${title}</td>
              </tr>
              <tr>
                <td style="padding-top:20px;
                           padding-bottom:10px;">Hey ${user.fullname},</td>
              </tr>
              <tr style="padding-top:5px;padding-bottom:20px;">
                <td style="padding-bottom:20px;margin-bottom:20px;">
                  ${body}
                </td>
              </tr
                
              <tr style="padding-top:40px;padding-bottom:30px;">
                <td style="padding-bottom:10px;margin-bottom:10px;">Sincerely,</td>
              </tr>
              <tr><td style="padding-bottom:10px;margin-bottom:10px;">Center Team</td></tr>
            </table>
          </center>
        </body>
        
        </html>
        `
    }).then( () => {
        console.log('Email Sent');
    }).catch( () => {
        console.log('Email not sent');
    })
}


module.exports = {
    sendEmail
};
