// src/app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { validationSchema } from './config/validation.schema';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
// import { AuthModule } from './auth/auth.module';
import { RedisModule } from './redis/redis.module';
import { AppGateway } from './socket.gateway';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { DataSource } from 'typeorm';

@Module({
  imports: [
    // ConfigModule을 하여, 환경 변수 파일의 위치와 유효성 검증 스키마를 지정
    ConfigModule.forRoot({
      envFilePath: `.env`, // 환경 변수 파일 경로
      validationSchema, // 환경 변수 유효성 검증을 위한 스키마
    }),

    // TypeOrmModule을 비동기적으로 설정하며, 데이터베이스 설정은 ConfigService를 통해 동적으로 로드한다
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule], // ConfigModule을 의존성으로 가져오기
      inject: [ConfigService], // ConfigService를 주입하여 환경 변수에 접근

      // 데이터베이스 설정을 동적으로 생성하는 팩토리 함수
      useFactory: (configService: ConfigService) => ({
        type: 'mysql', // 데이터베이스 유형 MySQL
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_ID'),
        password: configService.get<string>('DB_PW'),
        database: configService.get<string>('DB_NAME'),
        autoLoadEntities: true, // 엔티티 자동 로드
        synchronize: configService.get<string>('SERVER_RUNTIME') !== 'prod', // 비프로덕션 환경에서 DB 스키마 자동 동기화
        logging: configService.get<string>('SERVER_RUNTIME') !== 'prod', // 비프로덕션 환경에서 로깅 활성화
      }),

      // 데이터 소스 팩토리를 비동기로 정의하며, TypeORM의 DataSource 인스턴스를 생성하고 트랜잭션 기능을 추가한다
      async dataSourceFactory(options) {
        if (!options) {
          throw new Error('Invalid options passed'); // 옵션이 유효하지 않을 때 오류 처리
        }
        console.log('✅ Database connection established successfully');
        return addTransactionalDataSource(new DataSource(options)); // 트랜잭셔널 데이터 소스 추가
      },
    }),
    // AuthModule,
    RedisModule,
  ],
  // controllers 배열은 이 모듈에 포함될 컨트롤러를 명시
  controllers: [AppController],

  // providers 배열은 이 모듈에서 사용할 서비스(Provider)를 명시
  providers: [AppService, AppGateway],
})
export class AppModule {}
