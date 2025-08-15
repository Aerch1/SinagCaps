// src/pages/Public/settings/panels/appointmentsDemo.js
export const DEMO_APPTS = [
  {
    id: "a-0001",
    service: "Baptism",
    startsAt: "2025-05-04T10:30:00.000Z",
    ref: "000085752257",
    name: "Juan Dela Cruz",
    status: "approved", // pending | approved | rescheduled | in-progress | completed | cancelled
    wasRescheduled: false,
    inProgress: false,
  },
  {
    id: "a-0002",
    service: "Wedding",
    startsAt: "2025-06-12T14:00:00.000Z",
    ref: "000085799001",
    name: "Maria Santos",
    status: "completed",
    wasRescheduled: false,
    inProgress: false,
  },
  {
    id: "a-0003",
    service: "Funeral Mass",
    startsAt: "2025-04-28T09:00:00.000Z",
    ref: "000085745678",
    name: "—",
    status: "cancelled",
    wasRescheduled: false,
    inProgress: false,
  },
];

export function getApptById(id) {
  return DEMO_APPTS.find((x) => x.id === id) || null;
}
