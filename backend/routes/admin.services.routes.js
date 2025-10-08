import { Router } from "express";
import {
  getServices,
  createService,
  updateService,
  deleteService,
  addServiceRequirement
} from "../controllers/admin/services.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { isAdmin } from "../middleware/isAdmin.js";

const router = Router();

/* ---------------- Services Management ---------------- */
router.get("/", verifyToken, isAdmin, getServices);
router.post("/", verifyToken, isAdmin, createService);
router.patch("/:id", verifyToken, isAdmin, updateService);
router.delete("/:id", verifyToken, isAdmin, deleteService);
router.post("/:serviceId/requirements", verifyToken, isAdmin, addServiceRequirement);
router.delete("/requirements/:id", verifyToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query("DELETE FROM requirements WHERE id = ?", [id]);
    if (result.affectedRows === 0)
      return res.status(404).json({ success: false, message: "Requirement not found" });

    res.json({ success: true, message: "Requirement deleted successfully" });
  } catch (err) {
    console.error("❌ deleteRequirement error:", err);
    res.status(500).json({ success: false, message: "Failed to delete requirement" });
  }
});


export default router;
