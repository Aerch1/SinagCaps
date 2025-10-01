import pool from "../config/db.js";

/** returns true if same person already booked same slot (pending/approved/in_progress) */
export async function hasDuplicateBooking({
  idToIgnore = null,
  service_id,
  date,
  time,
  email,
  contactNumber,
}) {
  const params = [service_id, date, time, email, contactNumber];
  let sql = `
    SELECT id FROM appointments
    WHERE service_id=? AND date=? AND time=? 
      AND (email=? OR contactNumber=?)
      AND status IN ('pending','approved','in_progress')`;
  if (idToIgnore) {
    sql += ` AND id != ?`;
    params.push(idToIgnore);
  }
  const [rows] = await pool.query(sql, params);
  return rows.length > 0;
}

export async function countBookedAt({
  service_id,
  date,
  time,
  idToIgnore = null,
}) {
  const params = [service_id, date, time];
  let sql = `
    SELECT COUNT(*) as booked
    FROM appointments
    WHERE service_id=? AND date=? AND time=? 
      AND status IN ('pending','approved','in_progress')`;
  if (idToIgnore) {
    sql += ` AND id != ?`;
    params.push(idToIgnore);
  }
  const [rows] = await pool.query(sql, params);
  return rows[0].booked;
}

export async function insertAppointment({
  user_id = null,
  name,
  email,
  contactNumber = null,
  service_id,
  date,
  time,
  status,
  notes = null,
}) {
  const [result] = await pool.query(
    `INSERT INTO appointments
       (user_id, name, email, contactNumber, service_id, date, time, status, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [user_id, name, email, contactNumber, service_id, date, time, status, notes]
  );
  return result.insertId;
}

export async function updateAppointment({
  id,
  status,
  date,
  time,
  notes,
  name,
  email,
  contactNumber,
  service_id,
}) {
  await pool.query(
    `UPDATE appointments
       SET status = COALESCE(?, status),
           date   = COALESCE(?, date),
           time   = COALESCE(?, time),
           notes  = COALESCE(?, notes),
           name   = COALESCE(?, name),
           email  = COALESCE(?, email),
           contactNumber = COALESCE(?, contactNumber),
           service_id    = COALESCE(?, service_id)
     WHERE id = ?`,
    [status, date, time, notes, name, email, contactNumber, service_id, id]
  );
}
