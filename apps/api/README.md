## Synthr API (Auth foundation)

### Environment
- `DATABASE_URL`: Postgres connection string
- `JWT_SECRET`: strong secret used for signing JWTs
- `PORT`: API port (default `3001`)

See `.env.example`.

### Auth endpoints (MVP)
- `POST /auth/register`: creates an agency + owner user + membership, returns JWT and sets `synthr_token` httpOnly cookie
- `POST /auth/login`: returns JWT and sets `synthr_token` httpOnly cookie
- `POST /auth/logout`: clears `synthr_token`

### Protected examples
- `GET /me`: requires valid JWT (cookie or `Authorization: Bearer <token>`)
- `GET /admin/health`: requires JWT + tenant + role (`OWNER` or `MANAGER`)

