/* ==========================================================
   Appointment Email Templates
   Supports dynamic colors, headings, and status wording
========================================================== */

export const APPOINTMENT_UPDATED_TEMPLATE = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; color:#333; max-width:600px; margin:0 auto;">
  <h2 style="color:#2196F3;">Appointment Status Update</h2>
  <p>Hello <strong>{name}</strong>,</p>
  <p>Your appointment for <strong>{service}</strong> has been updated.</p>
  <ul>
    <li><strong>Status:</strong> {status}</li>
    <li><strong>Date:</strong> {date}</li>
    <li><strong>Time:</strong> {time}</li>
  </ul>
  <p>If you have any questions, please contact our parish office.</p>
  <p>Best regards,<br/>Our Lady of Peace & Good Voyage Parish Team</p>
</body>
</html>`;


export const APPOINTMENT_RESCHEDULED_TEMPLATE = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; color:#333; max-width:600px; margin:0 auto;">
  <h2 style="color:#FF9800;">Appointment Rescheduled</h2>
  <p>Hello <strong>{name}</strong>,</p>
  <p>Your appointment for <strong>{service}</strong> has been rescheduled.</p>
  <ul>
    <li><strong>Old Schedule:</strong> {oldDate} at {oldTime}</li>
    <li><strong>New Schedule:</strong> {newDate} at {newTime}</li>
  </ul>
  <p>Thank you for your understanding.</p>
  <p>Best regards,<br/>Our Lady of Peace & Good Voyage Parish Team</p>
</body>
</html>`;


export const APPOINTMENT_CANCELLED_TEMPLATE = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; color:#333; max-width:600px; margin:0 auto;">
  <h2 style="color:{accent};">Appointment {heading}</h2>
  <p>Hello <strong>{name}</strong>,</p>
  <p>We regret to inform you that your appointment for <strong>{service}</strong> has been {statusText}.</p>
  <ul>
    <li><strong>Date:</strong> {date}</li>
    <li><strong>Time:</strong> {time}</li>
    <li><strong>Reason:</strong> {reason}</li>
  </ul>
  <p>Please contact the parish office for further details.</p>
  <p>Best regards,<br/>Our Lady of Peace & Good Voyage Parish Team</p>
</body>
</html>`;
