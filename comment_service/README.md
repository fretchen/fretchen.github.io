# Comment Service

Serverless blog comment backend for [fretchen.eu](https://www.fretchen.eu).  
Deployed as a **Scaleway Function** (Node 22) – comments are stored as JSON objects in Scaleway S3 and an email notification is sent via Scaleway TEM on every new submission.

## Features

| Feature                     | Details                                                                                                      |
| --------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Anonymous comments**      | No login required; optional display name (default "Anonymous")                                               |
| **Honeypot spam detection** | Hidden `website` field – filled submissions are stored with `suspectedAgent: true` and capped at 10 per page |
| **Rate limiting**           | 3 comments / minute / IP (in-memory, resets on cold start)                                                   |
| **Email notification**      | Via Scaleway Transactional Email; includes 🤖 warning for suspected agents                                   |
| **Input sanitisation**      | HTML tag stripping, length limits (name 100, text 2 000 chars)                                               |

## API

**Base URL** `https://comments-api.fretchen.eu`

### `GET /?page=/blog/my-post`

Returns `{ comments: Comment[] }` sorted oldest-first.

### `POST /`

```json
{ "name": "Alice", "text": "Great post!", "page": "/blog/my-post" }
```

Returns `201` with `{ comment: Comment }`.

### `OPTIONS /`

CORS preflight (origin `https://www.fretchen.eu`).

## Development

```bash
npm install
npm test              # run tests (vitest)
npm run test:coverage # with coverage report
npm run lint          # eslint
npm run build         # tsup → dist/
```

## Deployment

Secrets (`SCW_ACCESS_KEY`, `SCW_SECRET_KEY`, `NOTIFICATION_EMAIL`) must be set in the Scaleway Console.

```bash
npm run deploy        # serverless deploy
```

## Environment variables

| Variable             | Scope  | Description                         |
| -------------------- | ------ | ----------------------------------- |
| `SCW_ACCESS_KEY`     | secret | Scaleway API / S3 credential        |
| `SCW_SECRET_KEY`     | secret | Scaleway API / S3 credential        |
| `NOTIFICATION_EMAIL` | secret | Recipient for comment notifications |
