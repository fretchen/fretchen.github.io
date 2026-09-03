import { describe, it, expect, beforeAll } from "vitest";
import { execFileSync } from "node:child_process";
import { readFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import config from "../panda.config";

/**
 * `PageHeader` calls `sectionRule({ territory })` with a variable. Panda resolves recipe
 * variants statically, so before `staticCss` was configured it emitted only the `voice`
 * default: every `territory="explore"` page rendered `class="sectionRule
 * sectionRule--territory_explore"` with no matching rule, i.e. a transparent 48x3px block.
 * Nothing failed — the class was there, the component rendered, tsc and every test passed.
 *
 * This asserts the *generated stylesheet*, not the config, so it still holds if a Panda
 * upgrade changes what `staticCss` means. The cases come from the config so a new territory
 * is covered without anyone remembering to extend this file.
 */
const territories = Object.keys(
  (config.theme?.extend?.recipes?.sectionRule as { variants?: { territory?: Record<string, unknown> } })?.variants
    ?.territory ?? {},
);

describe("territory rule CSS", () => {
  let css: string;

  beforeAll(() => {
    const outfile = join(mkdtempSync(join(tmpdir(), "panda-cssgen-")), "styles.css");
    // No `--minimal`: it skips static CSS generation, which is the thing under test.
    execFileSync("npx", ["panda", "cssgen", "-o", outfile, "--silent"], {
      cwd: join(__dirname, ".."),
      stdio: "pipe",
    });
    css = readFileSync(outfile, "utf-8");
  }, 120_000);

  it("finds territory variants declared in the config", () => {
    expect(territories.length).toBeGreaterThan(0);
  });

  it.each(territories)("emits a painted rule for territory '%s'", (territory) => {
    const rule = css.match(new RegExp(`\\.sectionRule--territory_${territory}\\s*\\{([^}]*)\\}`));

    expect(
      rule,
      `No CSS rule for .sectionRule--territory_${territory}. PageHeader renders that class, so the rule is invisible. Cover it in staticCss in panda.config.ts.`,
    ).not.toBeNull();

    // The class existing is not enough — the symptom that shipped was a class with no paint.
    expect(rule![1], `.sectionRule--territory_${territory} has no background-color`).toMatch(/background-color:\s*\S+/);
  });
});
