import { Router, type IRouter } from "express";
import healthRouter from "./health";
import employeesRouter from "./employees";
import departmentsRouter from "./departments";
import branchesRouter from "./branches";
import dashboardRouter from "./dashboard";
import aiRouter from "./ai";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(employeesRouter);
router.use(departmentsRouter);
router.use(branchesRouter);
router.use(dashboardRouter);
router.use(aiRouter);
router.use(storageRouter);

export default router;
