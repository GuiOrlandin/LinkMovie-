# LinkMovie Study Tasks

**Design**: `.specs/features/linkmovie-study/design.md`
**Spec**: `.specs/features/linkmovie-study/spec.md`
**Status**: Draft

---

## Execution Plan

### Phase 1: Foundation (Sequential)

```
T1 → T2 → T3 → T4 → T5
```

### Phase 2: Shared adapters (Parallel after T5)

```
T5 ──┬→ T6 [P]
     └→ T7 [P]
          └──→ T8
```

### Phase 3: Upload Api (Sequential)

```
T8 → T9 → T10 → T11 → T12 → T13
```

### Phase 4: MediaJobs (Sequential after topology; handlers parallel)

```
T13 → T14 → T15 ──┬→ T16 [P]
                  └→ T17 [P]
                       └──→ T18 → T19
```

### Phase 5: Playback + ShortLink (Parallel OK after T13 for read paths; ShortLink after upload complete semantics)

```
T13 ──┬→ T20 [P]
      └→ T21 [P]
T21 → T22
```

(T20/T21 may start after T13; T22 depends on T21.)

### Phase 6: Web SPA

```
T23 → T24 → T25 → T26 → T27
```

### Phase 7: Wire Compose

```
T5 + T27 → T28
```

---

## Task Breakdown

### T1: Scaffold pnpm workspace + Nest apps

**What**: Create monorepo root (`pnpm-workspace.yaml`, root `package.json`, tsconfig base) with Nest apps `api` and `worker` and package `shared`.
**Where**: `/` (workspace), `apps/api`, `apps/worker`, `packages/shared`
**Depends on**: None
**Reuses**: ADR 0002
**Requirement**: LM-01

**Tools**:

- MCP: Context7 (NestJS monorepo / pnpm)
- Skill: NONE

**Done when**:

- [x] `pnpm install` succeeds
- [x] `api` and `worker` bootstrap empty Nest apps
- [x] `shared` is a buildable TS package depended on by both apps
- [x] Gate check passes: `pnpm -r build`

**Tests**: none
**Gate**: build

**Commit**: `chore: scaffold pnpm nest monorepo`

---

### T2: Add domain enums and ID types in shared

**What**: Define Video/UploadSession/MediaJob status enums and branded/string ID types per CONTEXT.md.
**Where**: `packages/shared/src/domain/`
**Depends on**: T1
**Reuses**: `CONTEXT.md`, ADR 0006
**Requirement**: LM-03

**Tools**:

- MCP: NONE
- Skill: `/tdd`

**Done when**:

- [x] Enums match ADR 0006 exactly
- [x] Types exported from `shared`
- [x] Gate check passes: `pnpm --filter shared test`
- [x] Test count: ≥1 tests pass (no silent deletions)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(shared): add domain enums and ids`

---

### T3: Add Prisma schema for core entities

**What**: Prisma schema for Video, UploadSession, MediaJob, Thumbnail, ShortLink with relations, unique `(videoId, ordinal)`, unique ShortLink `code`.
**Where**: `packages/shared/prisma/schema.prisma`
**Depends on**: T2
**Reuses**: SPEC §7, ADR 0006
**Requirement**: LM-03

**Tools**:

- MCP: NONE
- Skill: NONE (Prisma CLI skills OK)

**Done when**:

- [ ] All five models present with statuses as enums/strings aligned to domain
- [ ] `prisma validate` passes
- [ ] Gate check passes: `pnpm --filter shared exec prisma validate`

**Tests**: none
**Gate**: prisma

**Commit**: `feat(shared): add prisma schema`

---

### T4: Initial Prisma migration + client export

**What**: Create initial migration and export PrismaClient module/helper from `shared`.
**Where**: `packages/shared/prisma/migrations/`, `packages/shared/src/archive/prisma/`
**Depends on**: T3
**Reuses**: T3 schema
**Requirement**: LM-03

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Migration folder exists and applies cleanly against Postgres
- [x] Api/Worker can import Prisma client from `shared`
- [x] Gate check passes: `pnpm -r build`

**Tests**: none
**Gate**: build

**Commit**: `feat(shared): prisma migrate init and client`

---

### T5: Docker Compose infra + migrate service

**What**: Compose file with Postgres, MinIO, RabbitMQ (management), `migrate` (`prisma migrate deploy`), and stubs for api/worker/web env wiring.
**Where**: `docker-compose.yml`, Dockerfiles as needed
**Depends on**: T4
**Reuses**: SPEC §4, ADR 0002
**Requirement**: LM-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `docker compose config` is valid
- [ ] Postgres, MinIO, RabbitMQ, migrate services defined
- [ ] migrate runs `prisma migrate deploy` before deployables

**Tests**: none
**Gate**: build

**Commit**: `chore: add compose stack with migrate`

---

### T6: ObjectStoragePort + S3/MinIO adapter [P]

**What**: Port + AWS SDK v3 adapter for multipart create/presign/complete/abort/listParts, GetObject, PutObject, presign GET.
**Where**: `packages/shared/src/ports/object-storage.ts`, `packages/shared/src/infra/s3/`
**Depends on**: T5
**Reuses**: ADR 0003
**Requirement**: LM-04, LM-05, LM-15

**Tools**:

- MCP: Context7 (AWS SDK v3 S3)
- Skill: `/tdd`

**Done when**:

- [ ] Port methods cover ADR 0003 operations used by Api/Worker
- [ ] Adapter unit-tested with mocked S3 client
- [ ] Gate check passes: `pnpm --filter shared test`
- [ ] Test count: ≥3 tests pass (no silent deletions)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(shared): add s3 object storage adapter`

---

### T7: RabbitMQ topology helper + publisher port [P]

**What**: Declare exchange/queues/DLX per ADR 0005; `MediaJobPublisherPort` + amqplib publisher.
**Where**: `packages/shared/src/infra/rabbitmq/`, `packages/shared/src/ports/media-job-publisher.ts`
**Depends on**: T5
**Reuses**: ADR 0001, ADR 0005
**Requirement**: LM-09

**Tools**:

- MCP: Context7 (amqplib)
- Skill: `/tdd`

**Done when**:

- [ ] Topology names match ADR 0005 table exactly
- [ ] Publisher sends JSON `{ mediaJobId, videoId, type }`
- [ ] Unit tests with mocked channel
- [ ] Gate check passes: `pnpm --filter shared test`
- [ ] Test count: ≥2 tests pass (no silent deletions)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(shared): add rabbitmq topology and publisher`

---

### T8: Wire shared Nest modules into api and worker

**What**: Nest modules registering Prisma, ObjectStorage, RabbitMQ publisher (Api) / connection (Worker); both declare topology on boot.
**Where**: `apps/api/src/`, `apps/worker/src/`, `packages/shared/src/infra/nest/`
**Depends on**: T6, T7
**Reuses**: T6, T7
**Requirement**: LM-01, LM-09

**Tools**:

- MCP: Context7 (NestJS modules)
- Skill: NONE

**Done when**:

- [ ] Api boots and declares topology (no consume loop)
- [ ] Worker boots as standalone Nest app and declares topology
- [ ] No Api↔Worker cross-imports
- [ ] Gate check passes: `pnpm -r build`

**Tests**: none
**Gate**: build

**Commit**: `feat: wire shared infra modules into api and worker`

---

### T9: partSize helper

**What**: Pure function choosing multipart `partSize` from file size within S3 limits.
**Where**: `packages/shared/src/domain/part-size.ts`
**Depends on**: T2
**Reuses**: SPEC §9 limits
**Requirement**: LM-04

**Tools**:

- MCP: NONE
- Skill: `/tdd`

**Done when**:

- [ ] Respects 5 MiB–5 GiB part rules and ≤10_000 parts for sizes up to 2 GiB
- [ ] Gate check passes: `pnpm --filter shared test`
- [ ] Test count: ≥3 tests pass (no silent deletions)

**Tests**: unit
**Gate**: quick

**Note**: May run after T2 in parallel with later foundation work; listed here because Upload phase consumes it. If executing early, Depends on = T2 only.

**Commit**: `feat(shared): add partSize helper`

---

### T10: POST /videos create UploadSession

**What**: Endpoint creates Video `UPLOADING` + UploadSession `IN_PROGRESS`, CreateMultipartUpload, returns VideoId, UploadToken, uploadId, object key, partSize.
**Where**: `apps/api/src/videos/`, `apps/api/src/uploads/`
**Depends on**: T8, T9
**Reuses**: ADR 0004
**Requirement**: LM-04

**Tools**:

- MCP: NONE
- Skill: `/tdd`

**Done when**:

- [ ] Happy path e2e with mocked S3 + DB (or test DB)
- [ ] Rejects non-`video/mp4` / oversize per Spec limits
- [ ] Gate check passes: `pnpm --filter api test`
- [ ] Test count: ≥2 tests pass (no silent deletions)

**Tests**: e2e
**Gate**: full (api package)

**Commit**: `feat(api): post videos start multipart session`

---

### T11: Presign part + resume ListParts

**What**: `POST /uploads/{token}/parts` and `GET /uploads/{token}` per ADR 0004.
**Where**: `apps/api/src/uploads/`
**Depends on**: T10
**Reuses**: ADR 0003, ADR 0004
**Requirement**: LM-05, LM-06

**Tools**:

- MCP: NONE
- Skill: `/tdd`

**Done when**:

- [ ] Presign returns URL for partNumber+uploadId
- [ ] GET maps ListParts for resume
- [ ] Unknown/ABORTED token → appropriate 4xx
- [ ] Gate check passes: `pnpm --filter api test`
- [ ] Test count: ≥2 tests pass (no silent deletions)

**Tests**: e2e
**Gate**: full (api package)

**Commit**: `feat(api): upload part presign and resume`

---

### T12: Complete multipart + enqueue MediaJobs

**What**: `POST /uploads/{token}/complete` completes S3 multipart; session COMPLETED; Video PROCESSING; insert both MediaJobs PENDING; commit; publish; idempotent complete.
**Where**: `apps/api/src/uploads/`
**Depends on**: T11
**Reuses**: ADR 0004, ADR 0005, ADR 0006
**Requirement**: LM-07

**Tools**:

- MCP: NONE
- Skill: `/tdd`

**Done when**:

- [ ] Creates GenerateThumbnails + GenerateTitle rows before publish
- [ ] Idempotent: already COMPLETED does not duplicate jobs; republishes PENDING only if needed
- [ ] Gate check passes: `pnpm --filter api test`
- [ ] Test count: ≥3 tests pass (no silent deletions)

**Tests**: e2e
**Gate**: full (api package)

**Commit**: `feat(api): complete upload and enqueue media jobs`

---

### T13: Abort UploadSession

**What**: `POST /uploads/{token}/abort` → AbortMultipartUpload, session ABORTED, Video remains UPLOADING.
**Where**: `apps/api/src/uploads/`
**Depends on**: T11
**Reuses**: ADR 0004, ADR 0006
**Requirement**: LM-08

**Tools**:

- MCP: NONE
- Skill: `/tdd`

**Done when**:

- [ ] Abort is terminal; no MediaJob publish
- [ ] Video status unchanged (`UPLOADING`)
- [ ] Gate check passes: `pnpm --filter api test`
- [ ] Test count: ≥1 tests pass (no silent deletions)

**Tests**: e2e
**Gate**: full (api package)

**Commit**: `feat(api): abort upload session`

---

### T14: Worker consumer loop (ack, prefetch, retry/DLX)

**What**: Worker consumes both queues with prefetch=1, manual ack, retry up to 3 then FAILED + reject to DLX; terminal jobs ack no-op.
**Where**: `apps/worker/src/messaging/`
**Depends on**: T8, T12
**Reuses**: ADR 0005
**Requirement**: LM-09

**Tools**:

- MCP: NONE
- Skill: `/tdd`

**Done when**:

- [ ] Sets RUNNING at handler start
- [ ] Idempotent on terminal statuses
- [ ] Exhausted retries → FAILED + DLX path covered by unit tests
- [ ] Gate check passes: `pnpm --filter worker test`
- [ ] Test count: ≥3 tests pass (no silent deletions)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(worker): media job consumer with retry and dlx`

---

### T15: FfmpegPort + frame seek helper

**What**: Port for probe/extract; pure seek clamp helper for 10/50/90%; temp file cleanup contract.
**Where**: `packages/shared/src/ports/ffmpeg.ts`, `packages/shared/src/domain/thumbnail-seek.ts`, Worker adapter
**Depends on**: T2
**Reuses**: ADR 0007
**Requirement**: LM-10

**Tools**:

- MCP: NONE
- Skill: `/tdd`

**Done when**:

- [ ] Seek clamp unit-tested
- [ ] Adapter shells to ffprobe/ffmpeg (flags may be provisional per Spec deferred)
- [ ] Gate check passes: `pnpm --filter shared test`
- [ ] Test count: ≥3 tests pass (no silent deletions)

**Tests**: unit
**Gate**: quick

**Note**: Can start after T2; must finish before T16.

**Commit**: `feat(shared): ffmpeg port and thumbnail seek helper`

---

### T16: GenerateThumbnails handler [P]

**What**: Handler downloads source, probes durationMs, writes 3 JPEGs to MinIO + Thumbnail upserts, SUCCEEDED all-or-nothing.
**Where**: `apps/worker/src/handlers/generate-thumbnails.ts`
**Depends on**: T14, T15
**Reuses**: ADR 0007
**Requirement**: LM-10

**Tools**:

- MCP: NONE
- Skill: `/tdd`

**Done when**:

- [ ] Keys `videos/{videoId}/thumbnails/{ordinal}.jpg`
- [ ] Upsert unique `(videoId, ordinal)`
- [ ] Partial failure fails job (no SUCCEEDED)
- [ ] Gate check passes: `pnpm --filter worker test`
- [ ] Test count: ≥2 tests pass (no silent deletions)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(worker): generate thumbnails handler`

---

### T17: GenerateTitle stub handler [P]

**What**: Stub sets `Video.title` and marks job SUCCEEDED (overwrite on re-run).
**Where**: `apps/worker/src/handlers/generate-title.ts`
**Depends on**: T14
**Reuses**: ADR 0005
**Requirement**: LM-11

**Tools**:

- MCP: NONE
- Skill: `/tdd`

**Done when**:

- [ ] Independent of Thumbnail success
- [ ] CAS promote SUCCEEDED only if PENDING|RUNNING
- [ ] Gate check passes: `pnpm --filter worker test`
- [ ] Test count: ≥1 tests pass (no silent deletions)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(worker): generate title stub handler`

---

### T18: Video aggregate promotion on job terminal

**What**: When a job becomes terminal and Video is PROCESSING, CAS to READY or FAILED per ADR 0006 rules.
**Where**: `packages/shared/src/domain/video-aggregate.ts` (+ called from Worker handlers)
**Depends on**: T16, T17
**Reuses**: ADR 0006
**Requirement**: LM-12

**Tools**:

- MCP: NONE
- Skill: `/tdd`

**Done when**:

- [ ] All terminal + no FAILED → READY
- [ ] Any FAILED → FAILED
- [ ] CANCELLED counts as terminal success for aggregate
- [ ] Already terminal Video → no-op
- [ ] Gate check passes: `pnpm --filter shared test`
- [ ] Test count: ≥4 tests pass (no silent deletions)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(shared): video aggregate promotion`

---

### T19: Cancel MediaJob endpoints

**What**: Cancel one and cancel-all PENDING|RUNNING; `409` if already terminal; no queue purge.
**Where**: `apps/api/src/media-jobs/`
**Depends on**: T12
**Reuses**: ADR 0005
**Requirement**: LM-13

**Tools**:

- MCP: NONE
- Skill: `/tdd`

**Done when**:

- [ ] Both routes from SPEC table work
- [ ] `409` on terminal
- [ ] Gate check passes: `pnpm --filter api test`
- [ ] Test count: ≥2 tests pass (no silent deletions)

**Tests**: e2e
**Gate**: full (api package)

**Commit**: `feat(api): cancel media jobs`

---

### T20: GET Video + playback-url [P]

**What**: `GET /videos/{videoId}` and playback presign; playable gate `409` / missing `404`.
**Where**: `apps/api/src/videos/`
**Depends on**: T8, T10
**Reuses**: ADR 0006, ADR 0003
**Requirement**: LM-14, LM-15

**Tools**:

- MCP: NONE
- Skill: `/tdd`

**Done when**:

- [ ] playable = status ∈ {PROCESSING, READY}
- [ ] Presigned GET for source object
- [ ] Gate check passes: `pnpm --filter api test`
- [ ] Test count: ≥2 tests pass (no silent deletions)

**Tests**: e2e
**Gate**: full (api package)

**Commit**: `feat(api): video get and playback url`

---

### T21: ShortLink code generator [P]

**What**: Cryptographically random 8-char base62 generator + insert retry ≤5 helper.
**Where**: `packages/shared/src/domain/short-link-code.ts`
**Depends on**: T2
**Reuses**: ADR 0008
**Requirement**: LM-16

**Tools**:

- MCP: NONE
- Skill: `/tdd`

**Done when**:

- [ ] Alphabet `0-9A-Za-z`, length 8
- [ ] Retry policy unit-tested
- [ ] Gate check passes: `pnpm --filter shared test`
- [ ] Test count: ≥2 tests pass (no silent deletions)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(shared): shortlink code generator`

---

### T22: ShortLink create + resolve 302

**What**: `POST /api/videos/{videoId}/short-links` and `GET /r/{code}` with `Cache-Control: no-store` / `Pragma: no-cache`.
**Where**: `apps/api/src/short-links/`
**Depends on**: T12, T20, T21
**Reuses**: ADR 0008
**Requirement**: LM-16, LM-17

**Tools**:

- MCP: NONE
- Skill: `/tdd`

**Done when**:

- [ ] Create requires UploadSession COMPLETED (`409` otherwise)
- [ ] Resolve 302 Location `{appBase}/v/{videoId}?s={code}`
- [ ] Unknown/not playable → 404
- [ ] Gate check passes: `pnpm --filter api test`
- [ ] Test count: ≥3 tests pass (no silent deletions)

**Tests**: e2e
**Gate**: full (api package)

**Commit**: `feat(api): shortlink create and resolve`

---

### T23: Vite React app scaffold + routes

**What**: `web/` Vite React TS app with React Router `/` and `/v/:videoId`, `VITE_API_BASE_URL`, folder layout per ADR 0009.
**Where**: `web/`
**Depends on**: T1
**Reuses**: ADR 0009
**Requirement**: LM-18, LM-19

**Tools**:

- MCP: Context7 (Vite React)
- Skill: NONE

**Done when**:

- [ ] Layout matches ADR 0009 (`app/`, `pages/`, `features/`, `shared/`)
- [ ] Both routes render placeholders
- [ ] Gate check passes: `pnpm --filter web build`

**Tests**: none
**Gate**: build

**Commit**: `chore(web): scaffold vite react app`

---

### T24: Upload machine reducer + sessionStorage

**What**: `useReducer` machine `idle → creatingSession → uploadingParts → completing → completed|aborted|failed` + sessionStorage persistence rules.
**Where**: `web/src/features/upload/`
**Depends on**: T23
**Reuses**: ADR 0009, ADR 0004
**Requirement**: LM-18

**Tools**:

- MCP: NONE
- Skill: `/tdd`

**Done when**:

- [ ] Transitions and Continue/Discard rules covered by unit tests
- [ ] Clears storage on completed/aborted; keeps on failed
- [ ] Gate check passes: `pnpm --filter web test`
- [ ] Test count: ≥4 tests pass (no silent deletions)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(web): upload state machine`

---

### T25: UploadPanel multipart client (≤4 parallel PUTs)

**What**: Wire UploadPanel to Api: create session, presign+PUT parts (max 4), complete/abort, progress.
**Where**: `web/src/features/upload/`
**Depends on**: T24, T13
**Reuses**: ADR 0009
**Requirement**: LM-18

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] ETag list from client PUTs used for complete
- [ ] Part retry re-PUTs same partNumber
- [ ] Gate check passes: `pnpm --filter web build`

**Tests**: none
**Gate**: build

**Commit**: `feat(web): multipart upload panel`

---

### T26: VideoPage playback

**What**: Load Video; show status; when playable fetch playback URL and render `<video>`; honor `?s=`.
**Where**: `web/src/features/playback/`, `web/src/pages/`
**Depends on**: T23, T20
**Reuses**: ADR 0009, ADR 0006
**Requirement**: LM-19

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Non-playable shows simple status (no player)
- [ ] Playable uses Api presigned URL
- [ ] Gate check passes: `pnpm --filter web build`

**Tests**: none
**Gate**: build

**Commit**: `feat(web): video playback page`

---

### T27: ShortLink create UI

**What**: Button on VideoPage creates ShortLink and shows code + resolve URL (enabled when Api accepts).
**Where**: `web/src/features/short-link/`
**Depends on**: T26, T22
**Reuses**: ADR 0008, ADR 0009
**Requirement**: LM-20

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] No SPA resolve route
- [ ] Displays Api `code` + URL
- [ ] Gate check passes: `pnpm --filter web build`

**Tests**: none
**Gate**: build

**Commit**: `feat(web): shortlink create ui`

---

### T28: Compose services for api, worker, web

**What**: Finalize Dockerfiles/services so full stack runs: migrate → api + worker + web against MinIO/Postgres/RabbitMQ.
**Where**: `docker-compose.yml`, `apps/*/Dockerfile`, `web/Dockerfile`
**Depends on**: T5, T19, T22, T27
**Reuses**: SPEC §4
**Requirement**: LM-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `docker compose up` starts all required services
- [ ] Api health responds; Worker connected; web served
- [ ] Gate check passes: `pnpm -r build`

**Tests**: none
**Gate**: build

**Commit**: `chore: wire api worker web into compose`

---

## Parallel Execution Map

```
Phase 1 (Sequential):
  T1 → T2 → T3 → T4 → T5

Phase 2 (Parallel):
  T5 complete, then:
    ├── T6 [P]
    └── T7 [P]
  then T8
  T9 may run anytime after T2 (before T10)

Phase 3 (Upload):
  T8+T9 → T10 → T11 → T12
                T11 → T13

Phase 4 (Jobs):
  T8+T12 → T14
  T2 → T15 (before T16)
  T14+T15 → T16 [P]
  T14 → T17 [P]
  T16+T17 → T18
  T12 → T19

Phase 5 (Playback/ShortLink):
  T8+T10 → T20 [P]
  T2 → T21 [P]
  T12+T20+T21 → T22

Phase 6 (Web):
  T1 → T23 → T24 → T25 (needs T13)
               T23+T20 → T26 → T27 (needs T22)

Phase 7:
  T5+T19+T22+T27 → T28
```

---

## Validation

### Granularity Check

| Task | Scope | Status |
|------|-------|--------|
| T1 | Monorepo scaffold | ✅ cohesive bootstrap |
| T2 | Domain enums/types | ✅ |
| T3 | Prisma schema | ✅ |
| T4 | Migration + client | ✅ |
| T5 | Compose infra | ✅ |
| T6 | S3 port+adapter | ✅ |
| T7 | Rabbit publisher+topology | ✅ |
| T8 | Nest wiring | ✅ |
| T9 | partSize function | ✅ |
| T10–T13 | One endpoint group each | ✅ |
| T14 | Consumer infra | ✅ |
| T15 | Ffmpeg port + seek | ✅ |
| T16–T17 | One handler each | ✅ |
| T18 | Aggregate pure logic | ✅ |
| T19–T22 | Endpoint groups | ✅ |
| T23–T27 | One UI concern each | ✅ |
| T28 | Compose finalize | ✅ |

### Diagram-Definition Cross-Check

| Task | Depends On (body) | Diagram Shows | Status |
|------|-------------------|---------------|--------|
| T1 | None | start | ✅ |
| T2 | T1 | T1→T2 | ✅ |
| T3 | T2 | T2→T3 | ✅ |
| T4 | T3 | T3→T4 | ✅ |
| T5 | T4 | T4→T5 | ✅ |
| T6 | T5 | T5→T6 | ✅ |
| T7 | T5 | T5→T7 | ✅ |
| T8 | T6, T7 | T6/T7→T8 | ✅ |
| T9 | T2 | after T2 | ✅ |
| T10 | T8, T9 | T8+T9→T10 | ✅ |
| T11 | T10 | T10→T11 | ✅ |
| T12 | T11 | T11→T12 | ✅ |
| T13 | T11 | T11→T13 | ✅ |
| T14 | T8, T12 | T8+T12→T14 | ✅ |
| T15 | T2 | before T16 | ✅ |
| T16 | T14, T15 | →T16 | ✅ |
| T17 | T14 | →T17 | ✅ |
| T18 | T16, T17 | →T18 | ✅ |
| T19 | T12 | T12→T19 | ✅ |
| T20 | T8, T10 | →T20 | ✅ |
| T21 | T2 | →T21 | ✅ |
| T22 | T12, T20, T21 | →T22 | ✅ |
| T23 | T1 | T1→T23 | ✅ |
| T24 | T23 | T23→T24 | ✅ |
| T25 | T24, T13 | →T25 | ✅ |
| T26 | T23, T20 | →T26 | ✅ |
| T27 | T26, T22 | →T27 | ✅ |
| T28 | T5, T19, T22, T27 | →T28 | ✅ |

### Test Co-location Validation

| Task | Code Layer | Matrix Requires | Task Says | Status |
|------|------------|-----------------|-----------|--------|
| T1 | scaffold | none | none | ✅ |
| T2 | domain pure | unit | unit | ✅ |
| T3 | prisma schema | none | none | ✅ |
| T4 | prisma client | none | none | ✅ |
| T5 | compose | none | none | ✅ |
| T6 | infra adapter | unit | unit | ✅ |
| T7 | infra adapter | unit | unit | ✅ |
| T8 | nest wiring | none | none | ✅ |
| T9 | domain pure | unit | unit | ✅ |
| T10–T13 | controllers | e2e | e2e | ✅ |
| T14 | worker handler infra | unit | unit | ✅ |
| T15 | domain + port | unit | unit | ✅ |
| T16–T17 | worker handlers | unit | unit | ✅ |
| T18 | domain pure | unit | unit | ✅ |
| T19–T20, T22 | controllers | e2e | e2e | ✅ |
| T21 | domain pure | unit | unit | ✅ |
| T23 | web scaffold | none | none | ✅ |
| T24 | upload reducer | unit | unit | ✅ |
| T25–T27 | UI pages | none | none | ✅ |
| T28 | compose | none | none | ✅ |

---

## How to execute

1. Approve this file (set **Status** → Approved)
2. Confirm TESTING.md gates (or adjust)
3. Run `/implement` with a scope, e.g. `T1–T5` or `Phase 1`
