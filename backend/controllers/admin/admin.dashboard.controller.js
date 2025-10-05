import pool from "../../config/db.js";

/* ==================================================
   GET /api/admin/dashboard/kpis?period=Week|Month|Year
   → Returns KPI summary data
================================================== */
export async function getKpiData(req, res) {
  const { period = "Month" } = req.query;

  try {
    // -------------------------
    // Date range filters
    // -------------------------
    let currentWhere, previousWhere;
    if (period === "Week") {
      currentWhere = "YEARWEEK(date, 1) = YEARWEEK(CURDATE(), 1)";
      previousWhere =
        "YEARWEEK(date, 1) = YEARWEEK(CURDATE() - INTERVAL 1 WEEK, 1)";
    } else if (period === "Year") {
      currentWhere = "YEAR(date) = YEAR(CURDATE())";
      previousWhere = "YEAR(date) = YEAR(CURDATE() - INTERVAL 1 YEAR)";
    } else {
      currentWhere =
        "YEAR(date) = YEAR(CURDATE()) AND MONTH(date) = MONTH(CURDATE())";
      previousWhere =
        "YEAR(date) = YEAR(CURDATE() - INTERVAL 1 MONTH) AND MONTH(date) = MONTH(CURDATE() - INTERVAL 1 MONTH)";
    }

    // -------------------------
    // Appointments (current vs previous)
    // -------------------------
    const [currentAppts] = await pool.query(
      `SELECT 
         COUNT(*) as total,
         SUM(status='pending') as pending
       FROM appointments
       WHERE ${currentWhere}`
    );

    const [previousAppts] = await pool.query(
      `SELECT 
         COUNT(*) as total,
         SUM(status='pending') as pending
       FROM appointments
       WHERE ${previousWhere}`
    );

    // -------------------------
    // Today vs Yesterday
    // -------------------------
    const [today] = await pool.query(
      `SELECT COUNT(*) as today 
       FROM appointments 
       WHERE DATE(date) = CURDATE()`
    );

    const [yesterday] = await pool.query(
      `SELECT COUNT(*) as yesterday 
       FROM appointments 
       WHERE DATE(date) = CURDATE() - INTERVAL 1 DAY`
    );

    // -------------------------
    // Active Users
    // -------------------------
    const [currentUsers] = await pool.query(
      `SELECT COUNT(*) as activeUsers
       FROM users
       WHERE role='user' AND isVerified=TRUE
         AND ${
           period === "Year"
             ? "YEAR(created_at) = YEAR(CURDATE())"
             : period === "Week"
             ? "YEARWEEK(created_at,1)=YEARWEEK(CURDATE(),1)"
             : "YEAR(created_at)=YEAR(CURDATE()) AND MONTH(created_at)=MONTH(CURDATE())"
         }`
    );

    const [previousUsers] = await pool.query(
      `SELECT COUNT(*) as activeUsers
       FROM users
       WHERE role='user' AND isVerified=TRUE
         AND ${
           period === "Year"
             ? "YEAR(created_at)=YEAR(CURDATE() - INTERVAL 1 YEAR)"
             : period === "Week"
             ? "YEARWEEK(created_at,1)=YEARWEEK(CURDATE() - INTERVAL 1 WEEK,1)"
             : "YEAR(created_at)=YEAR(CURDATE() - INTERVAL 1 MONTH) AND MONTH(created_at)=MONTH(CURDATE() - INTERVAL 1 MONTH)"
         }`
    );

    // -------------------------
    // Final KPI response
    // -------------------------
    const data = [
      {
        id: "total",
        title: "Total Appointments",
        current: currentAppts[0].total || 0,
        previous: previousAppts[0].total || 0,
      },
      {
        id: "pending",
        title: "Pending Appointments",
        current: currentAppts[0].pending || 0,
        previous: previousAppts[0].pending || 0,
      },
      {
        id: "today",
        title: "Today’s Schedule",
        current: today[0].today || 0,
        previous: yesterday[0].yesterday || 0,
      },
      {
        id: "activeUsers",
        title: "Total Active Users",
        current: currentUsers[0].activeUsers || 0,
        previous: previousUsers[0].activeUsers || 0,
      },
    ];

    res.json({ success: true, data });
  } catch (err) {
    console.error("❌ getKpiData error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch KPI data" });
  }
}

/* ==================================================
   GET /api/admin/dashboard/area?period=Week|Month|Year
   → Returns data for ServiceAreaChart (dynamic services)
================================================== */
export async function getAreaChartData(req, res) {
  const { period = "Month" } = req.query;

  try {
    let groupBy, label;

    if (period === "Week") {
      groupBy = "DAYOFWEEK(a.date)";
      label = "DATE_FORMAT(a.date, '%a')";
    } else if (period === "Year") {
      groupBy = "MONTH(a.date)";
      label = "DATE_FORMAT(a.date, '%b')";
    } else {
      groupBy = "FLOOR((DAY(a.date) - 1) / 7) + 1";
      label = "CONCAT('Week ', FLOOR((DAY(a.date) - 1) / 7) + 1)";
    }

    const [rows] = await pool.query(
      `SELECT ${label} as name,
              s.name as serviceName,
              COUNT(*) as count
       FROM appointments a
       JOIN services s ON a.service_id = s.id
       GROUP BY ${groupBy}, s.id
       ORDER BY MIN(a.date)`
    );

    const grouped = {};
    rows.forEach((r) => {
      if (!grouped[r.name]) grouped[r.name] = { name: r.name };
      grouped[r.name][r.serviceName] = r.count;
    });

    res.json({ success: true, data: Object.values(grouped) });
  } catch (err) {
    console.error("❌ getAreaChartData error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch area chart data" });
  }
}

/* ==================================================
   GET /api/admin/dashboard/bar?period=Week|Month|Year
   → Returns data for ServiceBarChart (totals + per-service)
================================================== */
export async function getBarChartData(req, res) {
  const { period = "Month" } = req.query;

  try {
    let groupBy, label;

    if (period === "Week") {
      groupBy = "DAYOFWEEK(a.date)";
      label = "DAYNAME(a.date)";
    } else if (period === "Year") {
      groupBy = "MONTH(a.date)";
      label = "MONTHNAME(a.date)";
    } else {
      groupBy = "FLOOR((DAY(a.date) - 1) / 7) + 1";
      label = "CONCAT('Week ', FLOOR((DAY(a.date) - 1) / 7) + 1)";
    }

    const [rows] = await pool.query(
      `SELECT ${label} as name,
              s.name as serviceName,
              COUNT(*) as count
       FROM appointments a
       JOIN services s ON a.service_id = s.id
       GROUP BY ${groupBy}, s.id
       ORDER BY MIN(a.date)`
    );

    const grouped = {};
    rows.forEach((r) => {
      if (!grouped[r.name])
        grouped[r.name] = { name: r.name, total: 0, services: {} };
      grouped[r.name].services[r.serviceName] = r.count;
      grouped[r.name].total += r.count;
    });

    res.json({ success: true, data: Object.values(grouped) });
  } catch (err) {
    console.error("❌ getBarChartData error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch bar chart data" });
  }
}
