export interface Project {
  id: string;
  label: string;
  description: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type MonitorType = 'ping' | 'website';

export interface BaseMonitor {
  id: string;
  label: string;
  periodicity: number; // seconds, between 5 and 300
  type: MonitorType;
  badgeLabel: string;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PingMonitor extends BaseMonitor {
  type: 'ping';
  host: string;
  port: number;
}

export interface WebsiteMonitor extends BaseMonitor {
  type: 'website';
  url: string;
  checkStatus: boolean;
  keywords: string[];
}

export type Monitor = PingMonitor | WebsiteMonitor;

export interface MonitorStatus {
  id: string;
  monitorId: string;
  startTime: Date;
  status: 'succeeded' | 'failed';
  responseTime: number; // in milliseconds
}

// GraphQL types (matching the required schema)
export interface GQLProject {
  identifier: string;
  label: string;
  description: string;
  monitors: Monitor[];
}

export interface GQLMonitor {
  identifier: string;
  periodicity: number;
  label: string;
  type: string;
  host?: string;
  url?: string;
  badgeUrl: string;
}

export interface GQLStatus {
  date: string; // ISO date string
  ok: boolean;
  responseTime: number;
}

// API Response types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// Filter types
export interface ProjectFilter {
  label?: string;
  tags?: string[];
  page?: number;
  pageSize?: number;
  sortBy?: 'label' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface MonitorFilter {
  label?: string;
  type?: MonitorType;
  status?: 'succeeded' | 'failed';
  page?: number;
  pageSize?: number;
}

export interface StatusFilter {
  from?: Date;
  to?: Date;
  status?: 'succeeded' | 'failed';
  page?: number;
  pageSize?: number;
} 