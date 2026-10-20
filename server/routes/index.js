import { Router } from "express";
import adminRoutes from "./admin.js";
import publicRoutes from "./public.js";

const router = Router();
router.use(adminRoutes);
router.use(publicRoutes);

export default router;
