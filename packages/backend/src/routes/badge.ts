import { Router } from "express";
import { AppDataSource } from "../index";
import { Monitor, MonitorStatus } from "../entities";

const router = Router();

/**
 * @swagger
 * /badge/{monitorId}:
 *   get:
 *     summary: Get a monitor status badge
 *     parameters:
 *       - in: path
 *         name: monitorId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the monitor to get badge for
 *     responses:
 *       200:
 *         description: SVG badge
 *         content:
 *           image/svg+xml:
 *             schema:
 *               type: string
 */
router.get("/:monitorId", async (req, res) => {
  try {
    const monitor = await AppDataSource.getRepository(Monitor).findOne({
      where: { id: req.params.monitorId },
    });

    if (!monitor) {
      return res.status(404).json({ error: "Monitor not found" });
    }

    // Get the latest status
    const latestStatus = await AppDataSource.getRepository(MonitorStatus)
      .createQueryBuilder("status")
      .where("status.monitorId = :monitorId", { monitorId: monitor.id })
      .orderBy("status.startTime", "DESC")
      .getOne();

    const label = monitor.badgeLabel;
    const status =
      latestStatus?.status === "succeeded" ? "succeeded" : "failed";
    const color = latestStatus?.status === "succeeded" ? "green" : "red";

    // Generate badge URL
    const badgeUrl = `https://img.shields.io/badge/${encodeURIComponent(label)}-${status}-${color}`;

    // Fetch badge from shields.io and return it
    const response = await fetch(badgeUrl);
    const svg = await response.text();

    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "no-cache");
    res.send(svg);
  } catch (error) {
    console.error("Error generating badge:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export const badgeRouter = router;
