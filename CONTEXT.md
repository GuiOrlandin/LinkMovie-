# LinkMovie — Ubiquitous Language

Terms below are the only allowed names for these concepts in code and docs.

| Term | Meaning |
|------|---------|
| **Video** | Aggregate for one uploaded media item; statuses `UPLOADING`, `PROCESSING`, `READY`, `FAILED` |
| **VideoId** | Stable identity of a Video |
| **UploadSession** | One multipart attempt for a Video; statuses `IN_PROGRESS`, `COMPLETED`, `ABORTED` |
| **UploadToken** | Opaque token identifying the active UploadSession in HTTP paths |
| **MediaJob** | Async unit of work; types **GenerateThumbnails**, **GenerateTitle**; statuses `PENDING`, `RUNNING`, `SUCCEEDED`, `FAILED`, `CANCELLED` |
| **Thumbnail** | JPEG frame derived from a Video (`ordinal` 0–2) |
| **ShortLink** | Share identity: 8-char base62 **code** (≠ VideoId) |
| **Api** | NestJS HTTP process; publishes MediaJobs; does not consume queues |
| **Worker** | NestJS standalone process; consumes MediaJobs; no HTTP controllers |

**Playable:** `Video.status ∈ {PROCESSING, READY}` (derived; not a stored field).
