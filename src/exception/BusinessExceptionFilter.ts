// src/exception/BusinessExceptionFilter.ts
import {
  ArgumentsHost, // 요청과 관련된 정보를 다루는 객체
  Catch, // 예외 처리기를 위한 데코레이터(함수 앞에 붙여 사용하는 특수 기능)
  ExceptionFilter, // 예외 필터를 정의하기 위한 인터페이스
  HttpException, // HTTP 예외 처리를 위한 기본 클래스
  HttpStatus, // HTTP 상태 코드를 나타내는 열거형
  Logger, // 로깅을 위한 클래스
} from '@nestjs/common';
import { Request, Response } from 'express'; // HTTP 요청과 응답을 처리하기 위한 객체
import { BusinessException, ErrorDomain } from './BusinessException'; // 사용자 정의 예외 및 도메인

// API 에러 정보를 나타내는 인터페이스
export interface ApiError {
  id: string; // 에러의 고유 ID
  domain: ErrorDomain; // 에러가 발생한 도메인
  message: string; // 에러 메시지
  timestamp: Date; // 에러가 발생한 시각
}

// 모든 종류의 Error를 처리하는 클래스를 정의
@Catch(Error)
export class BusinessExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(BusinessExceptionFilter.name); // 로깅을 위한 객체 생성

  // 예외가 발생했을 때 실행되는 메서드
  catch(exception: Error, host: ArgumentsHost) {
    let body: ApiError; // 클라이언트에 전달할 에러 정보
    let status: HttpStatus; // HTTP 응답 상태 코드

    // 에러 스택 트레이스를 얻거나, 없으면 새로 생성
    const stack: string =
      exception.stack || (Error.captureStackTrace(exception), exception.stack);

    // BusinessException 인스턴스인 경우
    if (exception instanceof BusinessException) {
      status = exception.status; // 예외에서 제공한 HTTP 상태 코드 사용
      body = {
        id: exception.id,
        domain: exception.domain,
        message: exception.message,
        timestamp: exception.timestamp,
      };
      // HttpException 인스턴스인 경우
    } else if (exception instanceof HttpException) {
      status = exception.getStatus(); // 예외에서 제공한 HTTP 상태 코드 사용
      body = new BusinessException(
        'generic',
        exception.message,
        exception.message,
        exception.getStatus(),
      );
      // 그 외 다른 종류의 예외인 경우
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR; // 서버 내부 에러로 간주
      body = new BusinessException(
        'generic',
        `Internal server error: ${exception.message}`,
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const ctx = host.switchToHttp(); // HTTP 컨텍스트 가져오기
    const request = ctx.getRequest<Request>(); // 요청 객체 타입 변환
    const response = ctx.getResponse<Response>(); // 응답 객체 가져오기

    console.log(stack); // 예외 스택 로그 출력
    console.log(typeof stack); // 스택 유형 로그 출력

    // 에러 로그 기록
    this.logger.error(
      // 예외 정보를 문자열로 변환하여 로그에 포함
      `exception: ${JSON.stringify({
        path: request.url, // 요청 URL 포함
        ...body, // 본문에 있는 기타 정보 포함
      })}`,
      stack, // 스택 정보도 로그에 포함
    );

    response.status(status).json(body); // 응답 상태 코드 및 본문 전송
  }
}
