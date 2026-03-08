# 최종 시스템 설계서: Scira 기반 자체 호스팅 AI 검색 에이전트 (BYOK Perplexity Clone)

## 1. 프로젝트 개요
본 프로젝트는 뛰어난 UI/UX와 실시간 스트리밍 답변 파이프라인을 갖춘 **오픈소스 AI 검색 엔진 Scira(구 MiniPerplx)**를 베이스 프레임워크로 사용합니다. 단, Scira가 내부적으로 의존하고 있는 상용 검색 API(Tavily, Exa 등)와 클라우드 서비스들을 모두 **자체 호스팅(Self-Hosted)이 가능한 무료 오픈소스 모듈로 교체**하여, 오직 사용자의 LLM API Key(Z.AI GLM-5)만으로 유지비 0원에 동작하는 100% 자급자족형 검색 에이전트를 구축합니다.

*(설계 원칙: 검색, 스크래핑, 코드 샌드박스, 기억 등 에이전트 핵심 기능에만 집중하며 날씨, 지도, 음성 등 불필요한 부가 기능은 코드에서 제거합니다.)*

---

## 2. 기본 아키텍처 및 베이스 프레임워크
* **베이스 프로젝트**: **Scira** (Next.js App Router + React Server Components)
* **에이전트 오케스트레이션**: **Vercel AI SDK** (`ai/providers.ts` 및 툴 호출 관리)
* **LLM 추론 엔진**: **Z.AI GLM-5**
    * *적용 방식*: Vercel AI SDK의 `@ai-sdk/openai` 프로바이더를 사용하여 OpenAI API 규격으로 Z.AI 엔드포인트를 호출합니다.

---

## 3. Scira 내부 도구(Tools)의 오픈소스 교체 설계

### 3.1. 일반 웹 검색 (Tavily -> SearXNG)
* **기존 방식**: Scira는 `TavilyClient`를 통해 유료 API를 호출하여 웹 검색 결과를 가져왔습니다.
* **대체 방식**: Docker로 로컬에 구동한 **SearXNG**를 호출하도록 코드를 수정합니다.
    * *구현*: `fetch("http://searxng:8080/search?q={query}&format=json")` 로직으로 변경하여 구글, 빙 등 70여 개 검색 엔진의 결과를 무료로 메타 검색합니다.

### 3.2. URL 딥 스크래핑 및 본문 파싱 (Exa/Firecrawl -> Crawl4AI)
* **기존 방식**: Exa API나 Firecrawl을 사용하여 특정 URL의 본문을 읽어오고 요약했습니다.
* **대체 방식**: 오픈소스 웹 크롤러인 **Crawl4AI** (Python API 서버 래핑 또는 Docker)를 호출합니다.
    * *구현*: 검색된 여러 URL을 병렬로 Crawl4AI 서버에 넘겨 동적 자바스크립트를 렌더링하고, 광고가 제거된 깨끗한 마크다운(Markdown) 텍스트만 돌려받아 RAG 컨텍스트로 사용합니다.

### 3.3. 유튜브 데이터 및 자막 추출 (Exa -> YouTube OSS 파이썬 라이브러리)
* **기존 방식**: Exa의 의미론적 검색을 통해 유튜브 영상을 검색했습니다.
* **대체 방식**: `youtube-search-python`과 `youtube-transcript-api`를 조합한 간단한 로컬 파이썬 마이크로서비스를 띄워 Scira에서 호출합니다. API Key 없이도 영상 메타데이터와 전체 자막(Transcript)을 추출할 수 있습니다.

### 3.4. 코드 실행 샌드박스 (Daytona/E2B -> Piston)
* **기존 방식**: Daytona API를 통해 클라우드 샌드박스에서 파이썬 코드를 실행했습니다.
* **대체 방식**: **Piston** 오픈소스 도커 이미지를 로컬에 띄웁니다.
    * *구현*: LLM이 데이터 분석이나 수학 계산 코드를 생성하면 Scira 프론트가 `http://piston:2000/api/v2/execute`로 코드를 전송하고 실행 결과값(stdout)을 받아 답변에 활용합니다.

### 3.5. 사용자 메모리 모듈 (Mem0 Cloud -> Mem0 Self-Hosted)
* **기존 방식**: Mem0의 클라우드 API를 사용해 사용자의 맥락을 저장했습니다.
* **대체 방식**: 연동 코드 구조는 그대로 유지하되, 엔드포인트만 로컬에 띄운 **Mem0 오픈소스 버전**과 로컬 벡터 데이터베이스(예: Qdrant)로 변경하여 데이터 프라이버시를 완벽히 확보합니다.

---

## 4. 시스템 통신 시퀀스 (동작 흐름)

1. **질문 입력 및 컨텍스트 로드**: 사용자가 Scira UI에 질문을 입력하면, Next.js 백엔드는 **Mem0 (Local)**를 통해 과거 맥락을 가져옵니다.
2. **검색 도구 호출 판단**: Vercel AI SDK가 Z.AI GLM-5 모델로 요청을 보내며, "질문에 답변하기 위해 검색이 필요한가?"를 판단합니다.
3. **오픈소스 도구 연쇄 호출**:
    * 검색이 필요하다면 GLM-5가 검색 쿼리를 생성하고, Scira는 로컬의 **SearXNG**로 HTTP 요청을 보냅니다.
    * SearXNG가 반환한 상위 URL 목록은 즉시 로컬의 **Crawl4AI** 서버로 보내져 본문 마크다운으로 변환됩니다.
    * 질문이 파이썬 코딩 및 계산이라면 **Piston** 샌드박스로 코드를 전송해 결과값을 얻습니다.
4. **최종 답변 스트리밍**: 스크래핑된 문서나 코드 실행 결과를 프롬프트에 첨부하여 GLM-5에 최종 요약을 요청합니다. 완성된 텍스트와 출처 번호는 Vercel AI SDK를 통해 Scira 프론트엔드 UI에 실시간 스트리밍됩니다.

---

## 5. 배포 및 인프라 구성 (Docker Compose 아키텍처)

Scira(Next.js)와 새롭게 교체된 오픈소스 도구들을 하나의 환경에서 실행하기 위해 다음과 같은 다중 컨테이너 구성을 사용합니다.

* `scira-web`: Next.js 서버 (에이전트 오케스트레이션 및 UI)
* `searxng`: 메타 검색 엔진 (포트 8080)
* `crawl4ai-api`: 웹 스크래핑을 위한 Python FastAPI 래퍼
* `piston-api`: 코드 실행 샌드박스 (포트 2000)
* `mem0-db`: 사용자 기억 저장을 위한 로컬 벡터 DB (Qdrant 등)
