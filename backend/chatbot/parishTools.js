import pool from "../config/db.js";
import { addDays, format, startOfDay } from "date-fns";
import { resolveAvailability } from "../utils/availabilityResolver.js";

/* ===================================================
   🏛️ PARISH TOOLS (Dynamic Data Helpers)
   → Live data reads with smart caching for light tables
=================================================== */
const cache = {
  services: { data: null, lastFetch: 0 },
  announcements: { data: null, lastFetch: 0 },
  advisories: { data: null, lastFetch: 0 },
  events: { data: null, lastFetch: 0 },
};
const CACHE_TTL = 60 * 1000; // 1 minute cache for small tables

export const parishTools = {
  /* ===================================================
     🕊️ Get list of active parish services (cached)
  =================================================== */
  async getServices(forceRefresh = false) {
    try {
      const now = Date.now();
      if (!forceRefresh && cache.services.data && now - cache.services.lastFetch < CACHE_TTL)
        return cache.services.data;

      const [rows] = await pool.query(
        "SELECT id, name, description, form_type FROM services WHERE active = 1 ORDER BY name ASC"
      );
      cache.services = { data: rows || [], lastFetch: now };

      console.log(rows?.length ? "📋 Services updated from DB" : "⚠️ No active services found.");
      return rows || [];
    } catch (err) {
      console.error("❌ getServices() error:", err);
      return cache.services.data || [];
    }
  },

  /* ===================================================
     🕓 Get church working hours for a given weekday
  =================================================== */
  async getChurchHours(weekday) {
    try {
      const [rows] = await pool.query(
        `SELECT day_of_week, open_time, close_time, is_closed 
         FROM church_hours WHERE day_of_week = ?`,
        [weekday]
      );
      return rows?.[0] || null;
    } catch (err) {
      console.error("❌ getChurchHours() error:", err);
      return null;
    }
  },

  /* ===================================================
     📅 Get availability for a service (uses resolver)
  =================================================== */
  async getAvailability(serviceId, daysAhead = 5) {
    try {
      const today = startOfDay(new Date());
      const results = [];

      for (let i = 0; i < daysAhead; i++) {
        const day = addDays(today, i);
        const dateStr = format(day, "yyyy-MM-dd");
        const weekday = day.getDay();

        const [[rules], [appointments], [hours]] = await Promise.all([
          pool.execute(
            `SELECT id, service_id, date, time, slots, status, type, weekday
             FROM rules
             WHERE service_id = ?
               AND (date = ? OR (date IS NULL AND weekday = ?))
               AND (date IS NULL OR date >= CURDATE())
             ORDER BY FIELD(type,'blocked','allday','single','recurring'), time ASC`,
            [serviceId, dateStr, weekday]
          ),
          pool.execute(
            `SELECT TIME_FORMAT(time, '%H:%i') AS time
             FROM appointments
             WHERE service_id = ? AND date = ? 
             AND status IN ('pending','approved')`,
            [serviceId, dateStr]
          ),
          pool.execute(
            `SELECT open_time, close_time, is_closed
             FROM church_hours WHERE day_of_week = ?`,
            [weekday]
          ),
        ]);

        const churchHours = hours?.[0] || null;
        const availability = resolveAvailability({ rules, appointments, churchHours });

        results.push({
          date: dateStr,
          status: availability.status,
          slots: availability.slots,
          capacity: availability.capacity,
          booked: availability.booked,
          remaining: availability.remaining,
        });
      }

      console.log(`📆 getAvailability() → Service ${serviceId}, next ${daysAhead} days`);
      return results;
    } catch (err) {
      console.error("❌ getAvailability() error:", err);
      return [];
    }
  },

  /* ===================================================
     🎉 Get upcoming parish events (cached)
  =================================================== */
  async getEvents(forceRefresh = false) {
    try {
      const now = Date.now();
      if (!forceRefresh && cache.events.data && now - cache.events.lastFetch < CACHE_TTL)
        return cache.events.data;

      const [rows] = await pool.query(
        `SELECT id, title, description, date, time, type, status
         FROM events WHERE status = 'Active' 
         AND date >= CURDATE() ORDER BY date ASC LIMIT 5`
      );
      cache.events = { data: rows || [], lastFetch: now };

      console.log(rows?.length ? "🎉 getEvents() updated" : "⚠️ No active events found.");
      return rows || [];
    } catch (err) {
      console.error("❌ getEvents() error:", err);
      return cache.events.data || [];
    }
  },

  /* ===================================================
     📢 Get latest announcements (cached)
  =================================================== */
  async getAnnouncements(forceRefresh = false) {
    try {
      const now = Date.now();
      if (!forceRefresh && cache.announcements.data && now - cache.announcements.lastFetch < CACHE_TTL)
        return cache.announcements.data;

      const [rows] = await pool.query(
        `SELECT id, title, category, author, text, link, date, status 
         FROM announcements 
         WHERE status = 'active'
         ORDER BY date DESC LIMIT 3`
      );
      cache.announcements = { data: rows || [], lastFetch: now };
      console.log(rows?.length ? "📢 Announcements updated" : "⚠️ No announcements found.");
      return rows || [];
    } catch (err) {
      console.error("❌ getAnnouncements() error:", err);
      return cache.announcements.data || [];
    }
  },

  /* ===================================================
     🔔 Get advisories (cached)
  =================================================== */
  async getAdvisories(forceRefresh = false) {
    try {
      const now = Date.now();
      if (!forceRefresh && cache.advisories.data && now - cache.advisories.lastFetch < CACHE_TTL)
        return cache.advisories.data;

      const [rows] = await pool.query(
        `SELECT id, title, message, type, status, created_at
         FROM advisories
         WHERE status = 'active'
         ORDER BY created_at DESC LIMIT 5`
      );
      cache.advisories = { data: rows || [], lastFetch: now };
      console.log(rows?.length ? "🔔 Advisories updated" : "⚠️ No advisories found.");
      return rows || [];
    } catch (err) {
      console.error("❌ getAdvisories() error:", err);
      return cache.advisories.data || [];
    }
  },
};
