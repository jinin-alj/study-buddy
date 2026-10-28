# Study Buddy

Students explain a topic **out loud, from memory**, to an AI classmate who doesn't understand it yet. A separate, strict checker compares the explanation with the teacher's own material and shows the student what they covered, missed or got wrong. Teachers see how each student is doing in each subject, so they know where to help.

> **WARNING: this app handles data about minors.** Never commit real student names, interview notes or recordings. Research material lives in `docs/`, which is gitignored on purpose. Never commit `.env`.

## Status

MVP in progress. Done so far: repository tooling and CI, and backend accounts (sign-up, login, token refresh). Features land on the branches listed under "Roadmap".

## Repository layout

| Path | What it is |
| --- | --- |
| `backend/` | FastAPI API (Python 3.12) |
| `mobile/` | Expo app (React Native + TypeScript), runs on iOS, Android and web |
| `docker-compose.yml` | Local PostgreSQL |
| `.github/workflows/ci.yml` | Lint, format, type check, tests and dependency audit on every PR |
| `docs/` | Private research and rules, **gitignored** |

## Setup

Requirements: Python 3.12, Node 24, Docker Desktop, and [Ollama](https://ollama.com) with the `llama3.1:8b` model.

```bash
cp .env.example .env          # then edit the values
docker compose up -d database # start PostgreSQL
ollama serve                  # in its own terminal
```

Backend:

```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -e ".[dev]"
.venv/bin/alembic upgrade head      # create or update the database tables
.venv/bin/uvicorn app.main:app --reload
```

Interactive API docs: http://localhost:8000/docs

Changing a model? Generate a migration, **read it**, then apply it:

```bash
.venv/bin/alembic revision --autogenerate -m "describe the change"
.venv/bin/alembic upgrade head
```

> Alembic does not drop Postgres enum types on downgrade. Add the drop by hand, as in the users migration.

Mobile (in another terminal):

```bash
cd mobile
npm install
npm run web
```

## Checks (same as CI)

```bash
cd backend && .venv/bin/ruff check . && .venv/bin/ruff format --check . && .venv/bin/mypy app tests && .venv/bin/pytest
cd mobile && npm run format:check && npm run lint && npm run typecheck && npm test
```

No change merges unless every check passes.

Backend tests use in-memory SQLite by default. To run them against Postgres like CI does, point them at a **separate** test database. The tests drop every table, so never use your dev database:

```bash
docker compose exec database psql -U study_buddy -c "CREATE DATABASE study_buddy_test;"
TEST_DATABASE_URL=postgresql+psycopg://study_buddy:<password>@localhost:5432/study_buddy_test .venv/bin/pytest
```

## Architecture

- **Mobile app** talks to the backend over HTTPS with JSON. Speech is recognised **on the device** (free at any scale, no audio leaves the phone). The buddy's voice uses on-device text-to-speech.
- **Backend** is stateless, so it can scale horizontally behind a load balancer. PostgreSQL stores users, classes, units and session results.
- **AI models** sit behind a small interface. Ollama is the free local placeholder; a hosted model can replace it without changing the rest of the code.
- **Buddy and checker are separate prompts.** The friendly buddy never confirms anything the strict checker hasn't verified, which protects students from AI that agrees with wrong answers.

### Accounts and sign-in

- Accounts use a **username and a nickname only**: no email or real name, to keep data on minors minimal.
- Roles are `student` and `teacher`.
- Passwords are hashed with Argon2id. Failed logins give the same error and take the same time whether or not the username exists, so usernames can't be probed.
- Sign-in returns a short-lived **access token** (30 min), sent as `Authorization: Bearer <token>`, and a **refresh token** (30 days) used only at `/auth/refresh`. Both are signed JWTs, so the API keeps no session state and can scale horizontally.

| Method | Path | What it does |
| --- | --- | --- |
| `POST` | `/auth/register` | Create an account (`username`, `display_name`, `password`, `role`) and sign in |
| `POST` | `/auth/login` | Sign in with `username` and `password` |
| `POST` | `/auth/refresh` | Trade a refresh token for a new token pair |
| `GET` | `/auth/me` | The signed-in user |
| `GET` | `/health` | Uptime check |

## Inputs and outputs

- Input: a student's spoken explanation of a unit, and the teacher's material for that unit.
- Output: buddy follow-up questions, then a gap map (covered, missing, incorrect), one application question and one next step. Teachers get per-subject coverage and recurring misconceptions.

## Known limitations

- Ollama on a laptop serves only a few sessions at once and an 8B model makes a weak checker. Switch to a hosted model before real users.
- On-device speech recognition works in Chrome on the web today. Phones need an Expo development build.
- **No login rate limiting yet.** Add it at the gateway (or with Redis) before launch; see the `TODO` in `app/routers/auth.py`.
- **No password reset**, because accounts have no email. A teacher-led reset is a possible follow-up.
- **Tokens can't be revoked early.** A stolen refresh token works until it expires. A server-side denylist would fix this if needed.
- Anyone can sign up as a teacher. Teachers only see classes that students choose to join.
- Starlette prints a deprecation warning about `httpx` in tests. It is harmless; the suggested replacement has not been vetted yet.

## Maintenance

- CI runs `pip-audit` and `npm audit` for known vulnerabilities.
- `npm audit` currently reports issues inside the Expo CLI (build tooling, not shipped code). The audit step is non-blocking until Expo patches them.

## Roadmap (branches)

1. `chore/repo-setup`
2. `feat/backend-auth`
3. `feat/backend-study-sessions`
4. `feat/backend-teacher-dashboard`
5. `feat/mobile-auth`
6. `feat/mobile-study-session`
7. `feat/mobile-teacher-dashboard`
