import nodemailer from 'nodemailer';

const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST || '127.0.0.1',
  port: Number(process.env.SMTP_PORT || 1025),
  secure: false,
});
const escapeHtml = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]
  );

export async function sendVerificationEmail({ email, name, token }) {
  if (process.env.APP_ENV === 'test') return;
  const origin =
    process.env.APP_ORIGIN || process.env.API_ALLOWED_ORIGIN || 'http://127.0.0.1:5174';
  const verificationUrl = `${origin}/verify-email?token=${encodeURIComponent(token)}`;
  await transport.sendMail({
    from: process.env.EMAIL_FROM || 'NH Terminal <no-reply@nhterminal.local>',
    to: email,
    subject: 'Verify your NH Terminal email',
    text: `Hello ${name}, verify your email: ${verificationUrl}`,
    html: `<p>Hello ${escapeHtml(name)},</p><p><a href="${escapeHtml(verificationUrl)}">Verify your NH Terminal email</a></p><p>This link expires in 30 minutes.</p>`,
  });
}
