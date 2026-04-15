import { Router } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import complaintsRouter from "./complaints.js";
import sosRouter from "./sos.js";
import notificationsRouter from "./notifications.js";
import rewardsRouter from "./rewards.js";
import adminRouter from "./admin.js";

const router = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/complaints", complaintsRouter);
router.use("/sos", sosRouter);
router.use("/notifications", notificationsRouter);
router.use("/rewards", rewardsRouter);
router.use("/admin", adminRouter);

export default router;
