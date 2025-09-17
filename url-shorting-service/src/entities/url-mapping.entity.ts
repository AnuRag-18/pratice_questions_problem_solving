import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Analytics } from './analytics.entity';

@Entity('url_mappings')
export class UrlMapping {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  shortCode: string;

  @Column()
  longUrl: string;

  @Column({ default: 0 })
  clickCount: number;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @OneToMany(() => Analytics, analytics => analytics.urlMapping)
  analytics: Analytics[];
}