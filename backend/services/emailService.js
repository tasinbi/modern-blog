const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  // Check if SMTP_HOST is provided for custom configuration
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }
  
  // Default Gmail service configuration
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'your-email@gmail.com',
      pass: process.env.EMAIL_PASSWORD || 'your-app-password'
    }
  });

  // Alternative: For production with custom SMTP
  /*
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
  */
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetToken, adminName) => {
  try {
    const transporter = createTransporter();
    
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: {
        name: 'Banglay IELTS',
        address: process.env.EMAIL_USER || 'noreply@banglayielts.com'
      },
      to: email,
      subject: 'Reset Your Admin Password - Banglay IELTS',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            .warning { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset Request</h1>
              <p>Banglay IELTS Admin Panel</p>
            </div>
            <div class="content">
              <h2>Hello ${adminName},</h2>
              <p>We received a request to reset your admin password for your Banglay IELTS account.</p>
              
              <p>Click the button below to reset your password:</p>
              
              <a href="${resetUrl}" class="button">Reset Password</a>
              
              <p>Or copy and paste this link in your browser:</p>
              <p style="word-break: break-all; background: #e5e7eb; padding: 10px; border-radius: 5px;">
                ${resetUrl}
              </p>
              
              <div class="warning">
                <strong>⚠️ Important:</strong>
                <ul>
                  <li>This link will expire in 1 hour for security reasons</li>
                  <li>If you didn't request this reset, please ignore this email</li>
                  <li>Never share this link with anyone</li>
                </ul>
              </div>
              
              <p>If you have any questions, please contact the system administrator.</p>
              
              <p>Best regards,<br>
              Banglay IELTS Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
              <p>&copy; ${new Date().getFullYear()} Banglay IELTS. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
};

// Send welcome email for new admin registration
const sendWelcomeEmail = async (email, adminName, tempPassword = null) => {
  try {
    const transporter = createTransporter();
    
    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/login`;
    
    const mailOptions = {
      from: {
        name: 'Banglay IELTS',
        address: process.env.EMAIL_USER || 'noreply@banglayielts.com'
      },
      to: email,
      subject: 'Welcome to Banglay IELTS Admin Panel',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .credentials { background: #e5e7eb; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to Banglay IELTS!</h1>
              <p>Admin Panel Access</p>
            </div>
            <div class="content">
              <h2>Hello ${adminName},</h2>
              <p>Your admin account has been successfully created for Banglay IELTS!</p>
              
              <div class="credentials">
                <h3>🔑 Your Login Details:</h3>
                <p><strong>Email:</strong> ${email}</p>
                ${tempPassword ? `<p><strong>Temporary Password:</strong> ${tempPassword}</p>` : ''}
                <p><strong>Login URL:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
              </div>
              
              ${tempPassword ? `
                <p><strong>⚠️ Important:</strong> Please change your temporary password after your first login for security.</p>
              ` : ''}
              
              <a href="${loginUrl}" class="button">Login to Admin Panel</a>
              
              <p>You now have access to:</p>
              <ul>
                <li>📝 Create and manage blog posts</li>
                <li>📂 Manage categories</li>
                <li>📊 View website statistics</li>
                <li>⚙️ Admin panel features</li>
              </ul>
              
              <p>If you have any questions, please contact the system administrator.</p>
              
              <p>Best regards,<br>
              Banglay IELTS Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
              <p>&copy; ${new Date().getFullYear()} Banglay IELTS. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
};

// Test email configuration
const testEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Email configuration is valid');
    return true;
  } catch (error) {
    console.error('❌ Email configuration error:', error.message);
    return false;
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendWelcomeEmail,
  testEmailConfig
};