const {
    readYaml,
    dumpIssues,
    dumpMilestones
} = require("../utils/helpers");
const fs = require("fs");
const path = require("path");
const os = require("os");

function loadRemoteData(repo) {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ghsync-diff-"));
    const tmpIssues = path.join(tmpDir, "issues.yaml");
    const tmpMilestones = path.join(tmpDir, "milestones.yaml");

    dumpIssues(tmpIssues, repo);
    dumpMilestones(tmpMilestones, repo);

    return {
        issues: readYaml(tmpIssues, "issues"),
        milestones: readYaml(tmpMilestones, "milestones")
    };
}

function printDiff(local, remote, label) {
    const stringify = (obj) => JSON.stringify(obj, null, 2);

    const localSet = new Set(local.map(i => i.title));
    const remoteSet = new Set(remote.map(i => i.title));

    const added = [...remoteSet].filter(x => !localSet.has(x));
    const removed = [...localSet].filter(x => !remoteSet.has(x));
    const common = [...localSet].filter(x => remoteSet.has(x));

    for (const t of added) {
        console.log(`🆕 ${label} 추가됨: ${t}`);
    }
    for (const t of removed) {
        console.log(`❌ ${label} 삭제됨: ${t}`);
    }
    for (const t of common) {
        const localItem = local.find(i => i.title === t);
        const remoteItem = remote.find(i => i.title === t);
        if (stringify(localItem) !== stringify(remoteItem)) {
            console.log(`♻️ ${label} 수정됨: ${t}`);
        }
    }
}

function showDiff(options) {
    const { issues, milestones, repo } = options;
    const localIssues = readYaml(issues, "issues").issues || [];
    const localMs = readYaml(milestones, "milestones").milestones || [];
    const remote = loadRemoteData(repo);

    console.log("\n🔍 이슈 차이 분석:");
    printDiff(localIssues, remote.issues.issues, "이슈");

    console.log("\n🔍 마일스톤 차이 분석:");
    printDiff(localMs, remote.milestones.milestones, "마일스톤");
}

module.exports = { showDiff };