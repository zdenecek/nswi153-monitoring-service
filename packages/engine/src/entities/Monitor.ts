import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";

export type MonitorType = "ping" | "website";

@Entity()
export class Monitor {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("text")
  label!: string;

  @Column({
    type: "enum",
    enum: ["website", "ping"],
  })
  type!: MonitorType;

  @Column("text")
  url!: string;

  @Column("text")
  host!: string;

  @Column("int")
  periodicity!: number;

  @Column("text")
  badgeLabel: string;

  // Ping monitor fields
  @Column("int", { nullable: true })
  port?: number;

  @Column("boolean", { nullable: true })
  checkStatus?: boolean;

  @Column("simple-array", { nullable: true })
  keywords?: string[];

  @Column("uuid")
  projectId!: string;

  @ManyToOne("Project", "monitors")
  @JoinColumn({ name: "projectId" })
  project!: any;

  @OneToMany("MonitorStatus", "monitor")
  statuses!: any[]; // Type will be inferred by TypeORM

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  constructor(partial: Partial<Monitor> = {}) {
    Object.assign(this, partial);
  }
}
