const nodemailer = require('nodemailer');
const { logger } = require('../utils/logger');

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendEmailReport = async (metrics) => {
  try {
    const recipients = process.env.EMAIL_RECIPIENTS.split(',');
    
    const emailContent = `
      <h1>Weekly Ortto Analytics Report</h1>
      <h2>Key Metrics</h2>
      <ul>
        <li>Open Rate: ${metrics.openRate}%</li>
        <li>Click-Through Rate: ${metrics.ctr}%</li>
        <li>Conversions: ${metrics.conversions}</li>
        <li>App Installs: ${metrics.appInstalls}</li>
      </ul>
      
      <h2>Top 5 Performers</h2>
      <ul>
        ${metrics.topPerformers.map(performer => `
          <li>${performer.name}: ${performer.metric}%</li>
        `).join('')}
      </ul>
      
      <p>Report generated on ${new Date().toLocaleDateString()}</p>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: recipients,
      subject: 'Weekly Ortto Analytics Report',
      html: emailContent
    };

    await transporter.sendMail(mailOptions);
    logger.info('Weekly report email sent successfully');
  } catch (error) {
    logger.error('Error sending weekly report email:', error);
    throw error;
  }
};

module.exports = { sendEmailReport }; 