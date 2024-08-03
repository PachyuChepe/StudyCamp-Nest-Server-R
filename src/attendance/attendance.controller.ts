// attendance/attendance.controller.ts
import { Controller, Get, Param, Query, Post, Body, Res } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { Response } from 'express';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get(':spaceId')
  async getAttendanceBySpace(
    @Param('spaceId') spaceId: string,
    @Res() res: Response,
  ) {
    try {
      const attendanceLogs =
        await this.attendanceService.getAttendanceBySpace(spaceId);
      res.json(attendanceLogs);
    } catch (error) {
      res.status(500).send(error.toString());
    }
  }

  @Get('user/:userId')
  async getAttendanceByUser(
    @Param('userId') userId: string,
    @Res() res: Response,
  ) {
    try {
      const attendanceLogs =
        await this.attendanceService.getAttendanceByUser(userId);
      res.json(attendanceLogs);
    } catch (error) {
      res.status(500).send(error.toString());
    }
  }

  @Get('concurrent-users')
  async getConcurrentUsers(@Query('date') date: string, @Res() res: Response) {
    try {
      const records = await this.attendanceService.getConcurrentUsers(date);
      res.json(records);
    } catch (error) {
      console.error('Error fetching concurrent users:', error);
      res.status(500).send(error.toString());
    }
  }

  @Get('get-dates')
  async getDates(@Res() res: Response) {
    try {
      const uniqueDates = await this.attendanceService.getDates();
      res.json(uniqueDates);
    } catch (error) {
      res.status(500).send(error.toString());
    }
  }

  @Get('daily-data')
  async getDailyData(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Res() res: Response,
  ) {
    try {
      const data = await this.attendanceService.getDailyData(
        startDate,
        endDate,
      );
      res.json(data);
    } catch (error) {
      res.status(500).send(error.toString());
    }
  }

  @Post('saveAttendance')
  async saveAttendance(@Body() body, @Res() res: Response) {
    try {
      await this.attendanceService.saveAttendance(body);
      res
        .status(201)
        .json({ message: '결제로그가 성공적으로 저장되었습니다.' });
    } catch (error) {
      console.error('결제로그 저장 오류:', error);
      res
        .status(500)
        .json({ message: '서버 오류로 데이터를 저장할 수 없습니다.' });
    }
  }

  @Get('getPaymentLogs')
  async getPaymentLogs(@Res() res: Response) {
    try {
      const paymentLogs = await this.attendanceService.getPaymentLogs();
      res.status(200).json(paymentLogs);
    } catch (error) {
      console.error('데이터를 가져오는 중 오류 발생:', error);
      res
        .status(500)
        .json({ message: '서버 오류로 데이터를 가져올 수 없습니다.' });
    }
  }

  @Get('health')
  healthCheck(@Res() res: Response) {
    res.status(200).send();
  }
}
