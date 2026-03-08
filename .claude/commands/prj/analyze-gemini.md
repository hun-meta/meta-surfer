---
description: Gemini CLI를 실행하여 응답을 가져옵니다.
argument-hint: [요청할 프롬프트 내용]
allowed-tools: Bash
---

# Task
사용자가 다음 내용으로 Gemini에게 질문을 요청했습니다:
"$ARGUMENTS"

# Instructions
1. 당신의 Bash 도구를 사용하여 시스템에 설치된 `gemini` CLI 명령어를 실행하세요.
2. 명령어 형식은 `gemini "$ARGUMENTS"` 와 같이 구성하세요. (명령어 구조는 설치된 Gemini CLI 버전에 맞게 조정)
3. 터미널(Bash)을 통해 실행된 Gemini CLI의 출력(Output) 결과를 그대로 읽어옵니다.
4. 가져온 결과값을 현재 작업 컨텍스트에 맞게 요약하거나, 그대로 사용자에게 출력하여 제공해 주세요.
