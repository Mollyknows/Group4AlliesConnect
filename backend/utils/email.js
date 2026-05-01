const nodemailer = require("nodemailer");

const hasSmtpConfig = () => {
  return Boolean(
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS,
  );
};

const getTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT || 587) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

async function sendEmail({ to, subject, text, html }) {
  if (!to) {
    return { sent: false, skipped: true, reason: "missing-recipient" };
  }

  if (!hasSmtpConfig()) {
    console.log(
      `[Email skipped] SMTP not configured. To: ${to}; Subject: ${subject}`,
    );
    return { sent: false, skipped: true, reason: "smtp-not-configured" };
  }

  const transporter = getTransporter();
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
  });

  return { sent: true, skipped: false };
}

async function sendVolunteerWelcomeEmail({ to, firstName }) {
  const safeName = firstName || "Volunteer";
  return sendEmail({
    to,
    subject: "Welcome to Allies Connect",
    text: `Hi ${safeName},\n\nYour volunteer account has been created successfully.\n\nThank you for joining Allies Connect.`,
    html: `
      <p>Hi ${safeName},</p>
      <p>Your volunteer account has been created successfully.</p>
      <p>Thank you for joining <strong>Allies Connect</strong>.</p>
    `,
  });
}

async function sendVolunteerScheduledEmail({
  to,
  firstName,
  opportunityTitle,
  providerName,
  startDatetime,
  endDatetime,
}) {
  const safeName = firstName || "Volunteer";
  const title = opportunityTitle || "a volunteer shift";
  const provider = providerName || "a provider";
  const whenText = startDatetime
    ? `Start: ${startDatetime}${endDatetime ? ` | End: ${endDatetime}` : ""}`
    : "";

  return sendEmail({
    to,
    subject: "You have been scheduled for a volunteer shift",
    text: `Hi ${safeName},\n\nYou have been scheduled to work ${title} with ${provider}.\n${whenText}\n\nPlease check Allies Connect for details.`,
    html: `
      <p>Hi ${safeName},</p>
      <p>You have been scheduled to work <strong>${title}</strong> with <strong>${provider}</strong>.</p>
      ${
        whenText
          ? `<p><strong>${whenText}</strong></p>`
          : "<p>Please check Allies Connect for timing details.</p>"
      }
      <p>Please check Allies Connect for full shift details.</p>
    `,
  });
}

async function sendEventNextDayReminderEmail({
  to,
  firstName,
  eventTitle,
  providerName,
  startDatetime,
  shiftSummary,
}) {
  const safeName = firstName || "Volunteer";
  const title = eventTitle || "your event";
  const provider = providerName || "the provider";
  const shiftDetails = shiftSummary
    ? `\n\nYour shift details:\n${shiftSummary}`
    : "";
  const shiftDetailsHtml = shiftSummary
    ? `<p><strong>Your shift details:</strong><br />${String(shiftSummary)
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .join("<br />")}</p>`
    : "";

  return sendEmail({
    to,
    subject: "Reminder: your event is tomorrow",
    text: `Hi ${safeName},\n\nThis is a reminder that ${title} is happening tomorrow${startDatetime ? ` at ${startDatetime}` : ""}.\nProvider: ${provider}.${shiftDetails}\n\nThank you for volunteering.`,
    html: `
      <p>Hi ${safeName},</p>
      <p>This is a reminder that <strong>${title}</strong> is happening tomorrow${
        startDatetime ? ` at <strong>${startDatetime}</strong>` : ""
      }.</p>
      <p>Provider: <strong>${provider}</strong>.</p>
      ${shiftDetailsHtml}
      <p>Thank you for volunteering.</p>
    `,
  });
}

async function sendPasswordResetEmail({ to, username, resetLink }) {
  const safeName = username || "User";
  return sendEmail({
    to,
    subject: "Allies Connect — Password Reset",
    text: `Hi ${safeName},\n\nWe received a request to reset your password. Visit the link below to set a new password:\n${resetLink}\n\nThis link will expire in 1 hour.\n\nIf you did not request this, you can safely ignore this email.\n\n— Allies Connect`,
    html: `
      <h2>Password Reset Request</h2>
      <p>Hi ${safeName},</p>
      <p>We received a request to reset your password. Click the link below to set a new password:</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
      <p>This link will expire in 1 hour.</p>
      <p>If you did not request this, you can safely ignore this email.</p>
      <br/>
      <p>— Allies Connect</p>
    `,
  });
}

async function sendOrgInviteEmail({ to, orgName, inviteLink }) {
  return sendEmail({
    to,
    subject: `Allies Connect — You've been invited to join ${orgName}`,
    text:
      `You've been invited to join ${orgName} on Allies Connect.\n` +
      `Create your account here: ${inviteLink}\n` +
      "This invitation will expire in 7 days.\n\n— Allies Connect",
    html: `
      <h2>Welcome to Allies Connect!</h2>
      <p>You've been invited to join <strong>${orgName}</strong> on Allies Connect.</p>
      <p>Click the link below to create your account:</p>
      <p><a href="${inviteLink}">${inviteLink}</a></p>
      <p>This invitation will expire in 7 days.</p>
      <br/>
      <p>— Allies Connect</p>
    `,
  });
}

async function sendOrgApprovedEmail({ to, orgName, firstName }) {
  const safeName = firstName || "there";
  const org = orgName || "your organization";
  return sendEmail({
    to,
    subject: "Allies Connect — Your organization has been approved!",
    text: `Hi ${safeName},\n\nGreat news! ${org} has been approved on Allies Connect. You can now log in and start using the service.\n\n— Allies Connect`,
    html: `
      <p>Hi ${safeName},</p>
      <p>Great news! <strong>${org}</strong> has been approved on Allies Connect.</p>
      <p>You can now <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/login">log in</a> and start using the service.</p>
      <br/>
      <p>— Allies Connect</p>
    `,
  });
}

async function sendOrgDeniedEmail({ to, orgName, firstName, reason }) {
  const safeName = firstName || "there";
  const org = orgName || "your organization";
  const reasonText = reason ? `\n\nReason provided: ${reason}` : "";
  const reasonHtml = reason ? `<p><strong>Reason:</strong> ${reason}</p>` : "";
  return sendEmail({
    to,
    subject: "Allies Connect — Organization application update",
    text: `Hi ${safeName},\n\nAfter review, we are unable to approve ${org} on Allies Connect at this time.${reasonText}\n\nIf you have questions, please contact us.\n\n— Allies Connect`,
    html: `
      <p>Hi ${safeName},</p>
      <p>After review, we are unable to approve <strong>${org}</strong> on Allies Connect at this time.</p>
      ${reasonHtml}
      <p>If you have questions, please contact us.</p>
      <br/>
      <p>— Allies Connect</p>
    `,
  });
}

async function sendVolunteerApprovedEmail({
  to,
  firstName,
  resourceName,
  providerName,
}) {
  const safeName = firstName || "Volunteer";
  const resource = resourceName || "the resource";
  const provider = providerName || "the organization";
  return sendEmail({
    to,
    subject: `Allies Connect — Your volunteer application has been approved`,
    text: `Hi ${safeName},\n\nYour application to volunteer with ${resource} at ${provider} has been approved! You can now log in to Allies Connect to get started.\n\n— Allies Connect`,
    html: `
      <p>Hi ${safeName},</p>
      <p>Your application to volunteer with <strong>${resource}</strong> at <strong>${provider}</strong> has been approved!</p>
      <p>You can now <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/login">log in</a> to Allies Connect to get started.</p>
      <br/>
      <p>— Allies Connect</p>
    `,
  });
}

async function sendVolunteerDeniedEmail({
  to,
  firstName,
  resourceName,
  providerName,
  reason,
}) {
  const safeName = firstName || "Volunteer";
  const resource = resourceName || "the resource";
  const provider = providerName || "the organization";
  const reasonText = reason ? `\n\nReason: ${reason}` : "";
  const reasonHtml = reason ? `<p><strong>Reason:</strong> ${reason}</p>` : "";
  return sendEmail({
    to,
    subject: `Allies Connect — Volunteer application update`,
    text: `Hi ${safeName},\n\nUnfortunately, your application to volunteer with ${resource} at ${provider} was not approved at this time.${reasonText}\n\nYou are welcome to apply to other opportunities on Allies Connect.\n\n— Allies Connect`,
    html: `
      <p>Hi ${safeName},</p>
      <p>Unfortunately, your application to volunteer with <strong>${resource}</strong> at <strong>${provider}</strong> was not approved at this time.</p>
      ${reasonHtml}
      <p>You are welcome to apply to other opportunities on Allies Connect.</p>
      <br/>
      <p>— Allies Connect</p>
    `,
  });
}

module.exports = {
  sendEmail,
  sendVolunteerWelcomeEmail,
  sendVolunteerScheduledEmail,
  sendEventNextDayReminderEmail,
  sendPasswordResetEmail,
  sendOrgInviteEmail,
  sendOrgApprovedEmail,
  sendOrgDeniedEmail,
  sendVolunteerApprovedEmail,
  sendVolunteerDeniedEmail,
};
