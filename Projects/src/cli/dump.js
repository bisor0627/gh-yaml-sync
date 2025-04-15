const { dumpIssues, dumpMilestones } = require("../utils/helpers");

function dumpGitHubToYaml(options) {
  const { issues, milestones } = options;
  dumpIssues(issues);
  dumpMilestones(milestones);
}

module.exports = { dumpGitHubToYaml };