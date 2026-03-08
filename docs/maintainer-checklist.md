# Maintainer Checklist

`web-surfer` 오픈소스 npm 프로젝트 유지관리를 위한 필수 체크리스트.

---

## 1. 브랜치 & 태그 전략

### 브랜치 구조

```
main ────●─────────────────●──  (안정 배포, 검증 완료된 버전)
          ↑ promote         ↑
release ──●────────●────────●──  (최신 배포, npm publish 시점)
           ↑ merge  ↑
qa ────────●──●─────●──────────  (테스트/QA 검증)
            ↑ merge
dev ──●──●──●──●──●──●────────  (활발한 개발)
       \     /
feat/x ──●──●  (기능 브랜치, dev에 PR로 머지)
```

### 브랜치 역할

| 브랜치 | 역할 | 머지 방향 | 직접 커밋 |
|--------|------|-----------|-----------|
| `dev` | 개발 통합 | ← `feat/*`, `fix/*` | 허용 |
| `qa` | QA/테스트 검증 | ← `dev` | 금지 (버그 수정만 예외) |
| `release` | 최신 npm 배포 상태 | ← `qa` | 릴리스 커밋만 허용 |
| `main` | 안정 버전 (검증 완료) | ← `release` | 금지 |

### 코드 흐름

```
개발:     feat/* → dev (PR)
테스트:   dev → qa (머지)
배포:     qa → release (머지) → 버전 범프 + 태그 + npm publish
안정화:   release → main (검증 후 promote)
역머지:   release → dev (버전 범프 커밋 동기화)
```

### 핵심 규칙
- **`dev`에서 개발**: 모든 기능 개발과 버그 수정은 `dev` 또는 `dev`에서 분기한 브랜치에서 진행
- **PR 대상은 `dev`**: 외부 기여자의 PR은 `dev` 브랜치로 머지
- **`qa`에서 검증**: 배포 전 테스트/QA는 `qa` 브랜치에서 수행
- **`release`에서 배포**: 버전 범프, CHANGELOG 작성, 태그 생성, npm publish는 `release`에서 수행
- **`main`은 안정 버전**: `release`에서 충분히 검증된 후 `main`으로 promote

### 태그 컨벤션
- **형식**: `vX.Y.Z` (예: `v0.2.0`)
- **생성 위치**: `release` 브랜치에서만
- **대응 관계**: git 태그 = npm 버전 = GitHub Release (1:1:1)
- 태그가 있는 커밋 = `npm publish`가 실행된 시점

---

## 2. 릴리스 전 체크리스트

### 코드 품질
- [ ] `npm run lint` 통과 확인
- [ ] `npx tsc --noEmit` 타입 에러 없음 확인
- [ ] `npm run build:lib` 빌드 성공 확인
- [ ] `dist/` 출력물 정상 생성 확인 (index.js, index.d.ts, cli.js)
- [ ] 새 기능에 대한 테스트 작성 (테스트 프레임워크 도입 시)

### 버전 관리
- [ ] [Semantic Versioning](https://semver.org/) 규칙 준수
  - **patch** (0.1.x): 버그 수정, 하위 호환
  - **minor** (0.x.0): 새 기능 추가, 하위 호환
  - **major** (x.0.0): Breaking change
- [ ] `package.json`의 `version` 필드 업데이트
- [ ] `CHANGELOG.md` 해당 버전 섹션 작성

### CHANGELOG 작성 규칙
```markdown
## [0.2.0] - 2026-XX-XX

### Added
- 새로 추가된 기능

### Changed
- 기존 기능의 변경사항

### Fixed
- 버그 수정

### Deprecated
- 곧 제거될 기능 (다음 major에서 제거 예고)

### Removed
- 제거된 기능

### Breaking Changes
- 하위 호환이 깨지는 변경사항
```

### npm publish 전 최종 확인
- [ ] `npm pack --dry-run`으로 패키지에 포함될 파일 확인
  - `dist/`, `bin/`, `README.md`, `LICENSE`만 포함되는지
  - `.env`, `node_modules`, `reference/` 등 민감 파일 제외 확인
- [ ] `README.md` 내용이 최신 상태인지 확인 (npm 페이지에 표시됨)
- [ ] `engines.node >= 20.0.0` 요구사항이 정확한지 확인

---

## 3. 릴리스 프로세스

### 표준 릴리스 플로우

```bash
# 1. dev → qa 머지 (QA 시작)
git checkout qa
git pull origin qa
git merge dev
git push origin qa

# 2. qa 브랜치에서 테스트/검증 수행
# QA 통과 후 계속 진행

# 3. qa → release 머지
git checkout release
git pull origin release
git merge qa

# 4. release에서 버전 범프 + CHANGELOG 작성 + 커밋
# (package.json version 수정, CHANGELOG.md 업데이트)
git add package.json CHANGELOG.md
git commit -m "chore(release): release vX.Y.Z"

# 5. release에서 태그 생성
git tag vX.Y.Z

# 6. 빌드 & 퍼블리시
npm publish --access public  # prepublishOnly 훅이 자동으로 build:lib 실행

# 7. release 푸시 (태그 포함)
git push origin release --tags

# 8. dev로 역머지 (버전 범프 커밋 동기화)
git checkout dev
git merge release
git push origin dev

# 9. GitHub Release 생성
gh release create vX.Y.Z --title "vX.Y.Z" --generate-notes

# 10. (선택) 안정성 검증 후 release → main promote
git checkout main
git pull origin main
git merge release
git push origin main
```

### 핵심 포인트
- **버전 범프와 태그는 반드시 `release`에서** 수행
- `dev`, `qa`에서는 버전 관련 작업을 하지 않음
- `npm publish`는 `release`에서 실행 (패키지에 포함되는 코드 = `release`의 코드)
- 릴리스 후 반드시 `release` → `dev` 역머지로 버전 범프 커밋 동기화
- `release` → `main` promote는 안정성 확인 후 별도 수행

### main promote 시점
- 릴리스 후 일정 기간 (예: 1주일) 운영 안정성 확인
- 치명적 이슈가 없으면 `release` → `main` 머지
- Hotfix가 필요한 경우 `release`에서 수정 후 재배포, 안정화 후 `main` promote

### 첫 퍼블리시 (아직 안 했다면)
```bash
# npm 로그인 확인
npm whoami

# 패키지명 사용 가능 여부 확인
npm view web-surfer

# scoped 패키지로 변경이 필요할 수 있음
# 예: @hun-meta/web-surfer

# 첫 퍼블리시 (public 접근 필수 지정)
npm publish --access public
```

---

## 4. 의존성 관리

### 정기 점검 (월 1회 권장)
- [ ] `npm audit` 실행 → 보안 취약점 확인 및 수정
- [ ] `npm outdated` 실행 → 주요 의존성 업데이트 확인
- [ ] AI SDK (`ai`, `@ai-sdk/*`) 버전 호환성 확인
- [ ] Node.js LTS 버전 지원 상태 확인

### 의존성 업데이트 원칙
- **patch 업데이트**: 즉시 적용 가능
- **minor 업데이트**: CHANGELOG 확인 후 적용
- **major 업데이트**: 별도 브랜치에서 테스트 후 적용
- AI SDK는 breaking change가 잦으므로 릴리스 노트 필독

### peer dependency 관리
- `zod`, `ai`, `@ai-sdk/*`는 `tsup.config.ts`에서 external로 처리됨
- 사용자가 직접 설치해야 하는 패키지를 `peerDependencies`로 분리 검토
- 현재는 `dependencies`에 포함되어 있어 자동 설치됨

---

## 5. 보안

### 절대 하지 말 것
- `.env`, `.env.local` 파일을 커밋하거나 npm에 포함하지 않기
- API 키, 비밀번호를 코드에 하드코딩하지 않기
- `npm publish` 전에 항상 `npm pack --dry-run`으로 민감 파일 확인

### 정기 보안 점검
- [ ] `npm audit` 실행
- [ ] `npm audit signatures` 실행 (패키지 무결성 확인)
- [ ] 외부 서비스 URL 입력값 검증 (SearXNG, Crawl4AI, Piston)
- [ ] GitHub Security Advisories 확인

### 취약점 발견 시 대응
1. 심각도 평가 (Critical/High → 즉시, Medium/Low → 다음 릴리스)
2. 수정 패치 작성
3. 영향받는 버전 명시하여 Security Advisory 발행
4. 패치 버전 즉시 퍼블리시

---

## 6. CI/CD 구축 (TODO)

> 현재 GitHub Actions 워크플로우가 없음. 아래 항목 구축 필요.

### 필수 워크플로우
- [ ] **PR 검증**: lint + typecheck + build (모든 PR에 실행)
- [ ] **테스트**: 테스트 프레임워크 도입 후 자동 실행
- [ ] **npm publish**: 태그 push 시 자동 퍼블리시 (선택)
- [ ] **의존성 감사**: `npm audit`를 스케줄로 실행

### 최소 CI 구성 예시
```yaml
# .github/workflows/ci.yml
name: CI
on:
  push:
    branches: [dev, qa, release, main]
  pull_request:
    branches: [dev]

jobs:
  validate:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [20, 22]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit
      - run: npm run build:lib
```

---

## 7. 이슈 & PR 관리

### 이슈 대응
- **bug_report**: 재현 가능 여부 확인 → 라벨 부여 → 우선순위 지정
- **feature_request**: 프로젝트 방향성 부합 여부 판단 → 논의 → 수락/거절
- 7일 이상 응답 없는 이슈에 `stale` 라벨 고려
- `good first issue` 라벨로 신규 기여자 유도

### PR 리뷰 체크리스트
- [ ] 커밋 컨벤션 준수 (`docs/commit-convention.md`)
- [ ] PR 템플릿 체크리스트 완료
- [ ] Breaking change 여부 확인
- [ ] 문서 업데이트 포함 여부 확인
- [ ] 타입 안전성 확인 (strict mode)

### 라벨 체계 (권장)
| 라벨 | 용도 |
|------|------|
| `bug` | 버그 리포트 |
| `enhancement` | 기능 개선 |
| `documentation` | 문서 관련 |
| `good first issue` | 입문자 적합 |
| `help wanted` | 도움 필요 |
| `breaking change` | 하위 호환 깨짐 |
| `wontfix` | 수정하지 않을 이슈 |
| `duplicate` | 중복 이슈 |

---

## 8. 문서 유지관리

### 코드 변경 시 동기화 필수
- [ ] `README.md` — 설치 방법, 지원 프로바이더 목록, 기능 개요
- [ ] `docs/cli-guide.md` — CLI 커맨드/옵션 변경 시
- [ ] `docs/library-guide.md` — API 시그니처 변경 시
- [ ] `docs/providers.md` — 프로바이더 추가/제거 시
- [ ] `docs/getting-started.md` — 설치/설정 방법 변경 시
- [ ] `CONTRIBUTING.md` — 개발 프로세스 변경 시

### 문서 품질 기준
- 코드 예제는 실제 동작 가능한 상태 유지
- 외부 서비스 URL/포트 변경 시 `docs/docker-setup.md` 반영
- `.env.example`과 문서의 환경변수 설명 일치 확인

---

## 9. npm 패키지 품질 관리

### 패키지 크기 모니터링
```bash
# 패키지 크기 확인
npm pack --dry-run 2>&1 | tail -1

# 상세 파일 목록
npm pack --dry-run
```
- 불필요한 파일이 포함되지 않도록 `files` 필드 관리
- sourcemap(`.js.map`) 포함 여부 결정 (디버깅 편의 vs 크기)

### 설치 테스트
```bash
# 로컬에서 설치 테스트
npm pack
mkdir /tmp/test-install && cd /tmp/test-install
npm init -y
npm install /path/to/web-surfer-0.2.0.tgz

# 실제 import 테스트
node -e "import('web-surfer').then(m => console.log(Object.keys(m)))"
```

### ESM 호환성
- `"type": "module"` 유지 — CJS 환경에서는 동작하지 않음을 README에 명시
- `exports` 필드로 엔트리 포인트 명확히 정의됨

---

## 10. 커뮤니티 관리

### 기여자 경험
- `CONTRIBUTING.md` 최신 상태 유지
- PR 머지 시 기여자에게 감사 표시
- 첫 기여자에게 특히 친절하게 리뷰

### 소통 채널
- GitHub Issues: 버그 리포트, 기능 요청
- GitHub Discussions: 일반 질문, 아이디어 (활성화 검토)
- README에 소통 방법 명시

### Code of Conduct
- [ ] `CODE_OF_CONDUCT.md` 추가 검토 (오픈소스 표준)

---

## 11. 주기적 점검 일정

| 주기 | 항목 |
|------|------|
| **PR마다** | lint, typecheck, build 확인 |
| **주 1회** | 열린 이슈/PR 확인 및 응답 |
| **월 1회** | `npm audit` + `npm outdated` |
| **릴리스마다** | CHANGELOG 작성, 문서 동기화, `npm pack --dry-run` |
| **분기 1회** | README 전체 검토, 의존성 major 업데이트 검토, Node.js 버전 지원 확인 |

---

## Quick Reference: 릴리스 명령어

```bash
# 1. dev → qa → release 머지
git checkout qa && git pull origin qa && git merge dev && git push origin qa
# (QA 검증 후)
git checkout release && git pull origin release && git merge qa

# 2. release에서 버전 범프 + 커밋 + 태그 (수동 시)
# package.json version 수정, CHANGELOG.md 작성 후:
git add package.json CHANGELOG.md
git commit -m "chore(release): release vX.Y.Z"
git tag vX.Y.Z

# 3. 퍼블리시 + 푸시
npm publish --access public
git push origin release --tags

# 4. dev 역머지
git checkout dev && git merge release && git push origin dev

# 5. GitHub Release
gh release create vX.Y.Z --title "vX.Y.Z" --generate-notes

# 6. (안정성 확인 후) release → main promote
git checkout main && git merge release && git push origin main

# Claude Code 자동 릴리스 (권장)
# /prj:release              ← 커밋 분석 후 자동 판단
# /prj:release minor        ← 수동 지정
# /prj:release --dry-run    ← 점검만 실행
```
