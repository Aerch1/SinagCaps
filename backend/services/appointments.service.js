// src/services/appointments.service.js
import pool from "../config/db.js";

/**
 * ✅ Check duplicate bookings (same person, same slot, not cancelled/rejected/archived)
 */
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
      AND status IN ('pending','approved')`; // 🔥 cleaned
  if (idToIgnore) {
    sql += ` AND id != ?`;
    params.push(idToIgnore);
  }
  const [rows] = await pool.query(sql, params);
  return rows.length > 0;
}

/**
 * ✅ Count booked slots for capacity validation
 */
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
      AND status IN ('pending','approved')`; // 🔥 cleaned
  if (idToIgnore) {
    sql += ` AND id != ?`;
    params.push(idToIgnore);
  }
  const [rows] = await pool.query(sql, params);
  return rows[0].booked;
}

/**
 * ✅ Check if same email already has an active booking for the same service
 */
export async function hasActiveBookingSameService({ email, service_id }) {
  const [rows] = await pool.query(
    `SELECT id FROM appointments 
     WHERE email = ? 
       AND service_id = ? 
       AND status IN ('pending','approved')`,
    [email, service_id]
  );
  return rows.length > 0;
}

/**
 * ✅ Insert new appointment
 */
export async function insertAppointment({
  user_id = null,
  name,
  email,
  contactNumber = null,
  address = null, // ✅ added
  service_id,
  date,
  time,
  status,
  notes = null,
}) {
  const [result] = await pool.query(
    `INSERT INTO appointments
       (user_id, name, email, contactNumber, address, service_id, date, time, status, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      user_id,
      name,
      email,
      contactNumber,
      address,
      service_id,
      date,
      time,
      status,
      notes,
    ]
  );
  return result.insertId;
}

/**
 * ✅ Update existing appointment (with address)
 */
export async function updateAppointment({
  id,
  status,
  date,
  time,
  notes,
  name,
  email,
  contactNumber,
  address, // ✅ added
  service_id,
}) {
  await pool.query(
    `UPDATE appointments
       SET status       = COALESCE(?, status),
           date         = COALESCE(?, date),
           time         = COALESCE(?, time),
           notes        = COALESCE(?, notes),
           name         = COALESCE(?, name),
           email        = COALESCE(?, email),
           contactNumber= COALESCE(?, contactNumber),
           address      = COALESCE(?, address),   -- ✅ new field
           service_id   = COALESCE(?, service_id)
     WHERE id = ?`,
    [
      status,
      date,
      time,
      notes,
      name,
      email,
      contactNumber,
      address,
      service_id,
      id,
    ]
  );
}
