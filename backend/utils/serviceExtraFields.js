// /src/utils/serviceExtraFields.js

export const SERVICE_EXTRA_TABLES = {
  baptism: {
    table: "baptism_details",
    fk: "appointment_id",
    joinFields: [
      "childFullName",
      "childDob",
      "childBirthplace",
      "fatherName",
      "motherMaidenName",
      "parentsMarriageType",
    ],
    relations: [
      {
        table: "baptism_sponsors",
        fk: "baptism_id",
        alias: "sponsors",
        fields: ["id", "role", "name", "address"],
      },
    ],
  },
  // Example: add new service types later
  // wedding: { table: "wedding_details", fk: "appointment_id", joinFields: [...] },
};
