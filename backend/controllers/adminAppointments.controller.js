import { Parser } from "json2csv";
import pool from "../config/db.js";

/* ---------------- GET /appointments ---------------- */
export const getAppointments = async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const pageSize = Number(req.query.pageSize || 10);
    const offset = (page - 1) * pageSize;

    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM appointments`
    );
    const total = countRows[0].total;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    // ✅ Return date/time as strings to avoid TZ issues in frontend
    const [rows] = await pool.query(
      `SELECT 
     id, name, email, contactNumber, serviceType, status,
     DATE_FORMAT(date, '%Y-%m-%d') AS date,
     time                                   AS time  -- time is stored as '03:00 PM' (VARCHAR)
   FROM appointments
   LIMIT ? OFFSET ?`,
      [pageSize, offset]
    );

    const [serviceRows] = await pool.query(
      `SELECT DISTINCT serviceType FROM appointments ORDER BY serviceType ASC`
    );
    const [statusRows] = await pool.query(
      `SELECT DISTINCT status FROM appointments ORDER BY status ASC`
    );

    res.json({
      data: rows,
      total,
      totalPages,
      meta: {
        serviceTypes: serviceRows.map((r) => r.serviceType).filter(Boolean),
        statuses: statusRows.map((r) => r.status).filter(Boolean),
      },
    });
  } catch (err) {
    console.error("❌ getAppointments error:", err);
    res.status(500).json({ error: "Failed to fetch appointments" });
  }
};

/* ---------------- POST /appointments/filter ---------------- */
export const filterAppointments = async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      query = "",
      status = [],
      serviceType = [],
      date,
      startDate,
      endDate,
      sortBy,
      sortDir,
    } = req.body;

    const offset = (page - 1) * pageSize;
    const where = [];
    const values = [];

    if (query) {
      const q = `%${String(query).toLowerCase()}%`;
      const isNumeric = /^\d+$/.test(String(query));
      // ✅ search id OR name OR email
      where.push(
        `(LOWER(name) LIKE ? OR LOWER(email) LIKE ? OR CAST(id AS CHAR) LIKE ?` +
          (isNumeric ? ` OR id = ?)` : `)`)
      );
      values.push(q, q, q);
      if (isNumeric) values.push(Number(query));
    }

    if (status.length) {
      where.push(`status IN (${status.map(() => "?").join(",")})`);
      values.push(...status);
    }
    if (serviceType.length) {
      where.push(`serviceType IN (${serviceType.map(() => "?").join(",")})`);
      values.push(...serviceType);
    }

    // ✅ Date filters from "Show" or exact date
    if (startDate && endDate) {
      where.push(`DATE(date) BETWEEN ? AND ?`);
      values.push(startDate, endDate);
    } else if (date) {
      where.push(`DATE(date) = ?`);
      values.push(date);
    }

    const whereSQL = where.length ? `WHERE ${where.join(" AND ")}` : "";
    let orderSQL = "";
    if (sortBy && sortDir) {
      const SORTABLE = new Set(["id", "name"]); // restrict here
      const safeKey = SORTABLE.has(sortBy) ? sortBy : "id";
      const safeDir = String(sortDir).toLowerCase() === "desc" ? "DESC" : "ASC";
      orderSQL = `ORDER BY ${safeKey} ${safeDir}`;
    }

    const sqlCount = `SELECT COUNT(*) as total FROM appointments ${whereSQL}`;
    // ✅ Return date/time as strings here too
    const sqlRows = `
  SELECT 
    id, name, email, contactNumber, serviceType, status,
    DATE_FORMAT(date, '%Y-%m-%d') AS date,
    time                           AS time
  FROM appointments
  ${whereSQL}
  ${orderSQL}
  LIMIT ? OFFSET ?
`;

    const [countRows] = await pool.query(sqlCount, values);
    const total = countRows[0].total;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const [rows] = await pool.query(sqlRows, [...values, pageSize, offset]);

    const [serviceRows] = await pool.query(
      `SELECT DISTINCT serviceType FROM appointments ORDER BY serviceType ASC`
    );
    const [statusRows] = await pool.query(
      `SELECT DISTINCT status FROM appointments ORDER BY status ASC`
    );

    res.json({
      data: rows,
      total,
      totalPages,
      meta: {
        serviceTypes: serviceRows.map((r) => r.serviceType).filter(Boolean),
        statuses: statusRows.map((r) => r.status).filter(Boolean),
      },
    });
  } catch (err) {
    console.error("❌ filterAppointments error:", err);
    res.status(500).json({ error: "Failed to filter appointments" });
  }
};

/* ---------------- GET /appointments/export ---------------- */
export const exportAppointments = async (req, res) => {
  try {
    // Export in a readable, timezone-agnostic way (strings)
    const [rows] = await pool.query(
      `SELECT 
     id, name, email, contactNumber, serviceType, status,
     DATE_FORMAT(date, '%Y-%m-%d') AS date,
     time                           AS time
   FROM appointments
   ORDER BY date ASC, time ASC`
    );

    const parser = new Parser({
      fields: [
        "id",
        "name",
        "email",
        "contactNumber",
        "serviceType",
        "status",
        "date",
        "time",
      ],
    });
    const csv = parser.parse(rows);

    res.header("Content-Type", "text/csv");
    res.attachment("appointments.csv");
    res.send(csv);
  } catch (err) {
    console.error("❌ exportAppointments error:", err);
    res.status(500).json({ error: "Failed to export appointments" });
  }
};
