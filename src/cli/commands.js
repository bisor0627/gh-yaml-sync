const { program } = require("commander");
const { syncYamlToGitHub } = require("./sync");
const { dumpGitHubToYaml } = require("./dump");
const { assignIssues } = require("./assign");

/**
 * CLI 하위 커맨드에서 throw-된 에러를 잡아
 * 메시지만 출력하고 즉시 종료(exit code 1)
 */
function processCLI(fn) {
  return async (options, ...args) => {
    try {
      await fn(options, ...args);        // 원래 로직 실행
    } catch (err) {
      console.error(err.message);        // 간결 메시지
      process.exit(1);                   // CI·셸에서 실패 인지
    }
  };
}

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
    .option("--dry-run", "Print changes without applying them")
    .action(processCLI(syncYamlToGitHub));

  program
    .command("dump")
    .description("Dump issues and milestones from GitHub to YAML")
    .requiredOption("--issues <path>", "Path to save issues.yaml")
    .requiredOption("--milestones <path>", "Path to save milestones.yaml")
    .requiredOption("--repo <owner/repo>", "GitHub repository (e.g., user/repo)")
    .action(processCLI(dumpGitHubToYaml));

  program
    .command("assign")
    .description("Assign issues to milestones")
    .requiredOption("--issues <path>", "Path to issues.yaml")
    .requiredOption("--repo <owner/repo>", "GitHub repository (e.g., user/repo)")
    .action(processCLI(assignIssues));

  program.parse();
}

module.exports = { runCLI };