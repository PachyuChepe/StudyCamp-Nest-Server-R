// src/main.ts
import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { corsOption, getNestOptions } from './app.options';
import { ConfigService } from '@nestjs/config';
import { initializeTransactionalContext } from 'typeorm-transactional';
import { setSwagger } from './app.swagger';
import { BusinessExceptionFilter } from './exception';

// NestJS 애플리케이션을 설정하고 시작하기 위해 'bootstrap'이라는 비동기 함수를 정의
async function bootstrap() {
  // 데이터베이스 작업에서 트랜잭션의 원자성을 보장하기 위해 트랜잭셔널 컨텍스트를 초기화
  initializeTransactionalContext();

  // 특정 옵션으로 새로운 NestJS 애플리케이션 인스턴스를 생성
  const app = await NestFactory.create(AppModule, getNestOptions());
  // 전체 애플리케이션에서 특정 비즈니스 예외를 처리하기 위해 전역 예외 필터를 적용
  app.useGlobalFilters(new BusinessExceptionFilter());

  // 환경 또는 기타 외부 소스에서 구성 설정을 검색
  const configService = app.get(ConfigService);
  const port = configService.get<number>('SERVER_PORT') || 4000; // 지정되지 않은 경우 기본 포트 4000 사용
  const env = configService.get<string>('SERVER_RUNTIME'); // 서버가 실행되는 환경
  const serviceName = configService.get<string>('SERVER_SERVICE_NAME'); // 식별을 위한 서비스 이름

  // HTTPS를 위한 SSL 키 및 인증서의 경로 설정
  const keyPath = path.join(__dirname, '..', 'key.pem');
  const certPath = path.join(__dirname, '..', 'cert.pem');

  setSwagger(app);
  // 환경별 옵션을 사용하여 CORS를 활성화
  app.enableCors(corsOption(env));

  // SSL 키와 인증서 파일이 있는지 확인
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    // SSL 키와 인증서 파일을 읽음
    const httpsOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };

    // 애플리케이션 경로 및 기타 설정을 초기화
    await app.init();
    // SSL 옵션과 NestJS 애플리케이션을 요청 핸들러로 사용하여 HTTPS 서버를 생성
    https
      .createServer(httpsOptions, app.getHttpAdapter().getInstance())
      .listen(port);
    console.log(
      `✅ HTTPS server running on\n✅ runtime: ${env}\n✅ port: ${port}\n✅ serviceName: ${serviceName}`,
    );
  } else {
    // SSL 파일을 찾지 못한 경우 애플리케이션을 HTTP로 시작
    await app.listen(port);
    console.log(
      `✅ HTTP server running on\n✅ runtime: ${env}\n✅ port: ${port}\n✅ serviceName: ${serviceName}`,
    );
  }
}

bootstrap();
