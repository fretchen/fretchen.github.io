/**
 * The assistant's system prompts, loaded from `website/prompts/*.md`.
 *
 * Those files follow the same shape as the SKILL.md files in `.agents/skills/` — YAML frontmatter
 * (`name`, `description`) above a markdown body — because a prompt is an agent-skill-style
 * artifact, not user-facing copy: like `utils/dateContext.ts` and the tool `description`s
 * in `tools/*.ts`, it is an instruction to the model, in English, and therefore does not
 * belong in `locales/`. (The German locale gets an injected answer-in-German sentence
 * instead of translated prompts — see `utils/languageContext.ts`.)
 *
 * `?raw` inlines each file as a string constant at build time: no runtime fetch, no
 * markdown transform — the same runtime profile the old `locales/en.ts` string literals
 * had, except these bytes ship only with the chat's chunk instead of the shared locale
 * bundle. The one-time frontmatter parse below runs when this module initializes.
 *
 * Frontmatter is stripped here and never reaches the wire: the system prompt is input
 * tokens on every hop of a turn (see the chat-tools skill), and the `name`/`description`
 * are maintainer metadata, not model input.
 */

export interface PromptFile {
  name: string;
  description: string;
  body: string;
}

/**
 * Strict single-purpose frontmatter parser: exactly `name` and `description` as single-line
 * values, between the opening and closing `---`. Anything else throws with the source path,
 * so a malformed file fails at import time — in dev, in the build, and in the test suite —
 * rather than silently shipping its frontmatter as prompt text.
 */
export function parsePromptFile(raw: string, source: string): PromptFile {
  const lines = raw.split("\n");
  if (lines[0] !== "---") throw new Error(`Prompt file ${source}: missing opening ---`);
  const closing = lines.indexOf("---", 1);
  if (closing === -1) throw new Error(`Prompt file ${source}: missing closing ---`);

  const fields = new Map<string, string>();
  for (const line of lines.slice(1, closing)) {
    const match = /^([a-zA-Z]+): (.+)$/.exec(line);
    if (!match) throw new Error(`Prompt file ${source}: malformed frontmatter line "${line}"`);
    if (fields.has(match[1])) throw new Error(`Prompt file ${source}: duplicate field "${match[1]}"`);
    fields.set(match[1], match[2]);
  }
  if (fields.size !== 2 || !fields.has("name") || !fields.has("description")) {
    throw new Error(`Prompt file ${source}: expected exactly name and description`);
  }
  for (const [key, value] of fields) {
    if (!value.trim()) throw new Error(`Prompt file ${source}: empty ${key}`);
  }

  const body = lines.slice(closing + 1).join("\n").trim();
  if (!body) throw new Error(`Prompt file ${source}: empty body`);

  return { name: fields.get("name")!, description: fields.get("description")!, body };
}

import toolContractRaw from "../prompts/tool-contract.md?raw";
import teenRaw from "../prompts/teen.md?raw";
import researchRaw from "../prompts/research.md?raw";

export const toolContractPrompt = parsePromptFile(toolContractRaw, "prompts/tool-contract.md");
export const teenPrompt = parsePromptFile(teenRaw, "prompts/teen.md");
export const researchPrompt = parsePromptFile(researchRaw, "prompts/research.md");
