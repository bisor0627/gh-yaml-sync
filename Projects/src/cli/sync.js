const { syncIssuesFromYaml, syncMilestonesFromYaml } = require("../utils/helpers");

function syncYamlToGitHub(options) {
  const { issues, milestones, repo } = options;
  syncMilestonesFromYaml(milestones, repo); // ← 마일스톤 먼저!
  syncIssuesFromYaml(issues, repo);
}

module.exports = { syncYamlToGitHub };