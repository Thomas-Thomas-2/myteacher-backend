const PDFDocument = require("pdfkit");

function generateInvoicePdfBuffer({
  invoiceNumber,
  teacherName,
  studentName,
  discipline,
  label,
  amount,
  dueAt,
  period,
  status,
}) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(22).text("Facture", { align: "center" });
    doc.moveDown();

    doc.fontSize(12);
    doc.text(`Numéro de facture : ${invoiceNumber}`);
    doc.text(`Date d'émission : ${new Date().toLocaleDateString("fr-FR")}`);
    doc.moveDown();

    doc.text(`Professeur : ${teacherName}`);
    doc.text(`Élève : ${studentName}`);
    doc.text(`Discipline : ${discipline || "-"}`);
    doc.moveDown();

    doc.text(`Libellé : ${label || "Cours"}`);
    doc.text(`Période : ${period || "-"}`);
    doc.text(
      `Date du cours / échéance : ${
        dueAt ? new Date(dueAt).toLocaleDateString("fr-FR") : "-"
      }`,
    );
    doc.text(`Montant : ${amount} €`);
    doc.text(`Statut initial : ${status}`);
    doc.moveDown();

    doc.text("Merci pour votre confiance.");
    doc.moveDown(2);
    doc.fontSize(10).fillColor("gray");
    doc.text("Document généré automatiquement par MyTeacher.");

    doc.end();
  });
}

module.exports = generateInvoicePdfBuffer;
