const { dumpIssues, dumpMilestones } = require("../utils/helpers");

function dumpGitHubToYaml(options) {
  const { issues, milestones, repo } = options;
  dumpIssues(issues, repo);         
  dumpMilestones(milestones, repo); 
}

module.exports = { dumpGitHubToYaml };