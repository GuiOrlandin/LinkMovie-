# LinkMovie — Infra & messaging story (LinkedIn draft)

Working notes for a LinkedIn post after the study. Grounded in ADRs 0001–0005 and SPEC §4. Polish in **T29**.

## One-liner

I built LinkMovie as a study fullstack: upload large videos with **S3-style multipart**, process them asynchronously on a **work queue**, and share them with short links — all on a single **Docker Compose** stack.

## Why this stack

| Piece | Choice | Why (study-facing) |
|-------|--------|--------------------|
| Monorepo | pnpm + Nest **Api** + Nest **Worker** + `shared` | Same language/DI model; forbidden Api↔Worker imports make process boundaries obvious |
| System of record | **Postgres** + Prisma | Familiar relational model for Video / UploadSession / MediaJob / Thumbnail / ShortLink |
| Object storage | **MinIO** (S3 API) | Local S3 contract without AWS/LocalStack; practice multipart + presigned PUT/GET |
| Broker | **RabbitMQ** (management image) | Practice exchange→queue, ack/prefetch, DLX — not Kafka partitions/offsets |
| Schema gate | Compose **`migrate`** (`prisma migrate deploy`) | Deployables only start after schema is applied |

## MinIO — why not “upload through the API”

Large files must not stream through Nest. The Api only:

1. Starts multipart (`CreateMultipartUpload`)
2. Presigns part **PUT**s for the browser
3. Completes/aborts with ETags
4. Later issues short-lived **GET** URLs for playback

MinIO speaks the S3 API, so the same AWS SDK v3 code path teaches transferable cloud skills. Trade-off accepted for the study: incomplete multipart cleanup is an ops/Api concern (MinIO lifecycle quirks vs AWS).

## RabbitMQ — why not Kafka

The workload is **task dispatch** (GenerateThumbnails, GenerateTitle), not a retained event log for many independent consumers.

RabbitMQ fits the learning goals:

- Direct exchange `media.jobs` → per-type queues
- Competing consumers on the Worker, `prefetch=1`
- Manual ack
- Bounded retries, then **DLX** for poison messages

Kafka would excel at replayable streams and consumer groups; that was out of scope for this study’s “work-queue core.”

## Message contract (keep small)

Payload stays identity-only:

```json
{ "mediaJobId": "...", "videoId": "...", "type": "GenerateThumbnails" | "GenerateTitle" }
```

The Worker loads object keys and metadata from Postgres. That keeps messages stable and avoids embedding storage details in the broker.

## Compose topology (what `docker compose up` teaches)

```text
web ──HTTP──► api ──► Postgres
               │         MinIO
               │         RabbitMQ
               └──publish──► worker ──GET/PUT──► MinIO
migrate runs prisma migrate deploy before api/worker (when apps profile is on)
```

Default profile: Postgres + MinIO + RabbitMQ + migrate. Profile `apps`: stub Api/Worker/web env wiring (full images later).

## Talking points for the post

1. **Separation of concerns:** HTTP process publishes; Worker consumes — no shared in-process job loop.
2. **Ports & adapters:** object storage and messaging behind ports in `shared` (implementation follows in later tasks).
3. **Honest study trade-offs:** no auth, no outbox, single-node broker, ephemeral RabbitMQ data, MinIO instead of real S3.
4. **What I’d change in production:** outbox/idempotent consumers at scale, real object lifecycle policies, managed broker, secrets, observability.

## Sources

- `docs/architecture/SPEC.md` §4
- ADR 0001 (RabbitMQ), 0002 (Nest boundaries), 0003 (MinIO multipart), 0005 (topology)
