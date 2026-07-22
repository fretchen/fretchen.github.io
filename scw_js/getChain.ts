import { getGenAiNFTMainnetNetworks, getGenAiNFTTestnetNetworks } from "@fretchen/chain-utils";

export function getExpectedNetworks(sepoliaTest: boolean): readonly string[] {
  return sepoliaTest ? getGenAiNFTTestnetNetworks() : getGenAiNFTMainnetNetworks();
}

export type NetworkValidationResult =
  | { valid: true }
  | { valid: false; reason: string; expected?: readonly string[]; received?: string };

export function validatePaymentNetwork(
  clientNetwork: string | undefined,
  sepoliaTest = false,
): NetworkValidationResult {
  if (!clientNetwork) {
    return { valid: false, reason: "missing_network" };
  }

  const expectedNetworks = getExpectedNetworks(sepoliaTest);

  if (!expectedNetworks.includes(clientNetwork)) {
    const allNetworks = [...getExpectedNetworks(false), ...getExpectedNetworks(true)];

    if (allNetworks.includes(clientNetwork)) {
      return {
        valid: false,
        reason: sepoliaTest ? "invalid_network_for_test_mode" : "invalid_network_for_production",
        expected: expectedNetworks,
        received: clientNetwork,
      };
    }

    return {
      valid: false,
      reason: "unsupported_network",
      expected: expectedNetworks,
      received: clientNetwork,
    };
  }

  return { valid: true };
}
