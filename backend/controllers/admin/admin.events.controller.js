// src/controllers/admin/admin.events.controller.js
import pool from "../../config/db.js";
import { v2 as cloudinary } from "cloudinary";
import { createNotification } from "../../utils/createNotification.js";

function validateEvent(data) {
  const errors = {};

  if (!data.title?.trim()) errors.title = "Title is required";
  if (!data.date) {
    errors.date = "Date is required";
  } else {
    const today = new Date();
    const eventDate = new Date(data.date);
    // Reset time portion to 00:00 for comparison
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);

    if (eventDate < today) {
      errors.date = "Date cannot be in the past";
    }
  }

  // ✅ Only require time if NOT all-day event
  const isAllDay =
    data.all_day === "1" || data.all_day === 1 || data.all_day === true;

  if (!isAllDay && !data.time) {
    errors.time = "Time is required for non-all-day events";
  }

  if (!data.type) errors.type = "Type (event/news) is required";

  // ✅ Validate end_time only if provided and not all-day
  if (!isAllDay && data.time && data.end_time) {
    const [h1, m1] = data.time.split(":") || [];
    const [h2, m2] = data.end_time.split(":");
    const startMinutes = parseInt(h1) * 60 + parseInt(m1);
    const endMinutes = parseInt(h2) * 60 + parseInt(m2);

    if (endMinutes <= startMinutes) {
      errors.end_time = "End time must be after start time";
    }
  }

  return errors;
}

/* ==================================================
   CREATE (with varied notification)
================================================== */
export async function createEvent(req, res) {
  const conn = await pool.getConnection();
  try {
    const {
      title,
      description,
      date,
      time,
      end_time = null,
      all_day = 0,
      status = "Active",
      type,
    } = req.body;

    const errors = validateEvent(req.body);
    if (Object.keys(errors).length)
      return res.status(400).json({ success: false, errors });

    const image_url = req.file?.path || null;

    // ✅ Convert all_day to proper boolean for database
    const isAllDay =
      all_day === "1" || all_day === 1 || all_day === true ? 1 : 0;

    // ✅ Clear time fields if all-day event
    const finalTime = isAllDay ? null : time;
    const finalEndTime = isAllDay ? null : end_time;

    await conn.beginTransaction();

    const [result] = await conn.query(
      `
        INSERT INTO events (title, description, date, time, end_time, all_day, status, type, image_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        title,
        description,
        date,
        finalTime,
        finalEndTime,
        isAllDay,
        status,
        type,
        image_url,
      ]
    );

    const eventId = result.insertId;

    /* ✅ Fetch all verified users */
    const [users] = await conn.query(
      `SELECT id FROM users WHERE role='user' AND isVerified=1`
    );

    /* ✅ Notification templates */
    const templates = [
      `There's a new ${type.toLowerCase()}: "${title}". Check it out in the Events & News section.`,
      `A new ${type.toLowerCase()} titled "${title}" has just been posted. Visit Events & News for details.`,
      `Stay updated! "${title}" has been added under ${type}. View it now in Events & News.`,
      `New ${type.toLowerCase()} alert: "${title}". Tap Events & News to learn more.`,
      `📅 "${title}" has been announced! Visit Events & News for more info.`,
    ];

    for (const u of users) {
      const message = templates[Math.floor(Math.random() * templates.length)];

      await createNotification({
        user_id: u.id,
        title: `🎉 New ${type === "news" ? "News" : "Event"} Posted`,
        message,
        type: "event",
        reference_id: eventId,
        transaction_id: `EVT-${String(eventId).padStart(5, "0")}`,
      });
    }

    await conn.commit();
    res.json({ success: true, id: eventId, image_url });
  } catch (err) {
    await conn.rollback();
    console.error("❌ CREATE EVENT ERROR:", err);
    res.status(500).json({ success: false, error: "Server error" });
  } finally {
    conn.release();
  }
}

/* ==================================================
   READ ALL (PH timezone)
================================================== */
export async function getAllEvents(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT *
      FROM events
      WHERE DATE_ADD(DATE(CONVERT_TZ(date, '+00:00', '+08:00')), INTERVAL 3 DAY) >= CURDATE()
      ORDER BY date ASC, time ASC
    `);

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("❌ GET EVENTS ERROR:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
}

/* ==================================================
   UPDATE (re-send notifications for reactivated events)
================================================== */
export async function updateEvent(req, res) {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params;
    const {
      title,
      description,
      date,
      time,
      end_time = null,
      all_day = 0,
      status,
      type,
    } = req.body;

    const errors = validateEvent(req.body);
    if (Object.keys(errors).length)
      return res.status(400).json({ success: false, errors });

    const image_url = req.file?.path || null;

    // ✅ Convert all_day to proper boolean for database
    const isAllDay =
      all_day === "1" || all_day === 1 || all_day === true ? 1 : 0;

    // ✅ Clear time fields if all-day event
    const finalTime = isAllDay ? null : time;
    const finalEndTime = isAllDay ? null : end_time;

    await conn.beginTransaction();

    await conn.query(
      `
        UPDATE events
        SET title=?, description=?, date=?, time=?, end_time=?, all_day=?, status=?, type=?, image_url=COALESCE(?, image_url)
        WHERE id=?
      `,
      [
        title,
        description,
        date,
        finalTime,
        finalEndTime,
        isAllDay,
        status,
        type,
        image_url,
        id,
      ]
    );

    // ✅ If event re-activated or rescheduled soon — notify users again
    if (status.toLowerCase() === "active") {
      const [users] = await conn.query(
        `SELECT id FROM users WHERE role='user' AND isVerified=1`
      );

      const templates = [
        `Heads up! "${title}" is coming up soon — mark your calendar.`,
        `Upcoming ${type.toLowerCase()}: "${title}" on ${date}. Don't miss it!`,
        `⏰ Reminder: "${title}" is scheduled on ${date}. Check details in Events & News.`,
        `✨ "${title}" is back on schedule — see the latest updates now.`,
        `Don't miss "${title}" happening on ${date}. Tap Events to see full details.`,
      ];

      for (const u of users) {
        const message = templates[Math.floor(Math.random() * templates.length)];

        await createNotification({
          user_id: u.id,
          title: `📢 Upcoming ${type === "news" ? "News" : "Event"} Reminder`,
          message,
          type: "event",
          reference_id: id,
          transaction_id: `EVT-${String(id).padStart(5, "0")}`,
        });
      }
    }

    await conn.commit();
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    console.error("❌ UPDATE EVENT ERROR:", err);
    res.status(500).json({ success: false, error: "Server error" });
  } finally {
    conn.release();
  }
}

/* ==================================================
   DELETE
================================================== */
export async function deleteEvent(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query("SELECT image_url FROM events WHERE id=?", [
      id,
    ]);

    if (rows[0]?.image_url) {
      const url = rows[0].image_url;
      const parts = url.split("/");
      const folder = parts.at(-2);
      const filename = parts.at(-1).split(".")[0];
      const publicId = `${folder}/${filename}`;
      await cloudinary.uploader.destroy(publicId).catch(() => {});
    }

    await pool.query("DELETE FROM events WHERE id=?", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ DELETE EVENT ERROR:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
}

/* ==================================================
   GET /api/admin/events/upcoming
   → Returns all active events happening today or later
   + Sends reminders automatically
   + Excludes events older than 3 days
================================================== */
export async function getUpcomingEvents(req, res) {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(`
      SELECT id, title, description, date, time, all_day, status, type, image_url
      FROM events
      WHERE LOWER(TRIM(status))='active'
        AND type='event'
        AND (date > CURDATE() OR (date = CURDATE() AND (all_day = 1 OR time >= CURTIME())))
      ORDER BY date ASC, time ASC
    `);

    // ✅ Auto-send reminder notifications for events happening today/tomorrow
    const today = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

    const upcomingSoon = rows.filter(
      (e) => e.date === today || e.date === tomorrow
    );

    if (upcomingSoon.length > 0) {
      const [users] = await conn.query(
        `SELECT id FROM users WHERE role='user' AND isVerified=1`
      );

      for (const event of upcomingSoon) {
        const timeStr = event.all_day ? "" : ` at ${event.time}`;

        const templates = [
          `⏰ Reminder: "${event.title}" is happening ${
            event.date === today ? "today" : "tomorrow"
          }${timeStr}.`,
          `Don't miss it! "${event.title}" takes place ${
            event.date === today ? "today" : "tomorrow"
          } — check the details in Events & News.`,
          `📅 "${event.title}" is ${
            event.date === today ? "today" : "tomorrow"
          }! Stay tuned.`,
          `Upcoming ${event.type.toLowerCase()}: "${event.title}" starts ${
            event.date === today ? "today" : "tomorrow"
          }.`,
        ];

        for (const u of users) {
          const message =
            templates[Math.floor(Math.random() * templates.length)];

          await createNotification({
            user_id: u.id,
            title: `🎟️ ${
              event.date === today ? "Today's Event" : "Tomorrow's Event"
            }`,
            message,
            type: "event",
            reference_id: event.id,
            transaction_id: `EVT-${String(event.id).padStart(5, "0")}`,
          });
        }
      }
    }

    res.json({ success: true, data: rows, count: rows.length });
  } catch (err) {
    console.error("❌ GET UPCOMING EVENTS ERROR:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch upcoming events",
    });
  } finally {
    conn.release();
  }
}
