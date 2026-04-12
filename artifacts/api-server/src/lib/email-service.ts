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

/**
 * Generate HTML for new reservation request email to owner
 */
export function generateNewReservationRequestEmail(
  ownerName: string,
  studentName: string,
  roomName: string,
  boardingHouseName: string
): string {
  return `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2>New Reservation Request 📬</h2>
        <p>Hello <strong>${ownerName}</strong>,</p>
        <p>A new reservation request has been submitted for one of your rooms.</p>
        
        <div style="background-color: #e3f2fd; padding: 15px; border-left: 4px solid #2196F3; margin: 20px 0;">
          <h3 style="margin-top: 0;">Reservation Details</h3>
          <p><strong>Student Name:</strong> ${studentName}</p>
          <p><strong>Room:</strong> ${roomName}</p>
          <p><strong>Boarding House:</strong> ${boardingHouseName}</p>
        </div>
        
        <p>This request is pending your approval or rejection. Please log in to your Dorm Finder dashboard to review and respond to this reservation request.</p>
        
        <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
          Best regards,<br/>
          The DormKada Team
        </p>
      </body>
    </html>
  `;
}

/**
 * Generate HTML for reservation cancellation email to owner
 */
export function generateReservationCancelledEmail(
  ownerName: string,
  studentName: string,
  roomName: string,
  boardingHouseName: string,
  cancellationReason?: string
): string {
  return `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2>Reservation Cancelled</h2>
        <p>Hello <strong>${ownerName}</strong>,</p>
        <p>A confirmed reservation has been cancelled by the student.</p>
        
        <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ff9800; margin: 20px 0;">
          <h3 style="margin-top: 0;">Cancellation Details</h3>
          <p><strong>Student Name:</strong> ${studentName}</p>
          <p><strong>Room:</strong> ${roomName}</p>
          <p><strong>Boarding House:</strong> ${boardingHouseName}</p>
          ${cancellationReason ? `<p><strong>Reason for Cancellation:</strong> ${cancellationReason}</p>` : ""}
        </div>
        
        <p>The room is now available for other students. Please log in to your Dorm Finder dashboard to manage your listings.</p>
        
        <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
          Best regards,<br/>
          The DormKada Team
        </p>
      </body>
    </html>
  `;
}

/**
 * Send new reservation request email to owner
 */
export async function sendNewReservationRequestEmail(
  ownerEmail: string,
  ownerName: string,
  studentName: string,
  roomName: string,
  boardingHouseName: string
): Promise<void> {
  const html = generateNewReservationRequestEmail(ownerName, studentName, roomName, boardingHouseName);
  await sendEmail({
    to: ownerEmail,
    subject: "New Reservation Request for Your Property 📬",
    html,
  });
}

/**
 * Send reservation cancellation email to owner
 */
export async function sendReservationCancelledEmail(
  ownerEmail: string,
  ownerName: string,
  studentName: string,
  roomName: string,
  boardingHouseName: string,
  cancellationReason?: string
): Promise<void> {
  const html = generateReservationCancelledEmail(ownerName, studentName, roomName, boardingHouseName, cancellationReason);
  await sendEmail({
    to: ownerEmail,
    subject: "A Reservation Has Been Cancelled",
    html,
  });
}

/**
 * Generate HTML for new pending owner verification email to admin
 */
export function generateNewOwnerVerificationEmail(
  ownerName: string,
  ownerEmail: string
): string {
  return `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2>New Owner Identity Verification Pending ⚠️</h2>
        <p>Hello Admin,</p>
        <p>A new owner has registered and requires identity verification before they can list properties.</p>
        
        <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ff9800; margin: 20px 0;">
          <h3 style="margin-top: 0;">Owner Information</h3>
          <p><strong>Name:</strong> ${ownerName}</p>
          <p><strong>Email:</strong> ${ownerEmail}</p>
        </div>
        
        <p>Please log in to your admin dashboard at <strong>Dorm Finder Admin Panel</strong> to review and process this verification request.</p>
        
        <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
          Action Required: Please verify the owner's identity to allow them to list properties.
        </p>
      </body>
    </html>
  `;
}

/**
 * Generate HTML for new pending property listing email to admin
 */
export function generateNewPendingListingEmail(
  boardingHouseName: string,
  ownerName: string,
  address: string
): string {
  return `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2>New Property Listing Pending Approval 🏠</h2>
        <p>Hello Admin,</p>
        <p>A new boarding house property has been submitted for approval.</p>
        
        <div style="background-color: #e8f5e9; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0;">
          <h3 style="margin-top: 0;">Property Details</h3>
          <p><strong>Property Name:</strong> ${boardingHouseName}</p>
          <p><strong>Owner:</strong> ${ownerName}</p>
          <p><strong>Address:</strong> ${address}</p>
        </div>
        
        <p>Please log in to your admin dashboard at <strong>Dorm Finder Admin Panel</strong> to review and approve/reject this property listing.</p>
        
        <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
          Action Required: Please review the property details and approve or reject the listing.
        </p>
      </body>
    </html>
  `;
}

/**
 * Send new owner verification email to admin
 */
export async function sendNewOwnerVerificationEmail(
  adminEmail: string,
  ownerName: string,
  ownerEmail: string
): Promise<void> {
  const html = generateNewOwnerVerificationEmail(ownerName, ownerEmail);
  await sendEmail({
    to: adminEmail,
    subject: "New Owner Identity Verification Pending - Action Required ⚠️",
    html,
  });
}

/**
 * Send new pending listing email to admin
 */
export async function sendNewPendingListingEmail(
  adminEmail: string,
  boardingHouseName: string,
  ownerName: string,
  address: string
): Promise<void> {
  const html = generateNewPendingListingEmail(boardingHouseName, ownerName, address);
  await sendEmail({
    to: adminEmail,
    subject: "New Property Listing Pending Approval 🏠",
    html,
  });
}
