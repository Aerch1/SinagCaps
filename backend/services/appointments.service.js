import pool from "../config/db.js";

const SORTABLE = new Set(["date", "time"]);
const safeSort = (key, dir) => {
  if (!SORTABLE.has(key)) return "ORDER BY date ASC"; // default
  return `ORDER BY ${key} ${dir === "desc" ? "DESC" : "ASC"}`;
};

const normalizeArray = (v) => {
  if (!v) return [];
  if (Array.isArray(v)) return v.filter(Boolean);
  return [v];
};

export const fetchAppointments = async (params = {}) => {
  const {
    page = 1,
    pageSize = 10,
    query = "",
    fromDate,
    toDate,
    sortBy = "date",
    sortDir = "asc",
  } = params;

  const status = normalizeArray(params.status);
  const serviceType = normalizeArray(params.serviceType);

  const offset = (page - 1) * pageSize;
  let where = [];
  let values = [];

  if (query) {
    where.push("(LOWER(name) LIKE ? OR LOWER(email) LIKE ?)");
    values.push(`%${query.toLowerCase()}%`, `%${query.toLowerCase()}%`);
  }

  if (status.length) {
    where.push(`status IN (${status.map(() => "?").join(",")})`);
    values.push(...status);
  }

  if (serviceType.length) {
    where.push(`serviceType IN (${serviceType.map(() => "?").join(",")})`);
    values.push(...serviceType);
  }

  if (fromDate) {
    where.push("date >= ?");
    values.push(fromDate);
  }
  if (toDate) {
    where.push("date <= ?");
    values.push(toDate);
  }

  const whereSQL = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const orderSQL = safeSort(sortBy, sortDir);

  const sqlCount = `SELECT COUNT(*) as total FROM appointments ${whereSQL}`;
  const sqlRows = `
    SELECT id, name, email, serviceType, status, date, time
    FROM appointments
    ${whereSQL}
    ${orderSQL}
    LIMIT ? OFFSET ?
  `;

  const [countRows] = await pool.query(sqlCount, values);
  const total = countRows[0].total;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const [rows] = await pool.query(sqlRows, [
    ...values,
    Number(pageSize),
    Number(offset),
  ]);

  console.log("📊 FetchAppointments debug →", {
    page,
    pageSize,
    query,
    status,
    serviceType,
    sql: sqlRows,
    values: [...values, pageSize, offset],
  });

  return { rows, total, totalPages };
};
/* ---------------- Export Appointments (all rows, no paging) ---------------- */
export const fetchAppointmentsForExport = async (params = {}) => {
  const {
    query = "",
    status = [],
    serviceType = [],
    fromDate,
    toDate,
  } = params;

  let where = [];
  let values = [];

  if (query) {
    where.push("(LOWER(name) LIKE ? OR LOWER(email) LIKE ?)");
    values.push(`%${query.toLowerCase()}%`, `%${query.toLowerCase()}%`);
  }

  if (status?.length) {
    const arr = Array.isArray(status) ? status : [status];
    where.push(`status IN (${arr.map(() => "?").join(",")})`);
    values.push(...arr);
  }

  if (serviceType?.length) {
    const arr = Array.isArray(serviceType) ? serviceType : [serviceType];
    where.push(`serviceType IN (${arr.map(() => "?").join(",")})`);
    values.push(...arr);
  }

  if (fromDate) {
    where.push("date >= ?");
    values.push(fromDate);
  }
  if (toDate) {
    where.push("date <= ?");
    values.push(toDate);
  }

  const whereSQL = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const [rows] = await pool.query(
    `SELECT id, name, email, serviceType, status, date, time
     FROM appointments
     ${whereSQL}
     ORDER BY date ASC, time ASC`,
    values
  );

  return rows;
};
