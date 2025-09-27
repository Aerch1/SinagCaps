// backend/utils/validateRule.js

export function validateRule(rule) {
  const errors = [];

  if (!rule.service_id && !rule.serviceId) {
    errors.push("Service ID is required.");
  }

  if (!["single", "recurring", "allday", "blocked"].includes(rule.type)) {
    errors.push("Invalid rule type.");
  }

  if (rule.type === "single") {
    if (!rule.time) errors.push("Single slot requires a time.");
    if (rule.slots !== null && rule.slots !== undefined && rule.slots < 1) {
      errors.push("Slots must be at least 1.");
    }
  }

  if (rule.type === "recurring") {
    if (!rule.start || !rule.end) {
      errors.push("Recurring rule requires both start and end times.");
    }
    if (rule.start && rule.end && rule.start >= rule.end) {
      errors.push("Recurring start time must be before end time.");
    }
    if (!rule.interval_mins || rule.interval_mins < 5) {
      errors.push("Recurring interval must be at least 5 minutes.");
    }
  }

  if (rule.type === "allday" || rule.type === "blocked") {
    if (rule.time)
      errors.push("All day/blocked rules cannot include a specific time.");
    // slots are ignored here, but if provided, must be >= 1
    if (rule.slots !== null && rule.slots !== undefined && rule.slots < 1) {
      errors.push("Slots must be at least 1 if provided.");
    }
  }

  return errors;
}
