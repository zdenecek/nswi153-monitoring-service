import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Monitor } from './Monitor';

export type StatusType = 'succeeded' | 'failed';

@Entity()
export class MonitorStatus {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: ['succeeded', 'failed'],
  })
  status!: StatusType;

  @Column('int')
  responseTime!: number;

  @Column('text', { nullable: true })
  error?: string;

  @Column('uuid')
  monitorId!: string;

  @ManyToOne(() => Monitor, (monitor: Monitor) => monitor.statuses)
  @JoinColumn({ name: 'monitorId' })
  monitor!: Monitor;

  @CreateDateColumn()
  startTime!: Date;

  constructor(partial: Partial<MonitorStatus> = {}) {
    Object.assign(this, partial);
  }
} 