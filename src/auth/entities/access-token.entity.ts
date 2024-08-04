// src/auth/entities/access-token.entity.ts
import { Column, Entity, ManyToOne, Relation } from 'typeorm';
import { User } from './user.entity';
import { BaseEntity } from '../../common/entity';

@Entity()
export class AccessToken extends BaseEntity {
  @ManyToOne(() => User, (user) => user.accessToken, {
    onDelete: 'CASCADE',
  })
  user: Relation<User>;

  @Column()
  jti: string;

  @Column()
  token: string;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ default: false })
  isRevoked: boolean;
}
