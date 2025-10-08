// src/config/documentEmailTemplates.js

export const DOCUMENT_RECEIVED_TEMPLATE = `
<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; color:#333; max-width:600px; margin:0 auto;">
    <h2 style="color:#4CAF50;">Document Request Received</h2>
    <p>Hello <strong>{name}</strong>,</p>
    <p>We’ve received your request for a <strong>{documentType}</strong> document.</p>
    <p>
      <strong>Purpose:</strong> {purpose}<br/>
      <strong>Copies:</strong> {copies}<br/>
      <strong>Request Code:</strong> {requestCode}
    </p>
    <p>We’ll notify you once it’s being processed or ready for pick-up.</p>
    <p>Best regards,<br/>
    Our Lady of Peace &amp; Good Voyage Parish</p>
  </body>
</html>
`;

export const DOCUMENT_PROCESSING_TEMPLATE = `
<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; color:#333; max-width:600px; margin:0 auto;">
    <h2 style="color:#2196F3;">Document Request In Process</h2>
    <p>Hello <strong>{name}</strong>,</p>
    <p>Your request for a <strong>{documentType}</strong> is now being processed by our parish staff.</p>
    <p>We’ll email you again once it’s ready for pick-up.</p>
    <p>Thank you for your patience.</p>
  </body>
</html>
`;

export const DOCUMENT_READY_TEMPLATE = `
<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; color:#333; max-width:600px; margin:0 auto;">
    <h2 style="color:#4CAF50;">Your Document is Ready for Pick-Up</h2>
    <p>Hello <strong>{name}</strong>,</p>
    <p>Your <strong>{documentType}</strong> request (Ref: <strong>{requestCode}</strong>) is now ready for pick-up at the parish office.</p>
    <p>Kindly bring a valid ID upon claiming.</p>
    <p>Thank you and God bless!</p>
  </body>
</html>
`;

export const DOCUMENT_REJECTED_TEMPLATE = `
<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; color:#333; max-width:600px; margin:0 auto;">
    <h2 style="color:#F44336;">Document Request Rejected</h2>
    <p>Hello <strong>{name}</strong>,</p>
    <p>We regret to inform you that your request for a <strong>{documentType}</strong> has been rejected.</p>
    <p>Reason: {reason}</p>
    <p>For clarification, you may contact the parish office directly.</p>
  </body>
</html>
`;
