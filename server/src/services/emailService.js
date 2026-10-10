const nodemailer = require('nodemailer');

const sendLowStockEmail = async (emails, productName, available, threshold) => {
  try {
    if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('[Email Service] SMTP credentials not configured. Skipping low-stock email for:', productName);
      return;
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: process.env.SMTP_FROM || '"StockFlow Alerts" <no-reply@stockflow.com>',
      to: emails.join(', '),
      subject: `Low Stock Alert: ${productName}`,
      text: `Alert: ${productName} is low on stock.\n\nAvailable: ${available}\nThreshold: ${threshold}\n\nPlease restock as soon as possible.`,
      html: `<h3>Low Stock Alert</h3>
             <p><strong>${productName}</strong> is low on stock.</p>
             <p>Available: <strong>${available}</strong><br/>
             Threshold: <strong>${threshold}</strong></p>
             <p>Please restock as soon as possible.</p>`
    };

    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error('[Email Service Error] Failed to send low-stock email:', err.message);
  }
};

module.exports = {
  sendLowStockEmail
};
