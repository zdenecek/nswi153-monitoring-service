import { AppDataSource } from '../index';
import { Project, Monitor, MonitorStatus } from '../entities';

interface StatusArgs {
  monitorIdentifier: string;
  from?: number;
  to?: number;
}

interface ProjectParent {
  identifier: string;
}

export const resolvers = {
  Query: {
    projects: async () => {
      const projects = await AppDataSource.getRepository(Project).find({
        relations: ['monitors'],
      });

      return projects.map((project: Project) => ({
        identifier: project.id,
        label: project.label,
        description: project.description,
        monitors: project.monitors,
      }));
    },

    status: async (_: unknown, { monitorIdentifier, from, to }: StatusArgs) => {
      const query = AppDataSource.getRepository(MonitorStatus)
        .createQueryBuilder('status')
        .where('status.monitorId = :monitorId', { monitorId: monitorIdentifier })
        .orderBy('status.startTime', 'DESC');

      if (from) {
        query.andWhere('status.startTime >= :from', { from: new Date(from * 1000) });
      }

      if (to) {
        query.andWhere('status.startTime <= :to', { to: new Date(to * 1000) });
      }

      const statuses = await query.getMany();

      return statuses.map((status: MonitorStatus) => ({
        date: status.startTime.toISOString(),
        ok: status.status === 'succeeded',
        responseTime: status.responseTime,
      }));
    },
  },

  Project: {
    monitors: async (parent: ProjectParent) => {
      const monitors = await AppDataSource.getRepository(Monitor).find({
        where: { projectId: parent.identifier },
      });

      return monitors.map((monitor: Monitor) => ({
        identifier: monitor.id,
        periodicity: monitor.periodicity,
        label: monitor.label,
        type: monitor.type,
        host: monitor.host,
        url: monitor.url,
        badgeUrl: `/badge/${monitor.id}`,
      }));
    },
  },
}; 