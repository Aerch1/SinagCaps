// src/utils/serviceFormMapper.js

const serviceFormMap = {
  baptism: "baptism",
  wedding: "wedding",
  marriage: "wedding", // alias
  confirmation: "confirmation",
  confession: "confession",
  anointing: "anointing",
  funeral: "funeral",
  "funeral mass": "funeral",
};

export function inferFormType(serviceName = "") {
  if (!serviceName) return "default";

  const normalized = serviceName.trim().toLowerCase();

  // Exact match
  if (serviceFormMap[normalized]) {
    return serviceFormMap[normalized];
  }

  // Partial match
  for (const key in serviceFormMap) {
    if (normalized.includes(key)) {
      return serviceFormMap[key];
    }
  }

  return "default";
}
