# 🛠️ gh‑yaml‑sync

> GitHub **이슈·마일스톤**을 **YAML** 파일로 **생성·업데이트·배정·백업** 하는 Node.js CLI

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-brightgreen)]()
[![GitHub CLI](https://img.shields.io/badge/gh--cli-required-blue)]()
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
- [3. 마일스톤 재배정만 갱신](#3-마일스톤-재배정만-갱신)
  - [🔍 내부 동작](#-내부-동작)
  - [📚 트러블슈팅 \& 배운 점](#-트러블슈팅배운-점)
  - [📝 추후 개선](#-추후-개선)
  - [🙋🏻‍♀️ 작성자](#️-작성자)
  - [📝 License](#-license)

---

## 💡 프로젝트 동기
Apple Developer Academy 학습 일정·과제를 GitHub Issues/Milestones로 관리하면서,  
매일 **YAML** 파일로 계획을 작성해 **한 번의 CLI**로 동기화하고자 **gh‑yaml‑sync**를 만들었습니다.

---

## 📌 기능 개요

| 명령 | 설명 |
|------|------|
| `sync` | YAML → GitHub<br>① 마일스톤 생성 → ② 이슈 생성/업데이트<br>※ 이후 마일스톤·라벨 변경은 자동 반영되지 않음 |
| `dump` | GitHub → YAML 백업 (이슈·마일스톤 **전체 메타** 포함) |
| `assign` | YAML 정의에 따라 **이슈를 마일스톤에 재배정** |
| _공통_ | • YAML에만 존재하는 **라벨 자동 생성**<br>• 제목·본문이 동일하면 **중복 업데이트 건너뜀**<br>• `YYYY‑MM‑DD` 또는 자연어 Due Date를 **ISO‑8601(`T23:59:59Z`)** 로 변환 |

---

## ⚙️ 설치

```bash
# 레포 클론 후 로컬 실행
git clone https://github.com/bisor0627/gh-yaml-sync.git
cd gh-yaml-sync && npm install
```

> **사전 요구 사항**
> - Node.js 18 이상
> - GitHub CLI gh (로그인 완료)


## 🚀 사용법

# 1. YAML → GitHub 동기화

```javascript
gh-yaml-sync sync \
  --issues .github/plans/issues.yaml \
  --milestones .github/plans/milestones.yaml \
  --repo user/repo
```

# 2. GitHub → YAML 백업

```javascript
gh-yaml-sync dump \
  --issues backup/issues.yaml \
  --milestones backup/milestones.yaml \
  --repo user/repo
```

# 3. 마일스톤 재배정만 갱신

```javascript
gh-yaml-sync assign \
  --issues .github/plans/issues.yaml \
  --repo user/repo
```

> TIP CI·CD에서 사용 시 GITHUB_TOKEN (PAT 또는 GitHub Actions 기본 토큰)을 env에 넣어 두면 비대화식으로 작동합니다.


## 🔍 내부 동작

1. **라벨 선처리**  
   `ensureLabelsExist()`가 YAML에서 참조되는 모든 라벨을 조회 후,  
   GitHub에 없으면  FFDD33 색상으로 `gh label create` 즉시 생성합니다.

2. **마일스톤 동기화**  
   - 기존 마일스톤은 건너뜀  
   - `due_on` 필드가 **YYYY‑MM‑DD 또는 자연어**면 ISO 8601로 변환

3. **이슈 동기화**  
   - **신규** → `gh issue create`  
   - **기존** → 제목·본문 변경 여부 비교 후 필요한 필드만 `gh issue edit`

4. **배정(assign)**  
   YAML 정의와 현재 GitHub 상태를 비교해  
   **불일치 이슈만** `gh issue edit --milestone` 실행


## 📚 트러블슈팅 & 배운 점

| **주제**          | **인사이트**                                                                 |
|-------------------|--------------------------------------------------**---------------------------|
| GitHub CLI API    | `gh api + --paginate`로 모든 마일스톤을 확보                                 |
| 라벨 동기화        | CLI에서 색상을 지정해야 생성 가능 → 일단 **고정값 FFDD33** 사용             |
| 중복 편집 방지     | 제목·본문 `trim()` 후 비교해 API 호출 수 대폭 절감                          |
| ISO 8601 변환      | 네이티브 `Date` 객체로 파싱 후 `toISOString()` 사용                        |


## 📝 추후 개선

- `--dry-run` 옵션으로 변경 내역 미리보기
- 라벨 색상·설명 커스터마이즈
- `dump` 시 마일스톤 `days` 세부 구조 자동 추출
- 캐시 기반 변경 비교로 대형 레포 성능 최적화
- GitHub Actions 템플릿 제공 (push → README 자동 갱신)


## 🙋🏻‍♀️ 작성자

| **이름** | **GitHub**                     |
|----------|--------------------------------|
| 양서린    | [@bisor0627](https://github.com/bisor0627) |


## 📝 License

This project is licensed under the [MIT LICENSE](https://choosealicense.com).