import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";

@Entity()
export class Project {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("text")
  label!: string;

  @Column("text")
  description!: string;

  @Column("simple-array")
  tags!: string[];

  @OneToMany("Monitor", "project")
  monitors!: unknown[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  constructor(partial: Partial<Project> = {}) {
    Object.assign(this, partial);
  }
}
