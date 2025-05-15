const Ajv        = require("ajv");
const addFormats = require("ajv-formats");
const fs         = require("fs");
const yaml       = require("js-yaml");
const path       = require("path");

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

/**
 * YAML을 읽어 스키마 검증 후 JS 객체 반환
 * @param {string} filePath - YAML 파일 경로
 * @param {string} schemaPath - JSON-Schema 경로
 * @returns {any}             - 파싱된 JS 객체
 * @throws {Error}            - 검증 실패 시
 */
function readAndValidateYaml(filePath, schemaPath) {
  const data = yaml.load(fs.readFileSync(filePath, "utf-8"));
  const schema = JSON.parse(fs.readFileSync(schemaPath, "utf-8"));
  const validate = ajv.compile(schema);

  if (!validate(data)) {
    const errors = validate.errors
      .map(e => `• ${e.instancePath || '(root)'} ${e.message}`)
      .join("\n");
    throw new Error(
      `❌ YAML 형식 오류 (${path.basename(filePath)})\n${errors}`
    );
  }
  return data;
}

module.exports = { readAndValidateYaml };