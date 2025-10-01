// src/utils/reasonMapper.js

/**
 * Map backend confirmation codes into clear, admin-facing explanations.
 * This text is shown in the ConfirmDialog so it must be specific and human-friendly.
 */
export function mapReasonForAdmin(dayAvail, time, code) {
  switch (code) {
    case "BLOCKED":
      return "This date has been blocked by availability rules.";
    case "CLOSED":
      return "The church is closed on this day.";
    case "NO_SCHEDULE":
      return "No schedule is defined for this day. Do you still want to continue?";
    case "OUTSIDE_HOURS":
      return "The selected time is outside the church working hours.";
    case "FULLY_BOOKED":
      return "The selected slot is already fully booked.";
    default:
      return "The selected time is outside the configured availability.";
  }
}
