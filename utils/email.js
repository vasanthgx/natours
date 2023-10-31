const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');
const Transport = require('nodemailer-brevo-transport');
//we will create a class called Email.
//the way we plan to use the instances of this class, is it should have a user object and an url
//the user{} object will have the name, email etc
//with number of methods to carry out the different aspects of a email system
//new Email(user, url).sendWelcome()

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Jonas Schemdtmann <${process.env.EMAIL_FROM}>`;
  }
  //Next we create methods for this class
  //1) createTransport() - creating  a transporter for DEV and PROD
  //for DEV we will continue to use Mailtrap and for PROD we will use SENDGRID later

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      //Sendgrid
      // return nodemailer.createTransport({
      //   service: 'SendGrid',
      //   auth: {
      //     user: process.env.SENDGRID_USERNAME,
      //     pass: process.env.SENDGRID_PASSWORD,
      //   },
      // });

      const transporter = nodemailer.createTransport(
        new Transport({
          apiKey: process.env.BREVO_PASSWORD,
        }),
      );
      return transporter;
    }
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  //2)send()this is the method which will do the act of sending.
  //it will recieve a template and a subject
  async send(template, subject) {
    //1) Render Html based on pug template
    ///normally we render('<pug template>') - Behind the scenes we render a pug template to an HTML page which is sent back to the client
    ///here now we do not want to render, but just create a HTML and send that as the email
    //for this we use pug.renderFile() and store it as a variable 'html' and include it as a  field in the mailOptions{} object
    const html = pug.renderFile(
      `${__dirname}/../views/emails/${template}.pug`,
      {
        firstName: this.firstName,
        url: this.url,
        subject,
      },
    );

    //2) Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      // subject: subject,
      // html:html,
      subject,
      html,
      text: htmlToText.fromString(html),
      //we install the package'html-to-text' to convert the html to plain text
    };
    //3) Create a transport and send email

    //  this.newTransport() creating a transport
    await this.newTransport().sendMail(mailOptions);
  }

  //3) sendWelcome()
  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours Family'); //note: 'welcome' is a pug template
  }

  //4) sendPasswordReset()
  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token ( valid only for 10 minutes )',
    );
  }
};

// const sendEmail = async (options) => {
//   // 1) creating a transporter
//   // const transporter = nodemailer.createTransport({
//   //   // service: 'Gmail',
//   //   host: process.env.EMAIL_HOST,
//   //   port: process.env.EMAIL_PORT,
//   //   auth: {
//   //     user: process.env.EMAIL_USERNAME,
//   //     pass: process.env.EMAIL_PASSWORD,
//   //   },
//   //   //Activate in gmail "less secure app" option.
//   //   // secure: false,
//   //   // logger: true,
//   //   // tls: {
//   //   //   rejectUnauthorized: true,
//   //   // },
//   // });
//   //2) Define the email options
//   // const mailOptions = {
//   //   from: 'Vasanth <vasanth1627@gmail.com>',
//   //   to: options.email,
//   //   subject: options.subject,
//   //   text: options.message,
//   //   //html: //later we will specify a 'html' property
//   // };
//   // 3) Actually send the email
//   await transporter.sendMail(mailOptions);
// };

// module.exports = sendEmail;
