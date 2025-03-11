import { Router } from 'express';
import { AppDataSource } from '../index';
import { Monitor } from '../entities';
import { MonitorFilter, MonitorType } from '@monitoring-service/shared';

const router = Router();

/**
 * @swagger
 * /api/monitors:
 *   get:
 *     summary: Get all monitors with optional filtering and pagination
 *     parameters:
 *       - in: query
 *         name: label
 *         schema:
 *           type: string
 *         description: Filter by monitor label
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [ping, website]
 *         description: Filter by monitor type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [succeeded, failed]
 *         description: Filter by latest status
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
 *         description: List of monitors
 */
router.get('/', async (req, res) => {
  try {
    const filter = req.query as unknown as MonitorFilter;
    const page = parseInt(filter.page?.toString() || '1');
    const pageSize = parseInt(filter.pageSize?.toString() || '10');
    const skip = (page - 1) * pageSize;

    const queryBuilder = AppDataSource.getRepository(Monitor)
      .createQueryBuilder('monitor')
      .leftJoinAndSelect('monitor.project', 'project')
      .skip(skip)
      .take(pageSize);

    if (filter.label) {
      queryBuilder.andWhere('monitor.label ILIKE :label', { label: `%${filter.label}%` });
    }

    if (filter.type) {
      queryBuilder.andWhere('monitor.type = :type', { type: filter.type });
    }

    if (filter.status) {
      queryBuilder
        .leftJoin('monitor.statuses', 'status')
        .andWhere('status.status = :status', { status: filter.status })
        .orderBy('status.startTime', 'DESC')
        .limit(1);
    }

    const [monitors, total] = await queryBuilder.getManyAndCount();

    res.json({
      data: monitors,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('Error fetching monitors:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/monitors:
 *   post:
 *     summary: Create a new monitor
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - label
 *               - type
 *               - periodicity
 *               - projectId
 *               - badgeLabel
 *             properties:
 *               label:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [ping, website]
 *               periodicity:
 *                 type: integer
 *                 minimum: 5
 *                 maximum: 300
 *               projectId:
 *                 type: string
 *               badgeLabel:
 *                 type: string
 *               host:
 *                 type: string
 *               port:
 *                 type: integer
 *               url:
 *                 type: string
 *               checkStatus:
 *                 type: boolean
 *               keywords:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Monitor created successfully
 */
router.post('/', async (req, res) => {
  try {
    const {
      label,
      type,
      periodicity,
      projectId,
      badgeLabel,
      host,
      port,
      url,
      checkStatus,
      keywords,
    } = req.body;

    // Validate required fields
    if (!label || !type || !periodicity || !projectId || !badgeLabel) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate periodicity
    if (periodicity < 5 || periodicity > 300) {
      return res.status(400).json({ error: 'Periodicity must be between 5 and 300 seconds' });
    }

    // Validate monitor type and required fields
    if (type === 'ping' && (!host || !port)) {
      return res.status(400).json({ error: 'Ping monitor requires host and port' });
    }

    if (type === 'website' && !url) {
      return res.status(400).json({ error: 'Website monitor requires URL' });
    }

    const monitor = new Monitor();
    monitor.label = label;
    monitor.type = type as MonitorType;
    monitor.periodicity = periodicity;
    monitor.projectId = projectId;
    monitor.badgeLabel = badgeLabel;

    // Set type-specific fields
    if (type === 'ping') {
      monitor.host = host;
      monitor.port = port;
    } else if (type === 'website') {
      monitor.url = url;
      monitor.checkStatus = checkStatus;
      monitor.keywords = keywords || [];
    }

    const savedMonitor = await AppDataSource.getRepository(Monitor).save(monitor);
    res.status(201).json(savedMonitor);
  } catch (error) {
    console.error('Error creating monitor:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/monitors/{id}:
 *   get:
 *     summary: Get a monitor by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Monitor details
 *       404:
 *         description: Monitor not found
 */
router.get('/:id', async (req, res) => {
  try {
    const monitor = await AppDataSource.getRepository(Monitor).findOne({
      where: { id: req.params.id },
      relations: ['project', 'statuses'],
    });

    if (!monitor) {
      return res.status(404).json({ error: 'Monitor not found' });
    }

    res.json(monitor);
  } catch (error) {
    console.error('Error fetching monitor:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/monitors/{id}:
 *   put:
 *     summary: Update a monitor
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               label:
 *                 type: string
 *               periodicity:
 *                 type: integer
 *                 minimum: 5
 *                 maximum: 300
 *               badgeLabel:
 *                 type: string
 *               host:
 *                 type: string
 *               port:
 *                 type: integer
 *               url:
 *                 type: string
 *               checkStatus:
 *                 type: boolean
 *               keywords:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Monitor updated successfully
 *       404:
 *         description: Monitor not found
 */
router.put('/:id', async (req, res) => {
  try {
    const monitor = await AppDataSource.getRepository(Monitor).findOne({
      where: { id: req.params.id },
    });

    if (!monitor) {
      return res.status(404).json({ error: 'Monitor not found' });
    }

    const {
      label,
      periodicity,
      badgeLabel,
      host,
      port,
      url,
      checkStatus,
      keywords,
    } = req.body;

    // Validate periodicity if provided
    if (periodicity !== undefined) {
      if (periodicity < 5 || periodicity > 300) {
        return res.status(400).json({ error: 'Periodicity must be between 5 and 300 seconds' });
      }
      monitor.periodicity = periodicity;
    }

    if (label) monitor.label = label;
    if (badgeLabel) monitor.badgeLabel = badgeLabel;

    // Update type-specific fields
    if (monitor.type === 'ping') {
      if (host) monitor.host = host;
      if (port) monitor.port = port;
    } else if (monitor.type === 'website') {
      if (url) monitor.url = url;
      if (checkStatus !== undefined) monitor.checkStatus = checkStatus;
      if (keywords) monitor.keywords = keywords;
    }

    const updatedMonitor = await AppDataSource.getRepository(Monitor).save(monitor);
    res.json(updatedMonitor);
  } catch (error) {
    console.error('Error updating monitor:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/monitors/{id}:
 *   delete:
 *     summary: Delete a monitor
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Monitor deleted successfully
 *       404:
 *         description: Monitor not found
 */
router.delete('/:id', async (req, res) => {
  try {
    const result = await AppDataSource.getRepository(Monitor).delete(req.params.id);

    if (result.affected === 0) {
      return res.status(404).json({ error: 'Monitor not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting monitor:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export const monitorRouter = router; 