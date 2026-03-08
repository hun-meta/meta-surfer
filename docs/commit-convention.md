# 커밋 컨벤션

프로젝트의 Git 커밋 메시지 작성 규칙을 정의한다.

## 형식

```
<타입>(<범위>): <제목>

<본문 (선택)>

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

## 타입

| 타입 | 설명 | 예시 |
|------|------|------|
| `초기` | 프로젝트 초기 설정, 스캐폴딩 | 초기(프로젝트): 프로젝트 스캐폴딩 및 빌드 설정 |
| `기능` | 새로운 기능 추가 | 기능(YouTube분석기): 프레임 추출 파이프라인 구현 |
| `수정` | 버그 수정 | 수정(OCR): 중복 텍스트 제거 로직 오류 수정 |
| `개선` | 리팩토링, 성능 개선 (기능 변경 없음) | 개선(LLM): 프로바이더 팩토리 구조 개선 |
| `문서` | 문서 추가/수정 | 문서(설계): 아키텍처 문서 작성 |
| `설정` | 빌드, CI/CD, 환경 설정 변경 | 설정(docker): SearXNG 컨테이너 설정 추가 |
| `테스트` | 테스트 추가/수정 | 테스트(LLM): OpenAI 프로바이더 단위 테스트 |
| `스타일` | 포맷팅, 공백 등 (로직 변경 없음) | 스타일(전체): import 정렬 통일 |
| `기타` | 위에 해당하지 않는 변경 | 기타(deps): 의존성 업데이트 |

## 규칙

1. **제목과 본문은 반드시 한글로 작성한다**
2. 제목은 50자 이내로 간결하게 작성한다
3. 제목 끝에 마침표를 붙이지 않는다
4. 본문은 "무엇을 왜" 변경했는지 설명한다
5. 범위는 변경 대상 모듈/영역을 괄호 안에 명시한다
6. 하나의 커밋에는 하나의 논리적 변경만 포함한다

## 범위 예시

| 범위 | 대상 |
|------|------|
| `프로젝트` | 루트 설정, 전체 프로젝트 |
| `타입` | `src/types/` |
| `설정` | `src/config/` |
| `유틸` | `src/utils/` |
| `LLM` | `src/llm/` |
| `CLI` | `src/index.ts` |
| `YouTube분석기` | `src/modules/youtube-analyzer/` |
| `웹리서처` | `src/modules/web-researcher/` |
| `미디어생성기` | `src/modules/media-generator/` |
| `영상편집기` | `src/modules/video-editor/` |
| `업로더` | `src/modules/uploader/` |
| `소스수집기` | `src/modules/source-collector/` |
| `claude` | `.claude/` |
| `docker` | `docker-compose.yml` |
| `문서` | `docs/` |

## 본문 작성 예시

```
기능(YouTube분석기): OCR 기반 텍스트 추출 구현

- tesseract.js를 활용한 이미지 OCR 처리 추가
- sharp 전처리로 인식률 향상 (그레이스케일 + 대비 조정)
- 연속 프레임 간 중복 텍스트 자동 제거

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```
