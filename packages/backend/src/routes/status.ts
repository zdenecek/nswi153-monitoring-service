import { Router } from 'express';
import { Between } from 'typeorm';
import { AppDataSource } from '../index';
import { MonitorStatus } from '../entities';

const router = Router();

/**
 * @swagger
 * /api/status:
 *   get:
 *     summary: Get monitor statuses with optional filtering and pagination
 *     parameters:
 *       - in: query
 *         name: monitorId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the monitor to get statuses for
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for filtering
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for filtering
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [succeeded, failed]
 *         description: Filter by status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of monitor statuses
 */
router.get('/', async (req, res) => {
  try {
    const { monitorId } = req.query;
    if (!monitorId) {
      return res.status(400).json({ error: 'Monitor ID is required' });
    }

    const filter = req.query as unknown as StatusFilter;
    const page = parseInt(filter.page?.toString() || '1');
    const pageSize = parseInt(filter.pageSize?.toString() || '10');
    const skip = (page - 1) * pageSize;

    const queryBuilder = AppDataSource.getRepository(MonitorStatus)
      .createQueryBuilder('status')
      .where('status.monitorId = :monitorId', { monitorId })
      .skip(skip)
      .take(pageSize)
      .orderBy('status.startTime', 'DESC');

    if (filter.from && filter.to) {
      queryBuilder.andWhere({
        startTime: Between(new Date(filter.from), new Date(filter.to)),
      });
    }

    if (filter.status) {
      queryBuilder.andWhere('status.status = :status', { status: filter.status });
    }

    const [statuses, total] = await queryBuilder.getManyAndCount();

    res.json({
      data: statuses,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('Error fetching monitor statuses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/status/calendar:
 *   get:
 *     summary: Get monitor status calendar data
 *     parameters:
 *       - in: query
 *         name: monitorId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the monitor to get calendar data for
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *         required: true
 *         description: Start date for calendar
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *         required: true
 *         description: End date for calendar
 *     responses:
 *       200:
 *         description: Calendar data with daily status summaries
 */
router.get('/calendar', async (req, res) => {
  try {
    const { monitorId, from, to } = req.query;

    if (!monitorId || !from || !to) {
      return res.status(400).json({ error: 'Monitor ID, from, and to dates are required' });
    }

    const startDate = new Date(from as string);
    const endDate = new Date(to as string);

    // Get all statuses for the period
    const statuses = await AppDataSource.getRepository(MonitorStatus)
      .createQueryBuilder('status')
      .where('status.monitorId = :monitorId', { monitorId })
      .andWhere('status.startTime BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getMany();

    // Group statuses by day
    const dailyStats = new Map<string, { total: number; failed: number }>();

    statuses.forEach((status) => {
      const day = status.startTime.toISOString().split('T')[0];
      const stats = dailyStats.get(day) || { total: 0, failed: 0 };
      stats.total++;
      if (status.status === 'failed') {
        stats.failed++;
      }
      dailyStats.set(day, stats);
    });

    // Convert to calendar data
    const calendarData = Array.from(dailyStats.entries()).map(([date, stats]) => {
      const failureRate = (stats.failed / stats.total) * 100;
      let status: 'success' | 'warning' | 'error';

      if (failureRate === 0) {
        status = 'success';
      } else if (failureRate <= 5) {
        status = 'warning';
      } else {
        status = 'error';
      }

      return {
        date,
        status,
        failureRate: Math.round(failureRate * 100) / 100,
        total: stats.total,
        failed: stats.failed,
      };
    });

    res.json(calendarData);
  } catch (error) {
    console.error('Error fetching calendar data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/status/graph:
 *   get:
 *     summary: Get monitor status graph data
 *     parameters:
 *       - in: query
 *         name: monitorId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the monitor to get graph data for
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *         required: true
 *         description: Start date for graph
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *         required: true
 *         description: End date for graph
 *     responses:
 *       200:
 *         description: Graph data with response times
 */
router.get('/graph', async (req, res) => {
  try {
    const { monitorId, from, to } = req.query;

    if (!monitorId || !from || !to) {
      return res.status(400).json({ error: 'Monitor ID, from, and to dates are required' });
    }

    const startDate = new Date(from as string);
    const endDate = new Date(to as string);

    const statuses = await AppDataSource.getRepository(MonitorStatus)
      .createQueryBuilder('status')
      .where('status.monitorId = :monitorId', { monitorId })
      .andWhere('status.startTime BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .orderBy('status.startTime', 'ASC')
      .getMany();

    const graphData = statuses.map((status) => ({
      time: status.startTime.toISOString(),
      responseTime: status.responseTime,
      status: status.status,
    }));

    res.json(graphData);
  } catch (error) {
    console.error('Error fetching graph data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export const statusRouter = router; 