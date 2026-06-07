# B404K
### Reading Not Found

> 독서를 잃어버린 시대를 위한 독서 장비

---

## 프로젝트 소개

B404K는 독서 상태 관리 앱이다.

Sony Discman과 MiniDisc 플레이어의 조작 패널, Macintosh System 7의 모노크롬 인터페이스에서 영감을 받았다. 일반적인 독서 앱과 다르게, B404K는 정보를 LCD 화면과 계기판 형태로 표시한다. 사용자는 책의 상태를 PRE / ING / DONE 세 가지로 관리하며, 독서 기록을 장비 로그처럼 저장한다.

페이지 추적 앱이 아니다. 독서 상태 관리 장비다.

---

## 주요 기능

### 상태 관리 (PRE / ING / DONE)
- **PRE** — 읽을 예정인 책
- **ING** — 현재 읽고 있는 책
- **DONE** — 완독한 책
- 언제든 상태를 변경할 수 있으며, 변경 이력이 기록에 남는다

### CURRENT BOOK
- ING 상태인 책 중 가장 최근에 기록된 책을 홈 화면 LCD에 표시
- 제목, 저자, 현재 페이지, 진행률, 마지막 기록일 표시

### 독서 기록 (REC SESSION)
- 책 상태 변경을 기록의 핵심으로 처리
- 현재 페이지, 독서 시간, 메모는 선택 입력
- 저장 시 Archive의 책 상태가 즉시 반영됨

### ARCHIVE
- 저장된 책을 PRE / ING / DONE 상태별로 그룹 표시
- 각 그룹별 권수 표시
- 책 행 내 미니 상태 버튼으로 즉시 변경 가능
- **IMPORT DATA** 기능으로 XLSX / CSV 파일에서 일괄 가져오기 지원

### BOOK SEARCH
- 알라딘 Open API 연동 (제목 / 저자 / ISBN 검색)
- 검색 결과에서 탭하면 Archive에 즉시 저장
- 저장 시 표지, 출판사, ISBN, 출간일, 총 페이지 수 자동 수집
- 직접 입력(MANUAL) 모드 지원

### MONITOR
- 독서 통계를 채널 기반 계기판으로 표시
- **CH-A** 주간 독서량 (세그먼트 바)
- **CH-B** BOOKS / PAGES / TIME / STREAK 채널 미터
- **CH-C** 분석 모듈 — 시간당 페이지 효율, 평균 세션 시간, 이번 달 읽은 책, 최다 저자, PRE / ING / DONE 권수
- **CH-D** 7일 로그 (VU 미터 스타일)
- **CH-E** 상태 LED 매트릭스

### DATA IMPORT
- XLSX 및 CSV 파일에서 독서 데이터 일괄 가져오기
- 컬럼명 자동 매핑 (제목 / 도서명 / 책제목 → title 인식)
- 가져오기 전 미리보기 — 총 행 수, 성공 예정, 오류, 중복 표시
- ISBN 기준 중복 검사 (ISBN 없을 시 제목+저자 기준)
- 터미널 스타일 상태 전환 (READY → READING FILE → PREVIEW → IMPORTING → COMPLETE)

---

## 현재 개발 상태

| 기능 | 상태 |
|---|---|
| 부팅 화면 (Boot Screen) | ✅ 완료 |
| 앱 테마 / 디자인 시스템 | ✅ 완료 |
| Bottom Navigation | ✅ 완료 |
| Home 화면 (CURRENT BOOK / CONTROL PANEL) | ✅ 완료 |
| BOOK SEARCH (알라딘 API) | ✅ 완료 |
| Archive 화면 (상태별 그룹) | ✅ 완료 |
| REC SESSION (상태 버튼 / 선택적 페이지) | ✅ 완료 |
| Log 화면 | ✅ 완료 |
| Monitor 화면 (계기판) | ✅ 완료 |
| DATA IMPORT (XLSX / CSV) | ✅ 완료 |
| PRE / ING / DONE 상태 관리 | ✅ 완료 |
| 로컬 데이터 영속성 (AsyncStorage) | ✅ 완료 |
| MOST READ CATEGORY | 🔲 미구현 (카테고리 데이터 미지원) |
| 클라우드 동기화 | 🔲 미구현 |
| 위젯 / 알림 | 🔲 미구현 |

---

## 기술 스택

### 프레임워크
- **Expo SDK 56** (React Native)
- **TypeScript**

### 네비게이션
- `@react-navigation/native`
- `@react-navigation/bottom-tabs`
- `@react-navigation/native-stack`

### 상태 관리 / 저장소
- React Context API + `useReducer`
- `@react-native-async-storage/async-storage` (로컬 영속성)

### 외부 API
- **알라딘 Open API** (도서 검색, 표지, 메타데이터)
- `corsproxy.io` (웹 환경 CORS 우회)

### 파일 처리
- `expo-document-picker` (파일 선택)
- `expo-file-system` (파일 읽기)
- `xlsx` (SheetJS — XLSX / CSV 파싱)

### UI / 디자인
- 커스텀 디자인 시스템 (`colors.ts`, `typography.ts`, `theme.ts`)
- `LcdPanel` 컴포넌트 (이중 베벨 LCD 패널)
- `MetalButton` 컴포넌트 (금속 베벨 버튼)
- `react-native-safe-area-context`

---

## 디자인 컨셉

```
Sony Discman  50%
Sony MiniDisc 30%
Macintosh System 7  20%
```

### 색상 팔레트

| 역할 | 색상 |
|---|---|
| Body | `#E9E9E4` |
| Panel | `#F5F5F0` |
| Border | `#BEBEB8` |
| Text | `#222222` |
| LCD Background | `#C8D5B3` |
| LCD Text | `#38452F` |
| Accent Neon Green | `#8DFF57` |

---

## 향후 개발 계획

### 단기
- [ ] 책 카테고리 필드 추가 (알라딘 API `categoryName` 연동)
- [ ] MOST READ CATEGORY 통계 활성화
- [ ] 총 페이지 수 직접 입력 UI (Archive 책 상세 편집)
- [ ] 연속 독서 일수(Streak) 알림

### 중기
- [ ] 독서 목표 설정 (월간 목표 권수 / 페이지)
- [ ] 독서 캘린더 히트맵
- [ ] 책 노트 / 문구 저장 기능
- [ ] 연도별 / 월별 독서 통계

### 장기
- [ ] 클라우드 백업 및 동기화
- [ ] iOS / Android 위젯
- [ ] 독서 데이터 내보내기 (XLSX / CSV Export)
- [ ] 다국어 지원

---

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npx expo start

# iOS 시뮬레이터
npx expo start --ios

# Android 에뮬레이터
npx expo start --android
```

### 알라딘 API 키 설정

`src/config.ts` 에 알라딘 TTB 키를 입력한다.

```typescript
export const ALADIN_TTB_KEY = 'YOUR_TTB_KEY_HERE';
```

알라딘 Open API 키는 [알라딘 API 페이지](https://www.aladin.co.kr/ttb/wapi_isapi.aspx)에서 발급받는다.

---

*B404K — Reading Not Found*
