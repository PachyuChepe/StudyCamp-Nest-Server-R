// src/app.options.ts
import {
  utilities as nestWinstonModuleUtilities,
  WinstonModule,
} from 'nest-winston'; // nest-winston을 통해 Winston 로깅 모듈을 NestJS와 통합
import winston from 'winston'; // 로깅을 위한 winston 라이브러리
import { ConfigService } from '@nestjs/config'; // 환경 변수와 설정을 관리하는 ConfigService
import { NestApplicationOptions } from '@nestjs/common'; // NestJS 애플리케이션 옵션 타입

// NestJS 애플리케이션의 글로벌 설정을 반환하는 함수를 정의
export function getNestOptions(): NestApplicationOptions {
  // 새로운 ConfigService 인스턴스를 생성
  const configService = new ConfigService();
  const serviceName = configService.get<string>('SERVER_SERVICE_NAME');

  // NestApplicationOptions를 반환
  return {
    abortOnError: true, // 에러 발생 시 애플리케이션이 즉시 중단되도록 설정
    logger: WinstonModule.createLogger({
      // 로거 설정
      transports: [
        new winston.transports.Console({
          level: 'silly', // 로그 레벨 설정 (silly는 모든 레벨의 로그를 출력)
          format: winston.format.combine(
            winston.format.timestamp(), // 로그에 타임스탬프 추가
            nestWinstonModuleUtilities.format.nestLike(serviceName, {
              // NestJS 스타일의 로그 형식
              colors: true, // 콘솔에 색상을 사용하여 출력
              prettyPrint: true, // 로그를 예쁘게(?) 출력
            }),
          ),
        }),
      ],
    }),
  };
}

// CORS 설정을 위한 함수를 정의
export const corsOption = (env: string) => {
  return {
    origin: function (origin, callback) {
      // origin 검사: 허용된 출처 리스트에 있거나, 로컬 화이트리스트, Vercel 배포 출처에 있는지 확인
      if (
        !origin || // 출처가 없는 경우(일반적으로 서버 대 서버 요청)
        whiteList.indexOf(origin) !== -1 ||
        checkLocalWhiteList(env, origin) ||
        checkDeployedOnVercel(env, origin)
      ) {
        callback(null, true); // 요청을 허용
      } else {
        callback(new Error('Not allowed by CORS')); // CORS 정책에 의해 요청 거부
      }
    },
    methods: ['POST', 'PUT', 'DELETE', 'GET', 'PATCH'], // 허용하는 HTTP 메소드
  };
};

// 환경별로 허용된 출처를 정의
const allowed = {
  test: [''], // 테스트 환경의 허용 출처
  prod: [], // 프로덕션 환경의 허용 출처
};

// 전체 화이트리스트를 구성
const whiteList = [...allowed.test, ...allowed.prod];

// 로컬 환경에서 허용되는 출처를 확인하는 함수
const checkLocalWhiteList = (env, origin) => {
  return (
    (env === 'local' || env === 'test') &&
    (origin.includes('http://127.0.0.1') ||
      origin.includes('http://0.0.0.0') ||
      origin.includes('http://localhost'))
  );
};

// Vercel에 배포된 경우를 확인하는 함수
const checkDeployedOnVercel = (env, origin) => {
  return env !== 'local' && origin.includes('vercel.app');
};
