# 🛠️ gh-yaml-sync

> GitHub 이슈 및 마일스톤을 YAML 파일 기반으로 생성, 업데이트, 할당하는 Node.js CLI 툴

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-brightgreen)]()
[![GitHub CLI](https://img.shields.io/badge/gh--cli-supported-blue)]()
[![License](https://img.shields.io/badge/license-MIT-green.svg)]()

---

## 🗂 목차
- [🛠️ gh-yaml-sync](#️-gh-yaml-sync)
  - [🗂 목차](#-목차)
  - [💡 프로젝트 동기](#-프로젝트-동기)
  - [📌 목표](#-목표)
  - [⚙️ 개발 환경](#️-개발-환경)
  - [🧩 구현 기능](#-구현-기능)
  - [📚 배운 점 / 트러블슈팅](#-배운-점--트러블슈팅)
  - [⚙️ 설치 및 실행](#️-설치-및-실행)
  - [🔍 프로젝트 구조](#-프로젝트-구조)
  - [🧪 테스트 / 시연](#-테스트--시연)
  - [📝 추후 개선 사항](#-추후-개선-사항)
  - [🙋🏻‍♀️ 작성자](#️-작성자)
  - [📝 License](#-license)

---

## 💡 프로젝트 동기

Apple Developer Academy에서 Swift 강의를 학습하며 GitHub 기반 일정 관리 자동화를 위해 `gh-yaml-sync`를 개발하게 되었습니다.  
매일 YAML 파일로 이슈/마일스톤을 정의하고, 이를 GitHub에 동기화하는 반복 작업을 자동화하고자 했습니다.

## 📌 목표

- GitHub 프로젝트 학습 기록 자동화
- YAML 파일 기반 이슈 및 마일스톤 관리
- 깔끔한 CLI 사용 경험 제공

## ⚙️ 개발 환경

- Node.js 18+
- GitHub CLI (`gh`)
- js-yaml
- commander

## 🧩 구현 기능

- [x] `.yaml` 기반 이슈 생성/업데이트
- [x] `.yaml` 기반 마일스톤 생성/업데이트
- [x] 마일스톤-이슈 자동 배정
- [x] GitHub 상태 → YAML로 덤프(dump)
- [x] 중복 업데이트 방지 (변경 체크 기반)

```bash
# 이슈와 마일스톤을 GitHub에 반영
gh-yaml-sync sync --issues .github/plans/issues.yaml --milestones .github/plans/milestones.yaml --repo user/repo

# GitHub 상태를 YAML로 저장
gh-yaml-sync dump --issues path/to/issues.yaml --milestones path/to/milestones.yaml --repo user/repo

# 이슈를 마일스톤에 배정
gh-yaml-sync assign --issues path/to/issues.yaml --repo user/repo
```

## 📚 배운 점 / 트러블슈팅

| 주제         | 요약                             |
| ---------- | ------------------------------ |
| GitHub CLI | gh api, gh issue edit 등 커맨드 조합 |
| YAML 파싱    | js-yaml로 커스터마이징한 구조 읽고 쓰기      |
| 업데이트 최적화   | 이슈/마일스톤 변경 여부 사전 비교 후 실행       |

## ⚙️ 설치 및 실행

```bash
node src/bin/index.js sync --issues .github/plans/issues.yaml --milestones .github/plans/milestones.yaml --repo user/repo
```

## 🔍 프로젝트 구조

```
📦gh-yaml-sync
┣ 📂src
┃ ┣ 📂cli              # 명령어 정의 (sync, dump, assign)
┃ ┣ 📂utils            # yaml 파싱, gh API 헬퍼 함수
┃ ┗ 📂bin              # 실행 엔트리포인트
┣ 📂tests              # 테스트
┣ 📜package.json
┣ 📜README.md
┗ 📜LICENSE
```

## 🧪 테스트 / 시연
- 로컬 .github/plans/issues.yaml, milestones.yaml 기반으로 실 사용
- 실제 GitHub 저장소에서 동기화 검증 완료
- dump 기능으로 주간 계획 백업 자동화

## 📝 추후 개선 사항
- dump 시 마일스톤에 연결된 days 구조 자동 추출
- GitHub Action과의 연계 (ex. push 시 README 자동 반영)
- 로컬 캐시 기반으로 변경 비교 성능 향상
- assign 명령 실행 시 변경 내역만 업데이트되도록 개선
- 에러 메시지에 따라 자동 복구 옵션 제공 (--force, --dry-run)


## 🙋🏻‍♀️ 작성자

| 이름 | GitHub |
|------|--------|
| 양서린 | [@bisor0627](https://github.com/bisor0627) |

## 📝 License

This project is licensed under the [MIT LICENSE](https://choosealicense.com).