## Synthr API (Auth foundation)

### Environment
- `DATABASE_URL`: Postgres connection string
- `JWT_SECRET`: strong secret used for signing JWTs
- `PORT`: API port (default `3001`)
- `CORS_ORIGINS`: comma-separated origin allow-list for browsers (for example `https://synthrstate.com,https://admin.synthrstate.com`)
- `ADMIN_APP_URL`: admin app origin (added to CORS allow-list)
- `WEB_PUBLIC_URL`: public web app origin (added to CORS allow-list)
- `PUBLIC_SITE_URL`: optional public site origin alias (added to CORS allow-list)
- `S3_ENDPOINT`: S3-compatible endpoint (AWS S3 or compatible provider)
- `S3_REGION`: S3 region (for Cloudflare R2, use `auto`)
- `S3_ACCESS_KEY_ID`: access key for media bucket
- `S3_SECRET_ACCESS_KEY`: secret key for media bucket
- `S3_BUCKET`: bucket name used for listing media and collaboration attachments
- `S3_PUBLIC_BASE_URL` (optional): if set, listing image URLs are built as public CDN/bucket URLs instead of signed GET URLs
- `S3_SIGNED_URL_TTL_SECONDS` (optional): signed URL expiry in seconds (minimum runtime clamp is 60)
- `MEDIA_MAX_IMAGE_BYTES` (optional): max listing image upload size (default `10485760`)
- `ATTACHMENT_MAX_BYTES` (optional): max attachment upload size (default `20971520`)

See `.env.example`.

### Auth endpoints (MVP)
- `POST /auth/register`: creates an agency + owner user + membership, returns JWT and sets `synthr_token` httpOnly cookie
- `POST /auth/login`: returns JWT and sets `synthr_token` httpOnly cookie
- `POST /auth/logout`: clears `synthr_token`

### Protected examples
- `GET /me`: requires valid JWT (cookie or `Authorization: Bearer <token>`)
- `GET /admin/health`: requires JWT + tenant + role (`OWNER` or `MANAGER`)

