import { getGenAiNFTMainnetNetworks, getGenAiNFTTestnetNetworks } from "@fretchen/chain-utils";

export function getExpectedNetworks(sepoliaTest: boolean): readonly string[] {
  return sepoliaTest ? getGenAiNFTTestnetNetworks() : getGenAiNFTMainnetNetworks();
}

export type NetworkValidationResult =
  | { valid: true }
  | { valid: false; reason: string; expected?: readonly string[]; received?: string };

/**
 * Is this a network the endpoint can be paid on — that is, one where GenImNFT is deployed?
 *
 * Deliberately NOT a production/test boundary, despite once looking like one. It used to take a
 * `sepoliaTest` flag and reject cross-mode payments, but its only caller derived that flag from
 * the client's own network (`isTestnet(clientNetwork)`), so the expected set always contained the
 * received value and both cross-mode branches were unreachable. It read as a guard without being
 * one. What actually stops a testnet payment from buying real work is the mock-image path in
 * `genimg_x402_token.ts`, which keys off `isTestnet()` directly.
 */
export function validatePaymentNetwork(clientNetwork: string | undefined): NetworkValidationResult {
  if (!clientNetwork) {
    return { valid: false, reason: "missing_network" };
  }

  const expected = [...getExpectedNetworks(false), ...getExpectedNetworks(true)];

  if (!expected.includes(clientNetwork)) {
    return {
      valid: false,
      reason: "unsupported_network",
      expected,
      received: clientNetwork,
    };
  }

  return { valid: true };
}
