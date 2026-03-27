const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendInviteEmail({ to, inviteLink, teacherLabel }) {
  const subject = "Invitation MyTeacher";
  const text =
    `Bonjour,\n\n` +
    `${teacherLabel || "Un professeur"} t'invite à rejoindre MyTeacher.\n` +
    `Pour créer ton compte élève, clique ici :\n${inviteLink}\n\n` +
    `À bientôt !\n`;

  // IMPORTANT: pour tester, utilise un from autorisé Resend
  const from = process.env.RESEND_FROM;

  console.log("[MAIL] Resend sending to:", to, "from:", from);

  const result = await resend.emails.send({
    from,
    to,
    subject,
    text,
  });

  console.log("[MAIL] Resend result:", result);
  return result;
}

module.exports = { sendInviteEmail };
