const {
  syncIssuesFromYaml,
  syncMilestonesFromYaml,
  dumpCurrentStateToYaml
} = require("../utils/helpers");

function syncYamlToGitHub(options) {
  const { issues, milestones, repo } = options;
  const dryRun = !!options.dryRun;
  syncMilestonesFromYaml(milestones, repo, dryRun);
  syncIssuesFromYaml(issues, repo, dryRun);
  // 변경 반영 이후 최신 상태를 덮어씌움
  if (!dryRun) {
    console.log("📝 리모트 기준으로 YAML을 덮어씁니다...");
    dumpCurrentStateToYaml(issues, milestones, repo);
  }
}

module.exports = { syncYamlToGitHub };