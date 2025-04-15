const { assignIssuesToMilestones } = require("../utils/helpers");

function assignIssues(options) {
  const { issues, repo } = options;
  assignIssuesToMilestones(issues, repo);
}

module.exports = { assignIssues };