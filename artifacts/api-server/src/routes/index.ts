import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import boardingHousesRouter from "./boarding-houses";
import roomsRouter from "./rooms";
import reservationsRouter from "./reservations";
import tenantsRouter from "./tenants";
import adminRouter from "./admin";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(boardingHousesRouter);
router.use(roomsRouter);
router.use(reservationsRouter);
router.use(tenantsRouter);
router.use(adminRouter);
router.use(statsRouter);

export default router;
