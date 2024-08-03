// attendance/attendance.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Attendance } from './schemas/attendance.schema';
import { ConcurrentUser } from './schemas/concurrent-users.schema';
import { PaymentLog } from './schemas/payment-log.schema';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectModel(Attendance.name)
    private readonly attendanceModel: Model<Attendance>,
    @InjectModel(ConcurrentUser.name)
    private readonly concurrentUserModel: Model<ConcurrentUser>,
    @InjectModel(PaymentLog.name)
    private readonly paymentLogModel: Model<PaymentLog>,
  ) {}

  async getAttendanceBySpace(spaceId: string) {
    return this.attendanceModel
      .find({ spaceId })
      .sort({ entryTime: -1 })
      .exec();
  }

  async getAttendanceByUser(userId: string) {
    return this.attendanceModel
      .find({ memberId: userId })
      .sort({ entryTime: -1 })
      .exec();
  }

  async getConcurrentUsers(date: string) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const query = {
      timestamp: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    };

    return this.concurrentUserModel.find(query).sort({ timestamp: 1 }).exec();
  }

  async getDates() {
    const dates = await this.concurrentUserModel.distinct('timestamp').exec();
    const formattedDates = dates.map(
      (date) => date.toISOString().split('T')[0],
    );
    return [...new Set(formattedDates)];
  }

  async getDailyData(startDate: string, endDate: string) {
    const attendanceData = await this.attendanceModel
      .find({
        entryTime: { $gte: new Date(startDate) },
        exitTime: { $lte: new Date(endDate) },
      })
      .exec();

    const concurrentUserData = await this.concurrentUserModel
      .find({
        timestamp: { $gte: new Date(startDate), $lte: new Date(endDate) },
      })
      .exec();

    const maxConcurrentUser = concurrentUserData.reduce(
      (max, curr) => Math.max(max, curr.count),
      0,
    );

    let totalTime = 0;
    attendanceData.forEach((data) => {
      const entryTime = new Date(data.entryTime).getTime();
      const exitTime = new Date(data.exitTime).getTime();
      totalTime += exitTime - entryTime;
    });
    const maxConnectionTime = Math.max(totalTime / 3600000);

    return {
      date: startDate,
      maxConcurrentUser,
      maxConnectionTime,
    };
  }

  async saveAttendance(body: any) {
    const {
      email,
      spaceClassPaymentId,
      spaceClassPaymentName,
      spaceClassPaymentPrice,
    } = body;

    const paymentLog = new this.paymentLogModel({
      email,
      spaceClassPaymentId,
      spaceClassPaymentName,
      spaceClassPaymentPrice,
    });

    await paymentLog.save();
  }

  async getPaymentLogs() {
    return this.paymentLogModel.find().exec();
  }
}
