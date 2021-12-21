import * as nodemailer from 'nodemailer';
import * as aws from 'aws-sdk';

export async function sendEmail({ text, subject, to }) {
  const ses = new aws.SES({
    apiVersion: '2010-12-01',
    region: process.env.AWS_SES_REGION,
    accessKeyId: process.env.AWS_SES_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SES_SECRET_KEY,
  });

  const transporter = nodemailer.createTransport({
    SES: { ses, aws },
  });

  const info = await transporter.sendMail({
    from: process.env.EMAIL_SES_FROM_ADDRESS,
    to,
    subject,
    text,
  });
  return info;
}

// redact part of email address for privacy
export function mungeEmail(email: string) {
  const [name, domain] = email.split('@');
  return `${name.slice(0, 1)}***@${domain}`;
}
