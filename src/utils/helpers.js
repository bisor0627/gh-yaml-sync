const fs = require("fs");
const yaml = require("js-yaml");
const { execSync } = require("child_process");

function readYaml(path) {
  return yaml.load(fs.readFileSync(path, "utf-8"));
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

function syncIssuesFromYaml(path, repo) {
  const issuesYaml = readYaml(path);
  ensureLabelsExist(repo, issuesYaml.issues || []);
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
      console.log(`✏️ 생성: ${title}`);
      let cmd = `gh issue create ${getRepoFlag(repo)} --title "${title}" --body "${body}"`;
      if (milestone) cmd += ` --milestone "${milestone}"`;
      if (labels.length) cmd += ` --label "${labels.join(",")}"`;
      execSync(cmd, { stdio: "inherit"});
    } else {
      const current = JSON.parse(
        execSync(`gh issue view ${number} ${getRepoFlag(repo)} --json title,body`, {
          encoding: "utf-8",
        })
      );
      const needsTitle = current.title !== title;
      const needsBody = current.body?.trim() !== body?.trim();

      if (needsTitle || needsBody) {
        console.log(`✏️ 업데이트: #${number} ${needsTitle ? "📄 제목" : ""} ${needsBody ? "📝 본문" : ""}`);
        let cmd = `gh issue edit ${number} ${getRepoFlag(repo)}`;
        if (needsTitle) cmd += ` --title "${title}"`;
        if (needsBody) cmd += ` --body "${body}"`;
        execSync(cmd, { stdio: "inherit", env: { ...process.env, EDITOR: "true" } });
      } else {
        console.log(`⏩ 변경 없음: #${number} (${title})`);
      }
    }
  }
}

function assignIssuesToMilestones(path, repo) {
  const issuesYaml = readYaml(path);
  const ghIssues = JSON.parse(
    execSync(`gh issue list ${getRepoFlag(repo)} --state all --json number,title,milestone`, {
      encoding: "utf-8",
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

function syncMilestonesFromYaml(path, repo) {
  const yamlData = readYaml(path);
  const milestones = yamlData.milestones || [];

  const existing = JSON.parse(
    execSync(`gh api repos/${repo}/milestones --paginate`, { encoding: "utf-8" })
  );
  const titleToMilestone = Object.fromEntries(existing.map((m) => [m.title, m]));

  for (const m of milestones) {
    const exists = titleToMilestone[m.title];
    if (exists) {
      console.log(`⏭️ 마일스톤 존재: ${m.title}`);
      continue;
    }

    console.log(`📌 마일스톤 생성: ${m.title}`);
    const dueDate = parseDueDate(m.due_on || m.due);
   
    const cmd = [
      `gh api repos/${repo}/milestones -f title='${m.title}'`,
      m.description ? `-f description='${m.description}'` : "",
      dueDate?  ` -f due_on='${dueDate}'` : "",
    ].join(" ");

    execSync(cmd, { stdio: "inherit" });
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



module.exports = {
  // 기존 함수들과 함께 추가
  syncIssuesFromYaml,
  syncMilestonesFromYaml,
  assignIssuesToMilestones,
  dumpIssues, 
  dumpMilestones, 
  readYaml,
  writeYaml,
};