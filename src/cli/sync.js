const { syncIssuesFromYaml, syncMilestonesFromYaml } = require("../utils/helpers");

function syncYamlToGitHub(options) {
  const { issues, milestones, repo } = options;
  const dryRun = !!options.dryRun;
  syncMilestonesFromYaml(milestones, repo, dryRun);
  syncIssuesFromYaml(issues, repo, dryRun);
}

module.exports = { syncYamlToGitHub };