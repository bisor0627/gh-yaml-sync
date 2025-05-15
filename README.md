# 🛠️ gh‑yaml‑sync

> GitHub **이슈·마일스톤**을 **YAML** 파일로 **생성·업데이트·재배정·백업**하는 Node.js CLI 도구

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-brightgreen)]()
[![GitHub CLI](https://img.shields.io/badge/gh--cli-required-blue)]()
[![CI](https://github.com/bisor0627/gh-yaml-sync/actions/workflows/ci.yml/badge.svg)]()
[![License](https://img.shields.io/badge/license-MIT-green.svg)]()

---

## 🗂 목차

- [🛠️ gh‑yaml‑sync](#️-ghyamlsync)
  - [🗂 목차](#-목차)
  - [💡 프로젝트 동기](#-프로젝트-동기)
  - [📌 기능 개요](#-기능-개요)
  - [⚙️ 설치](#️-설치)
  - [🚀 사용법](#-사용법)
    - [1. YAML → GitHub 동기화](#1-yaml--github-동기화)
    - [2. GitHub → YAML 백업](#2-github--yaml-백업)
    - [3. 마일스톤 재배정](#3-마일스톤-재배정)
  - [🔍 내부 동작](#-내부-동작)
  - [🧪 테스트 및 CI](#-테스트-및-ci)
    - [테스트 실행](#테스트-실행)
    - [로컬에서 GitHub Actions 테스트 (act)](#로컬에서-github-actions-테스트-act)
  - [📚 트러블슈팅 \& 배운 점](#-트러블슈팅--배운-점)
  - [🙋🏻‍♀️ 작성자](#️-작성자)
  - [📝 License](#-license)

---

## 💡 프로젝트 동기

Apple Developer Academy 과제·계획을 GitHub Issues/Milestones로 관리하면서  
YAML 파일 기반으로 동기화를 반복하던 중, CLI 자동화를 위해 제작했습니다.

---

## 📌 기능 개요

| 명령어   | 설명                                                                 |
| -------- | -------------------------------------------------------------------- |
| `sync`   | YAML → GitHub 이슈/마일스톤 등록<br>➊ 마일스톤 → ➋ 이슈 순           |
| `dump`   | GitHub → YAML 전체 백업 (모든 메타 포함)                              |
| `assign` | YAML 기준으로 이슈를 마일스톤에 재배정                                |
| `diff`   | YAML과 GitHub 상태 차이점 분석 (추가·삭제·변경 감지)                  |
| _공통_   | `--dry-run` 지원, 중복 업데이트 최소화, 라벨 자동 생성, 롤백 처리      |

---

## ⚙️ 설치

```bash
git clone https://github.com/bisor0627/gh-yaml-sync.git
cd gh-yaml-sync
npm install
```

**사전 요구사항**

- Node.js 18 이상
- GitHub CLI (`gh auth login` 완료)
- macOS에서 act 사용 시: Docker 설치 필요

---

## 🚀 사용법

### 1. YAML → GitHub 동기화

```bash
gh-yaml-sync sync \
  --issues examples/issues.yaml \
  --milestones examples/milestones.yaml \
  --repo user/repo
```

### 2. GitHub → YAML 백업

```bash
gh-yaml-sync dump \
  --issues backup/issues.yaml \
  --milestones backup/milestones.yaml \
  --repo user/repo
```

### 3. 마일스톤 재배정

```bash
gh-yaml-sync assign \
  --issues examples/issues.yaml \
  --repo user/repo
```

✅ 기본 동작은 dry-run 아님. 실제 API 요청 발생  
➕ `--dry-run` 옵션으로 커맨드 로그만 출력 가능

---

## 🔍 내부 동작

1. **라벨 자동 생성**  
   `ensureLabelsExist()` 호출 → 없는 라벨은 FFDD33 색상으로 자동 생성
2. **마일스톤 생성/수정**  
   - `due_on` 필드는 2025-06-01, June 1 2025 등 자연어로 입력 가능  
   - PATCH API 호출로 기존 마일스톤 업데이트
3. **이슈 생성/업데이트**  
   - 제목·본문이 동일하면 생략  
   - `gh issue create/edit` 커맨드로 처리  
   - 실패 시 롤백 (issue/milestone 삭제)
4. **dump + 자동 백업**  
   - sync 성공 시 `.bak` 파일 자동 생성  
   - 기존 YAML은 덮어쓰기됨

---

## 🧪 테스트 및 CI

### 테스트 실행

```bash
npm test                # Jest 기반 유닛 테스트 실행
npm run check:schema    # 스키마 수동 검증 (scripts/manual-schema-check.js)
```

### 로컬에서 GitHub Actions 테스트 (act)

```bash
# 최초 1회
brew install act
act push --container-architecture linux/amd64
```

`act`는 `.github/workflows/ci.yml`을 기반으로 실제 테스트 실행을 시뮬레이션합니다.

---

## 📚 트러블슈팅 & 배운 점

| 주제             | 내용                                                        |
| ---------------- | ----------------------------------------------------------- |
| gh API 활용      | `gh api --paginate`로 전체 마일스톤 조회                    |
| 라벨 미존재 대응 | `gh label create`로 FFDD33 색상 기본 생성                   |
| 중복 API 방지    | 제목·본문 동일 시 `gh edit` 생략                            |
| 테스트 구조화    | jest + fixtures/ 기반 유닛 테스트 구축                      |
| CI 구축 전략     | act → GitHub Actions 병행 개발 가능                         |

---

## 🙋🏻‍♀️ 작성자

| 이름   | GitHub                                    |
| ------ | ----------------------------------------- |
| 양서린 | [@bisor0627](https://github.com/bisor0627) |

---

## 📝 License

This project is licensed under the [MIT LICENSE](https://choosealicense.com).