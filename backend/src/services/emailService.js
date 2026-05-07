// Email service — sends transactional emails via SMTP or logs them in dev mode.
const nodemailer = require('nodemailer');

let transporter;

const formatCurrency = (amount) => Number(amount).toLocaleString();
const buildGreeting = (user) => `Hi ${user.firstName || 'there'}`;

// Returns a cached transporter; creates one on first call.
// Uses real SMTP when credentials are set, otherwise logs to console.
const getTransporter = async () => {
  if (transporter) return transporter;

  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST || 'smtp.gmail.com',
      port:   Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  } else {
    // Dev-mode stub — prints email details without sending
    transporter = {
      sendMail: async (opts) => {
        console.log('\n📧 [EMAIL - dev mode, not sent]');
        console.log('  To:', opts.to);
        console.log('  Subject:', opts.subject);
        return { messageId: 'dev-mode' };
      },
    };
  }
  return transporter;
};

const FROM = process.env.EMAIL_FROM || 'SchoolAdmin <no-reply@school.rw>';

const sendEmail = async ({ to, subject, html, text }) => {
  const t = await getTransporter();
  return t.sendMail({ from: FROM, to, subject, html, text });
};

const sendLinkingNotification = (user, subject, html, text) => sendEmail({
  to: user.email,
  subject,
  html,
  text,
});

// Pre-built notification helpers for common system events
const notify = {
  deviceVerified: (user) => sendEmail({
    to: user.email,
    subject: 'Device Verified — SchoolPortal',
    html: `<p>${buildGreeting(user)}, your device has been verified. You can now log in.</p>`,
    text: `${buildGreeting(user)}, your device has been verified.`,
  }),
  paymentApproved: (user, amount) => sendEmail({
    to: user.email,
    subject: 'Payment Approved — SchoolPortal',
    html: `<p>${buildGreeting(user)}, your payment of <strong>${formatCurrency(amount)} RWF</strong> has been approved.</p>`,
    text: `Payment of ${formatCurrency(amount)} RWF approved.`,
  }),
  paymentRejected: (user, amount) => sendEmail({
    to: user.email,
    subject: 'Payment Rejected — SchoolPortal',
    html: `<p>${buildGreeting(user)}, your payment of <strong>${formatCurrency(amount)} RWF</strong> was rejected. Contact the school office.</p>`,
    text: `Payment of ${formatCurrency(amount)} RWF rejected.`,
  }),
  refundApproved: (user, amount) => sendEmail({
    to: user.email,
    subject: 'Refund Approved — SchoolPortal',
    html: `<p>${buildGreeting(user)}, your refund of <strong>${formatCurrency(amount)} RWF</strong> has been approved.</p>`,
    text: `Refund of ${formatCurrency(amount)} RWF approved.`,
  }),
  gradesUpdated: (user, subject, term) => sendEmail({
    to: user.email,
    subject: `Grades Updated: ${subject} — SchoolPortal`,
    html: `<p>${buildGreeting(user)}, grades for <strong>${subject}</strong> (${term}) have been updated.</p>`,
    text: `Grades for ${subject} (${term}) updated.`,
  }),
  linkingApproved: (user, studentName) => sendEmail({
    to: user.email,
    subject: 'Child Account Linked — SchoolPortal',
    html: `<p>${buildGreeting(user)}, your account has been linked to <strong>${studentName}</strong>.</p>`,
    text: `Account linked to ${studentName}.`,
  }),
  linkingRejected: (user, studentCode, reason) => sendLinkingNotification(
    user,
    'Linking Request Rejected — SchoolPortal',
    `<p>${buildGreeting(user)}, your linking request for <strong>${studentCode}</strong> was rejected.</p><p><strong>Reason:</strong> ${reason || 'No reason provided.'}</p>`,
    `Your linking request for ${studentCode} was rejected. Reason: ${reason || 'No reason provided.'}`,
  ),
  registrationInvite: (email, studentName, inviteUrl, expiresAt) => sendEmail({
    to: email,
    subject: 'Complete Student Account Setup — SchoolPortal',
    html: `<p>You were invited to set up access for <strong>${studentName}</strong>.</p>
           <p><a href="${inviteUrl}">Complete Registration</a></p>
           <p>This link expires on ${new Date(expiresAt).toLocaleString()}.</p>`,
    text: `You were invited to set up access for ${studentName}. Open: ${inviteUrl}. Expires: ${new Date(expiresAt).toLocaleString()}`,
  }),
  staffPasswordReset: (user, resetUrl) => sendEmail({
    to: user.email, subject: 'Reset Your Password — SchoolAdmin',
    html: `<p>Hi ${user.firstName}, reset your password: <a href="${resetUrl}">Click here</a> (valid 1 hour).</p>`,
    text: `Reset your password: ${resetUrl}`,
  }),
};

module.exports = { sendEmail, notify };
