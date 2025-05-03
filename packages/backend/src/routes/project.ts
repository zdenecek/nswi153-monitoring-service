import { Router } from 'express';
import { AppDataSource } from '../index';
import { Project } from '../entities';
import { ProjectFilter } from '@monitoring-service/shared';

const router = Router();

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Get all projects with optional filtering and pagination
 *     parameters:
 *       - in: query
 *         name: label
 *         schema:
 *           type: string
 *         description: Filter by project label
 *       - in: query
 *         name: tags
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Filter by project tags
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
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [label, createdAt]
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of projects
 */
router.get('/', async (req, res) => {
  try {
    const filter = req.query as unknown as ProjectFilter;
    const page = parseInt(filter.page?.toString() || '1');
    const pageSize = parseInt(filter.pageSize?.toString() || '10');
    const skip = (page - 1) * pageSize;

    const queryBuilder = AppDataSource.getRepository(Project)
      .createQueryBuilder('project')
      .skip(skip)
      .take(pageSize);

    if (filter.label) {
      queryBuilder.andWhere('project.label ILIKE :label', { label: `%${filter.label}%` });
    }

    if (filter.tags?.length) {
      queryBuilder.andWhere('project.tags @> :tags', { tags: filter.tags });
    }

    if (filter.sortBy) {
      queryBuilder.orderBy(`project.${filter.sortBy}`, filter.sortOrder?.toUpperCase() as 'ASC' | 'DESC');
    }

    const [projects, total] = await queryBuilder.getManyAndCount();

    res.json({
      data: projects,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/projects:
 *   post:
 *     summary: Create a new project
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - label
 *               - description
 *             properties:
 *               label:
 *                 type: string
 *               description:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Project created successfully
 */
router.post('/', async (req, res) => {
  try {
    const { label, description, tags } = req.body;

    if (!label || !description) {
      return res.status(400).json({ error: 'Label and description are required' });
    }

    const project = new Project();
    project.label = label;
    project.description = description;
    project.tags = tags || [];

    const savedProject = await AppDataSource.getRepository(Project).save(project);
    res.status(201).json(savedProject);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     summary: Get a project by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project details
 *       404:
 *         description: Project not found
 */
router.get('/:id', async (req, res) => {
  try {
    console.log('Fetching project with id:', req.params.id);
    
    // Get the project with monitors but without statuses
    const project = await AppDataSource.getRepository(Project).findOne({
      where: { id: req.params.id },
      relations: ['monitors'],
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Simply return the project with monitors
    // The frontend will handle fetching the status information
    res.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/projects/{id}:
 *   put:
 *     summary: Update a project
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
 *               description:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Project updated successfully
 *       404:
 *         description: Project not found
 */
router.put('/:id', async (req, res) => {
  try {
    const { label, description, tags } = req.body;
    const project = await AppDataSource.getRepository(Project).findOne({
      where: { id: req.params.id },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (label) project.label = label;
    if (description) project.description = description;
    if (tags) project.tags = tags;

    const updatedProject = await AppDataSource.getRepository(Project).save(project);
    res.json(updatedProject);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/projects/{id}:
 *   delete:
 *     summary: Delete a project
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Project deleted successfully
 *       404:
 *         description: Project not found
 */
router.delete('/:id', async (req, res) => {
  try {
    const result = await AppDataSource.getRepository(Project).delete(req.params.id);

    if (result.affected === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export const projectRouter = router; 