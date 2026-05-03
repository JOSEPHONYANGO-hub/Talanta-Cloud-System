import { Router, type IRouter } from "express";
import healthRouter from "./health";
import employeesRouter from "./employees";
import departmentsRouter from "./departments";
import branchesRouter from "./branches";
import dashboardRouter from "./dashboard";
import aiRouter from "./ai";
import storageRouter from "./storage";
import organizationsRouter from "./organizations";
import superAdminRouter from "./superAdmin";
import membersRouter from "./members";
import activityRouter from "./activity";
import invitationsRouter from "./invitations";

const router: IRouter = Router();

router.use(superAdminRouter);
router.use(membersRouter);
router.use(activityRouter);
router.use(organizationsRouter);
router.use(healthRouter);
router.use(employeesRouter);
router.use(departmentsRouter);
router.use(branchesRouter);
router.use(dashboardRouter);
router.use(aiRouter);
router.use(storageRouter);
router.use(invitationsRouter);

export default router;
