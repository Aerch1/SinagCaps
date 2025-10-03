export const APPOINTMENT_CREATED_TEMPLATE = `
<html>
<body style="font-family: Arial, sans-serif; color:#333;">
  <h2>Your appointment has been created</h2>
  <p>Hello {name},</p>
  <p>Your appointment for <strong>{service}</strong> has been scheduled.</p>
  <p><strong>Date:</strong> {date}<br><strong>Time:</strong> {time}</p>
  <p>We look forward to seeing you.</p>
</body>
</html>`;

export const APPOINTMENT_UPDATED_TEMPLATE = `
<html>
<body style="font-family: Arial, sans-serif; color:#333;">
  <h2>Your appointment status has changed</h2>
  <p>Hello {name},</p>
  <p>Your appointment for <strong>{service}</strong> is now marked as: <strong>{status}</strong>.</p>
  <p><strong>Date:</strong> {date}<br><strong>Time:</strong> {time}</p>
</body>
</html>`;

export const APPOINTMENT_RESCHEDULED_TEMPLATE = `
<html>
<body style="font-family: Arial, sans-serif; color:#333;">
  <h2>Your appointment has been rescheduled</h2>
  <p>Hello {name},</p>
  <p>Your appointment for <strong>{service}</strong> has been moved.</p>
  <p><strong>Old:</strong> {oldDate} at {oldTime}</p>
  <p><strong>New:</strong> {newDate} at {newTime}</p>
</body>
</html>`;

export const APPOINTMENT_CANCELLED_TEMPLATE = `
<html>
<body style="font-family: Arial, sans-serif; color:#333;">
  <h2>Your appointment was cancelled</h2>
  <p>Hello {name},</p>
  <p>We regret to inform you that your appointment for <strong>{service}</strong> has been cancelled.</p>
  <p><strong>Date:</strong> {date} at {time}</p>
  <p><strong>Reason:</strong> {reason}</p>
</body>
</html>`;
