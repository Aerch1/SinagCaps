// backend/utils/validateRule.js

export function validateRule(rule) {
  const errors = [];

  // Always required
  if (!rule.service_id && !rule.serviceId) {
    errors.push("Service ID is required.");
  }

  // Type validation
  if (!["single", "recurring", "allday", "blocked"].includes(rule.type)) {
    errors.push("Invalid rule type.");
  }

  // Minimal type checks (only DB integrity, not UX niceties)
  if (rule.type === "single" && !rule.time) {
    errors.push("Single slot requires a time.");
  }

  if (rule.type === "recurring" && (!rule.start || !rule.end)) {
    errors.push("Recurring requires both start and end times.");
  }

  if ((rule.type === "allday" || rule.type === "blocked") && rule.time) {
    errors.push("All day/blocked rules cannot include a specific time.");
  }

  return errors;
}
