# @fretchen/s3-utils

Minimal SigV4-signed S3 client for the fretchen.github.io Scaleway Object Storage bucket (`my-imagestore`, region `nl-ams`). Not a generic S3 client — bucket and region are fixed constants, matching every current call site in this monorepo.

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
import { getS3Object, putS3Object } from "@fretchen/s3-utils";

const body = await getS3Object("growth-agent/content_queue.json"); // string | null (null on 404)

await putS3Object("images/pic.jpg", buffer, {
  contentType: "image/jpeg",
  acl: "public-read",
  cacheControl: "public, max-age=31536000, immutable",
});
```

Credentials are read from `SCW_ACCESS_KEY` / `SCW_SECRET_KEY` environment variables.
