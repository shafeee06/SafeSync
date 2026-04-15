import { Router, Request, Response } from "express";

const router = Router();

// ✅ TEMP FIX (avoid workspace import issue)
const HealthCheckResponse = {
  parse: (data: any) => data,
};

router.get("/healthz", (_req: Request, res: Response) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

export default router;