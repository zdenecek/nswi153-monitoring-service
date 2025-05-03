import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

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

  @ManyToOne('Monitor', 'statuses', { 
    createForeignKeyConstraints: false 
  })
  @JoinColumn({ name: 'monitorId' })
  monitor!: any; // Type will be inferred by TypeORM

  @CreateDateColumn()
  startTime!: Date;

  constructor(partial: Partial<MonitorStatus> = {}) {
    Object.assign(this, partial);
  }
} 