# @fretchen/s3-utils

Minimal SigV4-signed S3 client for the fretchen.github.io Scaleway Object Storage bucket. Not a generic multi-provider S3 client — the endpoint is Scaleway-specific — but bucket and region are configurable via environment variables (see below), so other packages in this monorepo can point it at their own bucket instead of forking it.

## Why this exists instead of `@aws-sdk/client-s3` or `aws4fetch`

- `@aws-sdk/client-s3` bundles the full modular AWS SDK (credential-provider chain, STS, SSO, smithy runtime) even though every caller uses static env-var credentials against one fixed endpoint — multiple MB per deployed function for logic that's just GET/PUT.
- `aws4fetch`, the obvious minimal alternative, is unmaintained (last push 2024-12-06 at the time this package was written).
- This package implements the SigV4 signing algorithm directly using `node:crypto` (a Node builtin — zero bundle cost) and the native `fetch`. See `test/sigv4.test.ts` for correctness, validated against AWS's own officially published SigV4 test vector.

## Installation (as a local dependency in the monorepo)

```json
{
  "dependencies": {
    "@fretchen/s3-utils": "file:../shared/s3-utils"
  }
}
```

Rebuild this package (`npm run build`) before rebuilding a dependent package that picks up local changes.

## Usage

```ts
import { getS3Object, putS3Object, getS3BaseUrl } from "@fretchen/s3-utils";

const body = await getS3Object("growth-agent/content_queue.json"); // string | null (null on 404)

await putS3Object("images/pic.jpg", buffer, {
  contentType: "image/jpeg",
  acl: "public-read",
  cacheControl: "public, max-age=31536000, immutable",
});

getS3BaseUrl(); // "https://<bucket>.s3.<region>.scw.cloud/" — the canonical public base URL
```

## Configuration

| Variable         | Default         | Purpose                                |
| ---------------- | --------------- | -------------------------------------- |
| `SCW_ACCESS_KEY` | —               | Required. Scaleway access key.         |
| `SCW_SECRET_KEY` | —               | Required. Scaleway secret key.         |
| `SCW_S3_BUCKET`  | `my-imagestore` | Optional. Overrides the target bucket. |
| `SCW_S3_REGION`  | `nl-ams`        | Optional. Overrides the target region. |

`SCW_S3_BUCKET`/`SCW_S3_REGION` default to the values every current caller in this
monorepo already uses, so no deployment changes anywhere are needed for this package
to keep working exactly as before. A consumer that needs a different bucket or region
can point this package at one purely via its own env config, without forking the
client.

## Reliability

Requests retry up to 3 times (fixed, short exponential backoff) on a thrown network
error or a `5xx` response, re-signing fresh on every attempt. `4xx` responses are not
retried — they're deterministic (bad signature, missing key) and retrying would only
mask a real problem. Each request has a 10s timeout.
