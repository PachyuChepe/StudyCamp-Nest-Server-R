import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Attendance extends Document {
  @Prop()
  memberId: string;

  @Prop()
  spaceId: string;

  @Prop()
  entryTime: Date;

  @Prop()
  exitTime: Date;
}

export const AttendanceSchema = SchemaFactory.createForClass(Attendance);
