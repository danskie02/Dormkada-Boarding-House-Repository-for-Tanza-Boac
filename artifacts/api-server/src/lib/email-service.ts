import sgMail from "@sendgrid/mail";

// Initialize SendGrid with API key from environment
const sendGridApiKey = process.env.SENDGRID_API_KEY;
if (sendGridApiKey) {
  sgMail.setApiKey(sendGridApiKey);
}

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || "noreply@dorm-finder.com";
const FROM_NAME = process.env.SENDGRID_FROM_NAME || "DormKada";

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email via SendGrid
 */
export async function sendEmail(email: EmailOptions): Promise<void> {
  if (!sendGridApiKey) {
    console.warn("SendGrid API key not configured, skipping email");
    return;
  }

  try {
    await sgMail.send({
      to: email.to,
      from: {
        name: FROM_NAME,
        email: FROM_EMAIL,
      },
      subject: email.subject,
      html: email.html,
      text: email.text,
    });
  } catch (error) {
    console.error("Failed to send email:", error);
    throw error;
  }
}

/**
 * Generate HTML for reservation accepted email
 */
export function generateReservationAcceptedEmail(
  studentName: string,
  roomName: string,
  boardingHouseName: string
): string {
  return `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2>Reservation Accepted! 🎉</h2>
        <p>Hello <strong>${studentName}</strong>,</p>
        <p>Great news! Your reservation has been <strong>accepted</strong>.</p>
        
        <div style="background-color: #f4f4f4; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0;">
          <h3 style="margin-top: 0;">Reservation Details</h3>
          <p><strong>Room:</strong> ${roomName}</p>
          <p><strong>Boarding House:</strong> ${boardingHouseName}</p>
        </div>
        
        <p>Please log in to your Dorm Finder account to view more details and complete any necessary steps.</p>
        
        <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
          If you have any questions, please contact the boarding house owner through your Dorm Finder dashboard.
        </p>
      </body>
    </html>
  `;
}

/**
 * Generate HTML for reservation rejected email
 */
export function generateReservationRejectedEmail(
  studentName: string,
  roomName: string,
  boardingHouseName: string,
  reason?: string
): string {
  return `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2>Reservation Update</h2>
        <p>Hello <strong>${studentName}</strong>,</p>
        <p>Unfortunately, your reservation has been <strong>rejected</strong>.</p>
        
        <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ff9800; margin: 20px 0;">
          <h3 style="margin-top: 0;">Rejected Reservation</h3>
          <p><strong>Room:</strong> ${roomName}</p>
          <p><strong>Boarding House:</strong> ${boardingHouseName}</p>
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
        </div>
        
        <p>You can browse and make new reservations for other available rooms on Dorm Finder.</p>
        
        <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
          For more information, please log in to your account or contact the boarding house owner.
        </p>
      </body>
    </html>
  `;
}

/**
 * Generate HTML for reservation expired email
 */
export function generateReservationExpiredEmail(
  studentName: string,
  roomName: string,
  boardingHouseName: string
): string {
  return `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2>Reservation Expired</h2>
        <p>Hello <strong>${studentName}</strong>,</p>
        <p>Your reservation has <strong>expired</strong> as it was not confirmed within the allotted time.</p>
        
        <div style="background-color: #f8d7da; padding: 15px; border-left: 4px solid #f44336; margin: 20px 0;">
          <h3 style="margin-top: 0;">Expired Reservation</h3>
          <p><strong>Room:</strong> ${roomName}</p>
          <p><strong>Boarding House:</strong> ${boardingHouseName}</p>
        </div>
        
        <p>The room is now available for other students. If you're still interested, you can make a new reservation on Dorm Finder.</p>
        
        <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
          Log in to your account on Dorm Finder to explore more options.
        </p>
      </body>
    </html>
  `;
}

/**
 * Send reservation accepted email to student
 */
export async function sendReservationAcceptedEmail(
  studentEmail: string,
  studentName: string,
  roomName: string,
  boardingHouseName: string
): Promise<void> {
  const html = generateReservationAcceptedEmail(studentName, roomName, boardingHouseName);
  await sendEmail({
    to: studentEmail,
    subject: "Your Dorm Finder Reservation Has Been Accepted! ✅",
    html,
  });
}

/**
 * Send reservation rejected email to student
 */
export async function sendReservationRejectedEmail(
  studentEmail: string,
  studentName: string,
  roomName: string,
  boardingHouseName: string,
  reason?: string
): Promise<void> {
  const html = generateReservationRejectedEmail(studentName, roomName, boardingHouseName, reason);
  await sendEmail({
    to: studentEmail,
    subject: "Update on Your Dorm Finder Reservation",
    html,
  });
}

/**
 * Send reservation expired email to student
 */
export async function sendReservationExpiredEmail(
  studentEmail: string,
  studentName: string,
  roomName: string,
  boardingHouseName: string
): Promise<void> {
  const html = generateReservationExpiredEmail(studentName, roomName, boardingHouseName);
  await sendEmail({
    to: studentEmail,
    subject: "Your Dorm Finder Reservation Has Expired",
    html,
  });
}
