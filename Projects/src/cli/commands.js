const { program } = require("commander");
const { syncYamlToGitHub } = require("./sync");
const { dumpGitHubToYaml } = require("./dump");
const { assignIssues } = require("./assign");

function runCLI() {
  program
    .name("gh-yaml-sync")
    .description("Sync GitHub issues/milestones from YAML")
    .version("1.0.0");

  program
    .command("sync")
    .description("Sync issues and milestones from YAML to GitHub")
    .requiredOption("--issues <path>", "Path to issues.yaml")
    .requiredOption("--milestones <path>", "Path to milestones.yaml")
    .requiredOption("--repo <owner/repo>", "GitHub repository (e.g., user/repo)")
    .action(syncYamlToGitHub);

  program
    .command("dump")
    .description("Dump issues and milestones from GitHub to YAML")
    .requiredOption("--issues <path>", "Path to save issues.yaml")
    .requiredOption("--milestones <path>", "Path to save milestones.yaml")
    .requiredOption("--repo <owner/repo>", "GitHub repository (e.g., user/repo)")
    .action(dumpGitHubToYaml);

  program
    .command("assign")
    .description("Assign issues to milestones")
    .requiredOption("--issues <path>", "Path to issues.yaml")
    .requiredOption("--repo <owner/repo>", "GitHub repository (e.g., user/repo)")
    .action(assignIssues);

  program.parse();
}

module.exports = { runCLI };