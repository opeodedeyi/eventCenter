const nodemailer = require('nodemailer')
const nodemailerSendgrid = require('nodemailer-sendgrid')
const jwt = require('jsonwebtoken')
require('dotenv').config()

const transport = nodemailer.createTransport(
    nodemailerSendgrid({
        apiKey: process.env.SENDGRID_API_KEY
    })
);

const sendConfirmationEmail = async (user) => {

    const token = await jwt.sign({ 
        _id: user._id.toString() 
    }, process.env.JWT_SECRET_KEY, { expiresIn: '24h' })

    const url = `http://localhost:3000/api/confirmation/${token}`

    transport.sendMail({
        from: `opeyemiodedeyi@gmail.com`,
        to: `${user.fullname} <${user.email}>`,
        subject: 'Confirmation Email',
        html: `
            <!DOCTYPE html>
            <html>
            <header>
                <title>Confirmation email</title>
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
                    padding-top:20px;padding-bottom:20px;">Please confirm your email!</td>
                </tr>
                <tr>
                    <td style="padding-top:20px;padding-bottom:20px;padding-bottom:20px;margin-bottom:10px;">Hey ${user.fullname},</td>
                </tr>
                <tr style="padding-top:5px;padding-bottom:20px;">
                    <td style="padding-bottom:10px;margin-bottom:10px;">We're excited to have you get started. First, you need to confirm your account. Just press the button below and get verified. The link will expire in 24 hours.</td>
                </tr>
                    
                <tr style="padding-top:40px;padding-bottom:30px;">
                    <td style="padding-bottom:10px;margin-bottom:10px;">Sincerely,</td>
                </tr>
                <tr><td>${process.env.COMPANY_NAME}</td></tr>
                <tr>
                    <td style="padding-top:40px;"><a href="${url}"><input value="Confirm Email" type="button" style="background: #4D69B4;
                    padding: 15px 40px;
                    border-radius: 22.2px;
                    border: none;
                    color:#fff;
                    font-size:0.9rem;
                    cursor:pointer"/>
                    </a>
                    </td>
                </tr>
                </table>
            </center>
            </body>
            
            </html>
        `
    }).then( () => {
        console.log('Confirmation Email Sent');
    }).catch( () => {
        console.log('Confirmation Email not sent');
    })
}


const sendPasswordResetEmail = async (user) => {

    const token = await jwt.sign({ 
        _id: user._id.toString() 
    }, process.env.JWT_SECRET_KEY, { expiresIn: '24h' })

    const url = `http://localhost:3000/api/resetpassword/${token}`

    transport.sendMail({
        from: 'opeyemiodedeyi@gmail.com',
        to: `${user.fullname} <${user.email}>`,
        subject: 'Password Reset Email',
        html: `
            <!DOCTYPE html>
            <html>
            <header>
                <title>Password reset</title>
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
                    <td style="padding-top:20px;
                            padding-bottom:10px;">Hey ${user.fullname},</td>
                </tr>
                <tr>
                    <td style="font-size: 1.4rem;
                    padding-top:20px;padding-bottom:20px;margin-bottom:20px;">You have requested to reset your password</td>
                </tr>
                
                <tr style="padding-top:20px;padding-bottom:20px;margin-bottom:20px;">
                    <td style="padding-bottom:10px;margin-bottom:10px;">A unique link to reset your password has been generated for you. To reset your password, click the following button below and follow the instructions. The link will expire in 24 hours.</td>
                </tr>

                <tr style="padding-top:20px;padding-bottom:20px;margin-bottom:20px;">
                    <td style="padding-bottom:10px;margin-bottom:10px;">If you didnt request this to reset your password, Please ignore this message.</td>
                </tr>
                    
                <tr style="padding-top:40px;padding-bottom:30px;">
                    <td>Sincerely,</td>
                </tr>
                <tr><td>${process.env.COMPANY_NAME}</td></tr>
                <tr>
                    <td style="padding-top:40px;"><a href="${url}"><input value="Reset Password" type="button" style="background: #4D69B4;
                    padding: 15px 40px;
                    border-radius: 22.2px;
                    border: none;
                    color:#fff;
                    font-size:0.9rem;
                    cursor:pointer;" />
                    </a>
                    </td>
                </tr>
                </table>
            </center>
            </body>
            
            </html>
        `
    }).then( () => {
        console.log('Confirmation Email Sent');
    }).catch( () => {
        console.log('Confirmation Email not sent');
    })
}


const reportUser = async (user, repo, body) => {

    transport.sendMail({
        from: 'opeyemiodedeyi@gmail.com',
        to: `${process.env.COMPANY_NAME} <lookaamdotcom@gmail.com>`,
        subject: `Reporting ${user.fullname}, ${user.email}, ${user._id}`,
        html:`
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
                  padding-top:20px;padding-bottom:20px;">${repo.email}</td>
              </tr>
              <tr>
                <td style="padding-top:20px;
                           padding-bottom:10px;">Hello There,</td>
              </tr>
              <tr style="padding-top:5px;padding-bottom:20px;">
                <td style="padding-bottom:20px;margin-bottom:20px;">
                  ${body}
                </td>
              </tr
                
              <tr style="padding-top:40px;padding-bottom:30px;">
                <td style="padding-bottom:10px;margin-bottom:10px;">Sincerely, ${process.env.COMPANY_NAME}</td>
              </tr>
              <tr><td style="padding-bottom:10px;margin-bottom:10px;">${repo.fullname}</td></tr>
            </table>
          </center>
        </body>
        
        </html>
        `
    }).then( () => {
        console.log('user reported');
    }).catch( () => {
        console.log('user not reported');
    })
}


module.exports = {
    sendConfirmationEmail,
    sendPasswordResetEmail,
    reportUser
};
