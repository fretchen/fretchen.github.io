import type { X402Tool } from "../types/x402";

/**
 * The `generate_image` tool offered to the chat model, OpenAI function-calling shape.
 *
 * Identical to the object `scw_js/notebooks/sc_llm_x402_buyer.ipynb` and
 * `scw_js/imagegen-in-chat-plan_1.md` §2 exercise against the real backend — the same payload
 * is proven there before it ships here.
 *
 * `network`, `model`, `n`, `response_format`, `isListed` and `mode`/`referenceImage` are
 * deliberately absent: none is a model decision. `network` in particular is filled by the
 * frontend from the connected wallet's chain, not the model — an omitted network is how a
 * testnet run would end up paying real money on genimg's `exact` scheme.
 */
export const generateImageTool: X402Tool = {
  type: "function",
  function: {
    name: "generate_image",
    description:
      "Generate an image from a text prompt. Costs $0.07 USDC and requires the user to approve " +
      "a wallet signature. Only call when the user has clearly asked for an image.",
    parameters: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "Detailed English image prompt" },
        size: { type: "string", enum: ["1024x1024", "1792x1024"] },
      },
      required: ["prompt"],
    },
  },
};
