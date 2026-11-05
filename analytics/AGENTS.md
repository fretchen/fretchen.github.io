# analytics — agent rules

Serverless pageview counter (Scaleway Function, S3-backed). See [`README.md`](./README.md)
for the API (`POST /hit`, `GET /stats`), the data model, local servers and deployment.

Public env values go in `env:` in `serverless.yml`; secrets are configured in the Scaleway
Console only. All responses include CORS headers.
