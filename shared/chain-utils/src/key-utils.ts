// Minimal type shim — avoids taking @types/node as a library dependency.
declare const process: { env: Record<string, string | undefined> };

export function loadPrivateKey(envVarName: string): `0x${string}` {
  const raw = process.env[envVarName];
  const trimmed = raw?.trim();
  if (!trimmed) throw new Error(`${envVarName} not configured`);
  const hex = trimmed.replace(/^0x/i, "");
  if (!/^[0-9a-fA-F]{64}$/.test(hex))
    throw new Error(`${envVarName} invalid: must be 64 hex characters`);
  return `0x${hex}`;
}
