const fs = require("fs");
const { readAndValidateYaml } = require("./validateYaml");
const { execSync } = require("child_process");
const yaml = require("js-yaml");

function readYaml(path, kind /* "issues" | "milestones" */) {
  const schemaFile =
    kind === "issues"
      ? require("path").resolve(__dirname, "../../schemas/issues.schema.json")
      : require("path").resolve(__dirname, "../../schemas/milestones.schema.json");

  return readAndValidateYaml(path, schemaFile);
}

function writeYaml(path, data) {
  fs.writeFileSync(path, yaml.dump(data, { noRefs: true, lineWidth: -1 }));
}

function getRepoFlag(repo) {
  return repo ? `--repo ${repo}` : "";
}

function parseDueDate(dateString) {
  if (!dateString) return null;

  // dateString이 YYYY-MM-DD 형식이면 그대로 처리
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return `${dateString}T23:59:59Z`;
  }

  // Date 객체로 파싱 시도 후 ISO 문자열 반환
  const date = new Date(dateString);
  if (!isNaN(date)) {
    return date.toISOString(); // ISO 형식으로 자동 변환됨
  }

  return null;
}

function ensureLabelsExist(repo, issues) {
  const labelsInYaml = [...new Set(issues.flatMap((i) => i.labels || []))];
  const existingLabels = JSON.parse(
    execSync(`gh label list ${getRepoFlag(repo)} --json name`, { encoding: "utf-8" })
  ).map((l) => l.name);

  const missingLabels = labelsInYaml.filter((label) => !existingLabels.includes(label));

  for (const label of missingLabels) {
    try {
      console.log(`🏷️ 라벨 생성: ${label}`);
      execSync(`gh label create "${label}" ${getRepoFlag(repo)} --color FFDD33`, {
        stdio: "inherit",
      });
    } catch (err) {
      console.error(`❌ 라벨 생성 실패: ${label}`, err.message);
    }
  }
}

function syncIssuesFromYaml(path, repo, dryRun = false, rollbackState) {
  const issuesYaml = readYaml(path, "issues");
  if (!dryRun) {
    ensureLabelsExist(repo, issuesYaml.issues || []);
  }
  const ghIssues = JSON.parse(
    execSync(`gh issue list ${getRepoFlag(repo)} --state all --json number,title,body,milestone`, {
      encoding: "utf-8",
    })
  );
  const titleToNumber = Object.fromEntries(ghIssues.map((i) => [i.title, i.number]));

  for (const issue of issuesYaml.issues || []) {
    const { title, body, milestone, labels = [] } = issue;
    const number = titleToNumber[title];

    if (!number) {
      console.log(dryRun
        ? `📝 생성 예정 (이슈): ${title}`
        : `✏️ 생성: ${title}`);
      let cmd = `gh issue create ${getRepoFlag(repo)} --title "${title}" --body "${body}"`;
      if (milestone) cmd += ` --milestone "${milestone}"`;
      if (labels.length) cmd += ` --label "${labels.join(",")}"`;
      if (!dryRun) {
        const output = execSync(cmd + " --json number", { encoding: "utf-8" });
        try {
          const created = JSON.parse(output);
          if (rollbackState && created && created.number) {
            rollbackState.issues.push(created.number);
          }
        } catch (e) {
          // 만약 gh 출력이 JSON이 아니면 무시
        }
      }
    } else {
      const current = JSON.parse(
        execSync(`gh issue view ${number} ${getRepoFlag(repo)} --json title,body`, {
          encoding: "utf-8",
        })
      );
      const needsTitle = current.title !== title;
      const needsBody = current.body?.trim() !== body?.trim();

      if (needsTitle || needsBody) {
        console.log(dryRun
          ? `📝 업데이트 예정: #${number} ${needsTitle ? "📄 제목" : ""} ${needsBody ? "📝 본문" : ""}`
          : `✏️ 업데이트: #${number} ${needsTitle ? "📄 제목" : ""} ${needsBody ? "📝 본문" : ""}`);
        let cmd = `gh issue edit ${number} ${getRepoFlag(repo)}`;
        if (needsTitle) cmd += ` --title "${title}"`;
        if (needsBody) cmd += ` --body "${body}"`;
        if (!dryRun) {
          execSync(cmd, { stdio: "inherit", env: { ...process.env, EDITOR: "true" } });
        }
      } else {
        console.log(`⏩ 변경 없음: #${number} (${title})`);
      }
    }
  }
}

function assignIssuesToMilestones(path, repo) {
  const issuesYaml = readYaml(path, "issues");
  const ghIssues = JSON.parse(
    execSync(`gh issue list ${getRepoFlag(repo)} --state all --json number,title,milestone`, {
      encoding: "utf-8"
    })
  );
  const titleToInfo = Object.fromEntries(
    ghIssues.map((i) => [i.title, { number: i.number, milestone: i.milestone?.title }])
  );

  for (const issue of issuesYaml.issues || []) {
    const { title, milestone: targetMilestone } = issue;
    const found = titleToInfo[title];
    if (!found) {
      console.warn(`⚠️ 이슈 없음 (title 기준): ${title}`);
      continue;
    }

    if (found.milestone === targetMilestone) {
      console.log(`⏭️ 마일스톤 일치: #${found.number} (${title})`);
      continue;
    }

    try {
      console.log(`📌 이슈 #${found.number} → 마일스톤 "${targetMilestone}"`);
      execSync(`gh issue edit ${found.number} ${getRepoFlag(repo)} --milestone "${targetMilestone}"`, {
        stdio: "inherit",
        env: { ...process.env, EDITOR: "true" },
      });
    } catch (err) {
      console.error(`❌ 실패: #${found.number} (${title})`, err.message);
    }
  }
}

function syncMilestonesFromYaml(path, repo, dryRun = false, rollbackState) {
  const yamlData = readYaml(path, "milestones");
  const milestones = yamlData.milestones || [];

  const existing = JSON.parse(
    execSync(`gh api repos/${repo}/milestones --paginate`, { encoding: "utf-8" })
  );
  const existingByTitle = Object.fromEntries(existing.map((m) => [m.title, m]));

  for (const m of milestones) {
    const exists = existingByTitle[m.title];

    if (exists) {
      const sameDescription = (exists.description || "") === (m.description || "");
      const sameDue = (exists.due_on?.split("T")[0] || "") === (m.due_on || m.due || "");
      const sameState = exists.state === (m.state || "open");

      if (sameDescription && sameDue && sameState) {
        console.log(`⏭️ 마일스톤 동일: ${m.title}`);
        continue;
      } else {
        console.log(dryRun
          ? `📝 업데이트 예정 (마일스톤): ${m.title}`
          : `♻️ 마일스톤 업데이트: ${m.title}`);
        if (!dryRun) {
          const dueDate = parseDueDate(m.due_on || m.due);
          const cmd = [
            `gh api repos/${repo}/milestones/${exists.number} -X PATCH`,
            m.description ? `-f description='${m.description}'` : "",
            dueDate ? `-f due_on='${dueDate}'` : "",
            m.state ? `-f state=${m.state}` : "",
          ].join(" ");
          execSync(cmd, { stdio: "inherit" });
        }
        continue;
      }
    }

    console.log(dryRun
      ? `📝 생성 예정 (마일스톤): ${m.title}`
      : `📌 마일스톤 생성: ${m.title}`);
    const dueDate = parseDueDate(m.due_on || m.due);
    const cmd = [
      `gh api repos/${repo}/milestones -f title='${m.title}'`,
      m.description ? `-f description='${m.description}'` : "",
      dueDate ? ` -f due_on='${dueDate}'` : "",
    ].join(" ");
    if (!dryRun) {
      const output = execSync(cmd, { stdio: "pipe", encoding: "utf-8" });
      try {
        const created = JSON.parse(output);
        if (rollbackState && created && created.number) {
          rollbackState.milestones.push(created.number);
        }
      } catch (e) {
        // 만약 gh api 출력이 JSON이 아니면 무시
      }
    }
  }
}

function dumpIssues(path, repo) {
  const issues = JSON.parse(
    execSync(`gh issue list ${getRepoFlag(repo)} --state all --json number,title,body,labels,assignees,milestone,createdAt,updatedAt,closedAt,state,author`, {
      encoding: "utf-8",
    })
  );

  const cleaned = issues.map((i) => ({
    number: i.number,
    title: i.title,
    body: i.body,
    labels: i.labels?.map((l) => l.name),
    assignees: i.assignees?.map((a) => a.login),
    milestone: i.milestone?.title || null,
    author: i.author?.login,
    state: i.state,
    created_at: i.createdAt,
    updated_at: i.updatedAt,
    closed_at: i.closedAt,
  }));

  writeYaml(path, { issues: cleaned });
  console.log(`📥 이슈 ${cleaned.length}개를 YAML로 저장했습니다: ${path}`);
}

function dumpMilestones(path, repo) {
  const milestones = JSON.parse(
    execSync(`gh api repos/${repo}/milestones --paginate`, { encoding: "utf-8" })
  );

  milestones.sort((a, b) => new Date(a.due_on) - new Date(b.due_on));

  const mapped = milestones.map((m) => ({
    number: m.number,
    title: m.title,
    description: m.description || "",
    state: m.state,
    due_on: m.due_on?.split("T")[0] || "",
    created_at: m.created_at,
    updated_at: m.updated_at,
    open_issues: m.open_issues,
    closed_issues: m.closed_issues,
  }));

  writeYaml(path, { milestones: mapped });
  console.log(`📦 마일스톤 ${mapped.length}개를 YAML로 저장했습니다: ${path}`);
}

function dumpCurrentStateToYaml(issuesPath, milestonesPath, repo) {
  dumpIssues(issuesPath, repo);
  dumpMilestones(milestonesPath, repo);
}

function rollbackChanges(rollbackState, repo) {
  for (const issueNum of (rollbackState.issues || []).reverse()) {
    try {
      execSync(`gh issue delete ${issueNum} ${getRepoFlag(repo)} --yes`);
      console.warn(`🗑️ 롤백: 이슈 #${issueNum} 삭제`);
    } catch (e) {
      console.error(`⚠️ 이슈 삭제 실패: #${issueNum}`);
    }
  }
  for (const msNum of (rollbackState.milestones || []).reverse()) {
    try {
      execSync(`gh api repos/${repo}/milestones/${msNum} -X DELETE`);
      console.warn(`🗑️ 롤백: 마일스톤 #${msNum} 삭제`);
    } catch (e) {
      console.error(`⚠️ 마일스톤 삭제 실패: #${msNum}`);
    }
  }
}

module.exports = {
  syncIssuesFromYaml,
  syncMilestonesFromYaml,
  assignIssuesToMilestones,
  dumpIssues,
  dumpMilestones,
  readYaml,
  writeYaml,
  dumpCurrentStateToYaml,
  rollbackChanges,
};