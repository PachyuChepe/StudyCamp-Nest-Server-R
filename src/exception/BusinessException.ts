// src/exception/BusinessException.ts
import { HttpStatus } from '@nestjs/common'; //HTTP 상태 코드를 관리하는 모듈

// 에러를 분류할 도메인의 타입을 정의하며, 각 도메인은 비즈니스 로직의 특정 부분을 나타낸다
export type ErrorDomain =
  | 'generic' // 일반적인 에러
  | 'auth' // 인증과 관련된 에러
  | 'user' // 사용자 관리와 관련된 에러
  | 'payment' // 결제 처리와 관련된 에러
  | 'investment'; // 투자 관련 서비스의 에러

// 사용자 정의 예외 클래스
export class BusinessException extends Error {
  public readonly id: string; // 에러 식별을 위한 고유 ID
  public readonly timestamp: Date; // 에러 발생 시간

  // 생성자 함수에서 오류 도메인, 로깅 메시지, 사용자 메시지, HTTP 상태 코드를 매개변수로 받는다
  constructor(
    public readonly domain: ErrorDomain, // 에러가 발생한 도메인
    public readonly message: string, // 로그를 위한 메시지
    public readonly apiMessage: string, // 클라이언트에게 보여줄 메시지
    public readonly status: HttpStatus, // HTTP 상태 코드
  ) {
    super(message); // 부모 클래스의 생성자를 호출하여 기본 메시지를 설정
    this.id = BusinessException.genId(); // 에러 ID를 생성
    this.timestamp = new Date(); // 현재 시간을 에러의 타임스탬프로 설정
  }

  // 예외 ID를 생성하는 정적 메소드로, 12자리의 무작위 문자열을 생성
  private static genId(length = 12): string {
    // 사용할 수 있는 문자들의 집합
    const p = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    // 지정된 길이의 랜덤 문자열을 생성하며, 각 문자는 위의 문자 집합에서 무작위로 선택된다
    return [...Array(length)].reduce(
      (a) => a + p[Math.floor(Math.random() * p.length)],
      '',
    );
  }
}
