// Local type definitions for the monitoring service

export interface MonitorFilter {
  label?: string;
  type?: MonitorType;
  status?: "succeeded" | "failed";
  page?: number;
  pageSize?: number;
}

export interface ProjectFilter {
  label?: string;
  tags?: string | string[];
  page?: number;
  pageSize?: number;
  sortBy?: "label" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface StatusFilter {
  monitorId?: string;
  from?: string;
  to?: string;
  status?: "succeeded" | "failed";
  page?: number;
  pageSize?: number;
}

export type MonitorType = "ping" | "website";
