# 📅 Shinya Calendar

> 아름답고 직관적인 데스크톱 캘린더 애플리케이션

**Shinya Calendar**는 개인 일정 관리를 위한 무료 오픈소스 데스크톱 애플리케이션입니다. Windows, macOS, Linux에서 사용할 수 있으며, Google Calendar와의 원활한 양방향 동기화를 제공합니다.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![GitHub issues](https://img.shields.io/github/issues/blissful-y0/shinya_calendar)](https://github.com/blissful-y0/shinya_calendar/issues)

🌐 **[공식 홈페이지 보기](https://blissful-y0.github.io/shinya_calendar)** | 📥 **[다운로드](https://github.com/blissful-y0/shinya_calendar/releases)**

---

## ✨ 주요 기능

### 📆 강력한 캘린더 관리

- **월간/주간/일간 보기**: 다양한 캘린더 뷰로 일정을 한눈에 확인
- **이벤트 생성 및 관리**: 직관적인 UI로 쉽게 일정 추가, 수정, 삭제
- **반복 일정**: 매일, 매주, 매월, 매년 반복되는 일정 지원
- **종일 이벤트**: 시간이 지정되지 않은 이벤트 관리
- **색상 커스터마이징**: 8가지 색상 팔레트로 일정 구분
- **다크 모드**: 눈의 피로를 줄이는 다크 테마 지원

### 🔄 Google Calendar 양방향 동기화

- **자동 동기화**: Google Calendar와 실시간 동기화
- **모든 캘린더 지원**: 여러 개의 Google Calendar 일정을 한 곳에서 관리
- **가져오기**: Google Calendar의 모든 이벤트를 앱으로 가져오기
- **내보내기**: 앱에서 생성한 일정을 Google Calendar로 전송
- **오프라인 액세스**: 동기화된 데이터를 로컬에서 오프라인으로 접근

## 🔐 Google Calendar 데이터 사용 정책

### 왜 Google Calendar 접근 권한이 필요한가요?

Shinya Calendar는 다음 목적으로 Google Calendar 데이터에 접근합니다:

1. **일정 가져오기** (읽기)

   - 사용자의 Google Calendar에 저장된 모든 캘린더와 이벤트를 읽어옵니다
   - 반복 이벤트, 종일 이벤트 등 모든 유형의 일정을 지원합니다
   - 여러 캘린더의 일정을 통합하여 한 곳에서 볼 수 있습니다

2. **일정 동기화** (쓰기)

   - 앱에서 생성한 일정을 Google Calendar로 전송합니다
   - 앱에서 수정한 일정을 Google Calendar에 반영합니다
   - 앱에서 삭제한 일정을 Google Calendar에서도 제거합니다

3. **오프라인 사용**
   - 가져온 일정을 로컬 기기에 저장하여 인터넷 연결 없이도 확인할 수 있습니다

### 데이터 보안 및 프라이버시

- ✅ **로컬 저장**: 모든 캘린더 데이터와 인증 토큰은 사용자의 기기에만 저장됩니다
- ✅ **외부 전송 없음**: 사용자 데이터를 외부 서버로 전송하지 않습니다
- ✅ **직접 통신**: Google Calendar API와 직접 통신하며, 중간 서버를 거치지 않습니다
- ✅ **언제든 해제**: 설정에서 언제든지 Google 계정 연결을 해제할 수 있습니다
- ✅ **오픈소스**: 모든 소스 코드가 공개되어 있어 투명성을 보장합니다

자세한 내용은 [개인정보 처리방침](docs/PRIVACY_POLICY.md)을 참조하세요.

---

## 📥 다운로드 및 설치

### 사전 빌드된 버전 다운로드 (권장)

최신 릴리스는 [GitHub Releases](https://github.com/blissful-y0/shinya_calendar/releases)에서 다운로드할 수 있습니다.

- **Windows**: `Shinya Calendar Setup 1.1.0.exe`
- **macOS (Intel)**: `Shinya Calendar-1.1.0.dmg`
- **macOS (Apple Silicon)**: `Shinya Calendar-1.1.0-arm64.dmg`

### 개발자용: 소스에서 빌드

#### 필수 요구사항

- Node.js 18 이상
- Yarn 패키지 매니저

#### 설치 및 실행

```bash
# 저장소 클론
git clone https://github.com/blissful-y0/shinya_calendar.git
cd shinya_calendar

# 의존성 설치
yarn install

# 개발 모드 실행
yarn dev

# 프로덕션 빌드
yarn build
```

---

## 🚀 시작하기

### 1. 앱 설치

위의 [다운로드 섹션](#-다운로드-및-설치)에서 운영체제에 맞는 설치 파일을 다운로드하여 설치합니다.

### 2. 기본 사용법

1. 앱을 실행하면 현재 월의 캘린더가 표시됩니다
2. 날짜를 클릭하여 새로운 일정을 추가할 수 있습니다
3. 상단 메뉴에서 월간/주간/일간 보기를 전환할 수 있습니다

### 3. Google Calendar 연동 (선택사항)

Google Calendar와 동기화하려면:

1. 좌측 사이드바에서 **"Google Calendar"** 섹션 찾기
2. **"연결"** 버튼 클릭
3. Google 계정으로 로그인 후 권한 승인
4. 자동으로 일정이 동기화됩니다

#### 연동 해제 방법

- 설정 > Google Calendar > "연결 해제" 버튼 클릭
- 모든 로컬 동기화 데이터가 삭제됩니다

### 📸 스크린샷 (추가 예정)

> 향후 업데이트에서 앱 스크린샷이 추가될 예정입니다.

---

## 🛠️ 기술 스택

- **Frontend**: React, TypeScript, Recoil
- **Desktop**: Electron
- **Styling**: SCSS Modules
- **Build**: Vite, electron-builder
- **Date Handling**: date-fns, rrule
- **API Integration**: Google Calendar API v3

---

## 👨‍💻 개발자를 위한 정보

### Git 브랜치 전략

이 프로젝트는 **Feature Branch Workflow**를 따릅니다:

```
master (main)
  ├── feature/새로운-기능
  ├── fix/버그-수정
  └── enhance/기능-개선
```

### 기여 가이드라인

1. **Fork & Clone**

   ```bash
   # 저장소 Fork 후
   git clone https://github.com/[your-username]/shinya_calendar.git
   cd shinya_calendar
   ```

2. **Feature Branch 생성**

   ```bash
   # 새로운 기능 개발
   git checkout -b feature/amazing-feature

   # 버그 수정
   git checkout -b fix/issue-123

   # 기능 개선
   git checkout -b enhance/improve-performance
   ```

3. **개발 및 커밋**

   ```bash
   # 변경사항 확인
   git status

   # 스테이징
   git add .

   # 커밋 (명확한 메시지 작성)
   git commit -m "feat: Add amazing feature

   - Detailed description of what changed
   - Why this change was necessary"
   ```

4. **Push & Pull Request**
   ```bash
   git push origin feature/amazing-feature
   ```
   그 후 GitHub에서 Pull Request를 생성합니다.

### 커밋 메시지 규칙

- `feat:` 새로운 기능 추가
- `fix:` 버그 수정
- `docs:` 문서 수정
- `style:` 코드 포맷팅, 세미콜론 누락 등
- `refactor:` 코드 리팩토링
- `test:` 테스트 추가 또는 수정
- `chore:` 빌드 업무, 패키지 매니저 설정 등

### 코드 스타일

- TypeScript 엄격 모드 사용
- React 함수형 컴포넌트 선호
- SCSS 모듈을 통한 스타일 캡슐화
- 의미있는 변수명과 함수명 사용

### Pull Request 체크리스트

- [ ] 코드가 프로젝트 스타일 가이드를 따르는가?
- [ ] 모든 테스트가 통과하는가? (`yarn test:run`)
- [ ] 테스트 커버리지가 80% 이상인가? (`yarn test:coverage`)
- [ ] 새로운 기능에 대한 테스트를 작성했는가?
- [ ] TypeScript 에러가 없는가? (`yarn typecheck`)
- [ ] 새로운 기능에 대한 문서를 추가했는가?
- [ ] 커밋 메시지가 규칙을 따르는가?
- [ ] 관련 이슈를 참조했는가?

### 테스트 (TDD)

이 프로젝트는 **Test-Driven Development (TDD)** 를 따릅니다.

```bash
# 테스트 실행
yarn test

# 테스트 커버리지 확인
yarn test:coverage

# 특정 테스트 실행
yarn test calendar
```

**중요**: PR 제출 전 반드시 [TESTING.md](TESTING.md)의 모든 체크리스트를 확인하세요.

## 📁 프로젝트 구조

```
shinya_calendar/
├── electron/           # Electron 메인 프로세스
├── src/
│   ├── components/    # React 컴포넌트
│   │   ├── Calendar/  # 캘린더 관련 컴포넌트
│   │   ├── Sidebar/   # 사이드바 컴포넌트
│   │   ├── Common/    # 공통 컴포넌트
│   │   ├── Layout/    # 레이아웃 컴포넌트
│   │   └── Styling/   # 스타일링 관련 컴포넌트
│   ├── store/         # Recoil 상태 관리
│   ├── styles/        # 전역 스타일
│   ├── utils/         # 유틸리티 함수
│   ├── types/         # TypeScript 타입 정의
│   ├── hooks/         # 커스텀 React 훅
│   └── services/      # 서비스 로직
├── public/            # 정적 파일
└── package.json       # 프로젝트 설정

```

## 🐛 이슈 보고

버그를 발견하셨나요? [이슈 페이지](https://github.com/blissful-y0/shinya_calendar/issues)에서 보고해주세요.
가장 빠른 연락처는 Discord @ambiguousmorality 입니다. 수정이 시급한 버그일 경우에는 메시지 주세요.

이슈를 작성할 때는 다음 정보를 포함해주세요:

- 운영체제 및 버전
- 재현 단계
- 예상 동작
- 실제 동작
- 가능하다면 스크린샷

## 📄 법적 문서 및 정책

### 필수 문서

- **[개인정보 처리방침 (Privacy Policy)](docs/PRIVACY_POLICY.md)**

  - Google Calendar 데이터를 포함한 모든 사용자 데이터의 수집, 사용, 저장 방식
  - 데이터 보안 및 보호 조치
  - 사용자 권리 및 선택 사항

- **[서비스 이용약관 (Terms of Service)](docs/TERMS_OF_SERVICE.md)**
  - 서비스 이용 시 적용되는 약관
  - 사용자 책임 및 의무
  - 서비스 제공 조건

### 주요 원칙

✅ 사용자 데이터는 기기에 로컬로만 저장됩니다  
✅ Google Calendar 데이터는 동기화 목적으로만 사용됩니다  
✅ 제3자와 데이터를 공유하지 않습니다  
✅ 언제든지 계정 연결을 해제하고 데이터를 삭제할 수 있습니다

---

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

---

## 📞 연락처 및 지원

### 메인 메인테이너

**Shinya**  
Discord: @ambiguousmorality

### 버그 신고 및 기능 제안

- **이슈 트래커**: [GitHub Issues](https://github.com/blissful-y0/shinya_calendar/issues)
- **긴급 버그**: Discord로 직접 연락

### 기여자 모집

정기적으로 유지보수에 도움 주실 분은 위의 연락처로 연락 주세요.
