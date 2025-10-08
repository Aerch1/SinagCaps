import pool from "../config/db.js";
import path from "path";
import fs from "fs";
import {
  generateExcelReport,
  generatePdfReport,
} from "../utils/reportGenerator.js";

/* ==================================================
   GENERATE SYSTEM REPORT (Final Fixed Version)
================================================== */
export async function generateSystemReport(req, res) {
  const {
    type = "appointments",
    format = "excel",
    admin = "System",
    scope = "all",
    startDate,
    endDate,
  } = req.query;

  const conn = await pool.getConnection();

  try {
    let rows = [];
    let columns = [];
    let title = "";
    const params = [];

    /* ==================================================
       REPORT: APPOINTMENTS
    ================================================== */
    if (type === "appointments") {
      let where = "WHERE 1=1";

      // ✅ Filter by appointment date (not created_at)
      if (startDate && endDate) {
        where += " AND DATE(a.date) BETWEEN ? AND ?";
        params.push(startDate, endDate);
      }

      // ✅ Filter by status
      if (scope !== "all") {
        const validStatuses = [
          "pending",
          "approved",
          "completed",
          "cancelled",
          "rejected",
          "archived",
        ];
        if (validStatuses.includes(scope)) {
          where += " AND a.status = ?";
          params.push(scope);
        }
      }

      const query = `
        SELECT 
          a.id,
          a.name AS clientName,
          a.email,
          a.contactNumber,
          s.name AS service,
          a.status,
          DATE_FORMAT(a.date, '%Y-%m-%d') AS date,
          a.time,
          DATE_FORMAT(a.created_at, '%Y-%m-%d %H:%i') AS requestedOn
        FROM appointments a
        JOIN services s ON a.service_id = s.id
        ${where}
        ORDER BY a.date DESC, a.time DESC
      `;

      const [data] = await conn.query(query, params);
      rows = data;

      title = `Appointments Report${
        scope !== "all"
          ? ` (${scope.charAt(0).toUpperCase() + scope.slice(1)})`
          : ""
      }`;

      columns = [
        { header: "ID", key: "id" },
        { header: "Client Name", key: "clientName" },
        { header: "Email", key: "email" },
        { header: "Contact Number", key: "contactNumber" },
        { header: "Service", key: "service" },
        { header: "Status", key: "status" },
        { header: "Date", key: "date" },
        { header: "Time", key: "time" },
        { header: "Requested On", key: "requestedOn" },
      ];

      /* ==================================================
       REPORT: DOCUMENT REQUESTS
    ================================================== */
    } else if (type === "documents") {
      let where = "WHERE 1=1";

      // ✅ Date filter (based on created_at)
      if (startDate && endDate) {
        where += " AND DATE(created_at) BETWEEN ? AND ?";
        params.push(startDate, endDate);
      }

      // ✅ Status filter
      if (scope !== "all") {
        const validDocStatuses = [
          "pending",
          "processing",
          "completed",
          "rejected",
        ];
        if (validDocStatuses.includes(scope)) {
          where += " AND status = ?";
          params.push(scope);
        }
      }

      const query = `
        SELECT 
          request_code,
          full_name,
          email,
          phone,
          document_type,
          status,
          DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') AS requestDate,
          DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i') AS lastUpdate
        FROM document_requests
        ${where}
        ORDER BY created_at DESC
      `;

      const [data] = await conn.query(query, params);
      rows = data;

      title = `Document Requests Report${
        scope !== "all"
          ? ` (${scope.charAt(0).toUpperCase() + scope.slice(1)})`
          : ""
      }`;

      columns = [
        { header: "Request Code", key: "request_code" },
        { header: "Full Name", key: "full_name" },
        { header: "Email", key: "email" },
        { header: "Phone", key: "phone" },
        { header: "Document Type", key: "document_type" },
        { header: "Status", key: "status" },
        { header: "Request Date", key: "requestDate" },
        { header: "Last Update", key: "lastUpdate" },
      ];

      /* ==================================================
       REPORT: EVENTS & NEWS
    ================================================== */
    } else if (type === "events") {
      let where = "WHERE 1=1";

      // ✅ Date filter (based on event date)
      if (startDate && endDate) {
        where += " AND DATE(date) BETWEEN ? AND ?";
        params.push(startDate, endDate);
      }

      // ✅ Scope filter
      if (scope === "upcoming") {
        where += " AND date >= CURDATE()";
      } else if (scope === "completed") {
        where += " AND date < CURDATE()";
      }

      const query = `
        SELECT 
          title,
          type,
          status,
          DATE_FORMAT(date, '%Y-%m-%d') AS date,
          time,
          description
        FROM events
        ${where}
        ORDER BY date DESC, time DESC
      `;

      const [data] = await conn.query(query, params);
      rows = data;

      title = `Events & News Report${
        scope !== "all"
          ? ` (${scope.charAt(0).toUpperCase() + scope.slice(1)})`
          : ""
      }`;

      columns = [
        { header: "Title", key: "title" },
        { header: "Type", key: "type" },
        { header: "Status", key: "status" },
        { header: "Date", key: "date" },
        { header: "Time", key: "time" },
        { header: "Description", key: "description" },
      ];
    } else {
      return res.status(400).json({ error: "Invalid report type" });
    }

    /* ==================================================
       EMPTY RESULT HANDLING (No 404)
    ================================================== */
    if (rows.length === 0) {
      rows = [{ message: "No data available for the selected criteria." }];
      columns = [{ header: "Notice", key: "message" }];
    }

    /* ==================================================
       FILE PREP
    ================================================== */
    const outputDir = path.join(process.cwd(), "exports");
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, -5);
    const fileName = `${type}_report_${timestamp}.${
      format === "pdf" ? "pdf" : "xlsx"
    }`;
    const outPath = path.join(outputDir, fileName);

    /* ==================================================
       METADATA
    ================================================== */
    const metadata = {
      generatedBy: admin,
      generatedAt: new Date().toLocaleString("en-PH", {
        timeZone: "Asia/Manila",
      }),
      totalRecords: rows.length,
      reportType: type,
      scope,
      dateRange:
        startDate && endDate ? `${startDate} to ${endDate}` : "All time",
    };

    /* ==================================================
       GENERATE FILE
    ================================================== */
    if (format === "pdf") {
      await generatePdfReport(rows, columns, title, outPath, metadata);
    } else {
      await generateExcelReport(rows, columns, title, outPath, metadata);
    }

    /* ==================================================
       SEND FILE + CLEANUP
    ================================================== */
    res.download(outPath, fileName, (err) => {
      if (err) {
        console.error("Error sending file:", err);
        return res.status(500).json({ error: "Failed to download report" });
      }
      setTimeout(() => {
        fs.unlink(outPath, (unlinkErr) => {
          if (unlinkErr) console.error("Error deleting temp file:", unlinkErr);
        });
      }, 30000);
    });
  } catch (err) {
    console.error("❌ Report generation error:", err);
    res.status(500).json({
      error: "Failed to generate report",
      message: err.message,
    });
  } finally {
    conn.release();
  }
}

