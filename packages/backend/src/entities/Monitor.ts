import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Project } from './Project';
import { MonitorStatus } from './MonitorStatus';

export type MonitorType = 'ping' | 'website';

@Entity()
export class Monitor {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  label!: string;

  @Column({
    type: 'enum',
    enum: ['website', 'ping'],
  })
  type!: MonitorType;

  @Column()
  url!: string;

  @Column()
  host!: string;

  @Column('int')
  periodicity!: number;

  @Column()
  badgeLabel: string;

  // Ping monitor fields
  @Column({ nullable: true })
  port?: number;

  @Column({ nullable: true })
  checkStatus?: boolean;

  @Column('simple-array', { nullable: true })
  keywords?: string[];

  @Column('uuid')
  projectId!: string;

  @ManyToOne(() => Project, (project: Project) => project.monitors)
  @JoinColumn({ name: 'projectId' })
  project!: Project;

  @OneToMany(() => MonitorStatus, (status: MonitorStatus) => status.monitor)
  statuses!: MonitorStatus[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  constructor(partial: Partial<Monitor> = {}) {
    Object.assign(this, partial);
  }
} 