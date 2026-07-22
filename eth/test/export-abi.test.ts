import { describe, it, after } from "node:test";
import assert from "node:assert";
import fs from "fs";
import os from "os";
import path from "path";
import { exportContractABI } from "../scripts/export-abi";

/**
 * Regression coverage for the ESM `__dirname` shim in export-abi.ts: this script
 * previously threw `ReferenceError: __dirname is not defined` for every contract
 * once eth/package.json set "type": "module" (native ESM has no CommonJS __dirname).
 */
describe("export-abi.ts - exportContractABI", () => {
  const tmpDirs: string[] = [];

  after(() => {
    for (const dir of tmpDirs) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("does not throw ReferenceError when using the real default __dirname-based paths", () => {
    // No dirs override — exercises the exact `path.join(__dirname, ...)` line that
    // crashed before the fix. A missing contract is expected to fail gracefully
    // (return false), not throw.
    const result = exportContractABI({
      name: "DoesNotExist",
      contractFile: "DoesNotExist.sol",
      contractName: "DoesNotExist",
      description: "Regression fixture — intentionally has no compiled artifact",
    });

    assert.strictEqual(result, false);
  });

  it("writes ABI json/ts/summary files for a contract with a valid artifact", () => {
    const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "export-abi-test-"));
    tmpDirs.push(tmpRoot);

    const artifactsRoot = path.join(tmpRoot, "artifacts");
    const exportRoot = path.join(tmpRoot, "abi");

    const fakeAbi = [
      {
        type: "function",
        name: "foo",
        inputs: [],
        outputs: [{ type: "uint256" }],
        stateMutability: "view",
      },
    ];
    const artifactDir = path.join(artifactsRoot, "Fake.sol");
    fs.mkdirSync(artifactDir, { recursive: true });
    fs.writeFileSync(path.join(artifactDir, "Fake.json"), JSON.stringify({ abi: fakeAbi }));

    const result = exportContractABI(
      {
        name: "Fake",
        contractFile: "Fake.sol",
        contractName: "Fake",
        description: "Regression fixture contract",
      },
      { artifactsRoot, exportRoot },
    );

    assert.notStrictEqual(result, false);
    if (result === false) return; // unreachable, narrows type for TS

    assert.ok(fs.existsSync(result.jsonPath));
    assert.ok(fs.existsSync(result.tsPath));
    assert.ok(fs.existsSync(result.summaryPath));

    const writtenAbi = JSON.parse(fs.readFileSync(result.jsonPath, "utf8"));
    assert.deepStrictEqual(writtenAbi, fakeAbi);

    const tsContent = fs.readFileSync(result.tsPath, "utf8");
    assert.match(tsContent, /export const FakeABI/);
  });
});
