import { sepolia, optimism, optimismSepolia } from "wagmi/chains";
import type { Chain } from "wagmi/chains";

/**
 * Gibt das entsprechende Chain-Objekt basierend auf der CHAIN-Umgebungsvariable zurück
 * @returns Das Chain-Objekt aus wagmi/chains
 */
export function getChain(): Chain {
  // Environmentvariable lesen, Fallback auf 'mainnet'
  const chainName = process.env.CHAIN?.toLowerCase() || "optimism";

  // Chain-Objekt je nach Umgebungsvariable auswählen
  switch (chainName) {
    case "sepolia":
      return sepolia;
    case "optimism":
      return optimism;
    case "optimismSepolia":
      return optimismSepolia;
    default:
      console.warn(`Unbekannte Chain "${chainName}" - verwende optimism als Fallback`);
      return optimism;
  }
}
