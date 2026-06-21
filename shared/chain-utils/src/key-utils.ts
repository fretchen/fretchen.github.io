export function loadPrivateKey(raw: string | undefined): `0x${string}` {
  if (!raw) throw new Error("NFT_WALLET_PRIVATE_KEY not configured");
  const hex = raw.replace(/^0x/i, "");
  if (!/^[0-9a-fA-F]{64}$/.test(hex))
    throw new Error("NFT_WALLET_PRIVATE_KEY invalid: must be 64 hex characters");
  return `0x${hex}`;
}
