// attendance/attendance.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { Attendance, AttendanceSchema } from './schemas/attendance.schema';
import {
  ConcurrentUser,
  ConcurrentUserSchema,
} from './schemas/concurrent-users.schema';
import { PaymentLog, PaymentLogSchema } from './schemas/payment-log.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Attendance.name, schema: AttendanceSchema },
      { name: ConcurrentUser.name, schema: ConcurrentUserSchema },
      { name: PaymentLog.name, schema: PaymentLogSchema },
    ]),
  ],
  providers: [AttendanceService],
  controllers: [AttendanceController],
})
export class AttendanceModule {}
