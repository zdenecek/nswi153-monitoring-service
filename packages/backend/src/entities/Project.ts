import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Monitor } from './Monitor';

@Entity()
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  label!: string;

  @Column('text')
  description!: string;

  @Column('simple-array')
  tags!: string[];

  @OneToMany(() => Monitor, (monitor: Monitor) => monitor.project)
  monitors!: Monitor[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  constructor(partial: Partial<Project> = {}) {
    Object.assign(this, partial);
  }
} 