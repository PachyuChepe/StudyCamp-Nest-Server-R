import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class PaymentLog extends Document {
  @Prop()
  email: string;

  @Prop()
  spaceClassPaymentId: string;

  @Prop()
  spaceClassPaymentName: string;

  @Prop()
  spaceClassPaymentPrice: number;
}

export const PaymentLogSchema = SchemaFactory.createForClass(PaymentLog);
