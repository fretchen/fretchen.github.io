/**
 * TEMPORARY SigV4 spike (plan Task 3) — deleted again once the channel-storage port is
 * proven on bunny. Proves @fretchen/s3-utils works under Deno's `node:crypto` compat
 * (what bunny's isolate also runs): one put, one read-back, one delete against the real
 * Scaleway Object Storage bucket, under a throwaway prefix.
 *
 * Run: deno run -A --env-file=.env scripts/sigv4_probe.ts
 */
import { deleteS3Object, getS3Object, putS3Object } from "@fretchen/s3-utils";

const key = "bunny-spike/sigv4-probe.json";
const payload = JSON.stringify({ probe: "bunny_js", ts: Date.now() });

await putS3Object(key, payload, { contentType: "application/json" });
const readBack = await getS3Object(key);
if (readBack !== payload) {
  console.error("read-back mismatch:", readBack);
  process.exit(1);
}

await deleteS3Object(key);
const afterDelete = await getS3Object(key);
if (afterDelete !== null) {
  console.error("delete failed, object still readable");
  process.exit(1);
}

console.log("SigV4 probe OK: put + read-back + delete against the real bucket");
