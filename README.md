### 필수 요구사항

- Node.js 18 이상
- Yarn 패키지 매니저

### 설치 및 실행

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

## 🛠️ 기술 스택

- **Frontend**: React, TypeScript, Recoil
- **Desktop**: Electron
- **Styling**: SCSS Modules
- **Build**: Vite, electron-builder
- **Date**: date-fns

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

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 📞 연락처

메인 메인테이너 
Shinya
Discord: ambiguousmorality

정기적으로 유지보수에 도움 주실 분 역시 위의 연락처로 연락 주세요

---
