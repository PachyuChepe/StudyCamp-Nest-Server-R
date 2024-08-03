import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class ConcurrentUser extends Document {
  @Prop()
  timestamp: Date;

  @Prop()
  count: number;
}

export const ConcurrentUserSchema =
  SchemaFactory.createForClass(ConcurrentUser);
