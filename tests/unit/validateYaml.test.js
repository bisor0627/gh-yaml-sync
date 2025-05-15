const { readAndValidateYaml } = require("../../src/utils/validateYaml");
const path = require("path");

test("유효한 이슈 YAML은 통과해야 함", () => {
    const validPath = path.join(__dirname, "../fixtures/valid-issues.yaml");
    expect(() => readAndValidateYaml(validPath, path.join(__dirname, "../../schemas/issues.schema.json"))).not.toThrow();
});

test("잘못된 이슈 YAML은 에러를 발생시켜야 함", () => {
    const invalidPath = path.join(__dirname, "../fixtures/invalid-issues.yaml");
    expect(() => readAndValidateYaml(invalidPath, path.join(__dirname, "../../schemas/issues.schema.json"))).toThrow(/YAML 형식 오류/);
});