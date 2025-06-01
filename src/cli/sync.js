const {
  syncIssuesFromYaml,
  syncMilestonesFromYaml,
  dumpCurrentStateToYaml,
  rollbackChanges
} = require("../utils/helpers");

function syncYamlToGitHub(options) {
  const { issues, milestones, repo } = options;
  const dryRun = !!options.dryRun;

  const rollbackState = { issues: [], milestones: [] };

  try {
    if (milestones) {
      syncMilestonesFromYaml(milestones, repo, dryRun, rollbackState);
    }
    if (issues) {
      syncIssuesFromYaml(issues, repo, dryRun, rollbackState);
    }
    if (!dryRun && (issues || milestones)) {
      console.log("📝 리모트 기준으로 YAML을 덮어씁니다...");
      dumpCurrentStateToYaml(issues, milestones, repo);
    }
  } catch (err) {
    console.error("💥 오류 발생, 롤백을 시작합니다...");
    rollbackChanges(rollbackState, repo);
    throw err;
  }
}

module.exports = { syncYamlToGitHub };