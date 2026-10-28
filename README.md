# Study Buddy

Students explain a topic **out loud, from memory**, to an AI classmate who doesn't understand it yet. A separate, strict checker compares the explanation with the teacher's own material and shows the student what they covered, missed or got wrong. Teachers see how each student is doing in each subject, so they know where to help.

> **WARNING: this app handles data about minors.** Never commit real student names, interview notes or recordings. Research material lives in `docs/`, which is gitignored on purpose. Never commit `.env`.

## Status

MVP in progress. Done so far: repository tooling and CI, backend accounts (sign-up, login, token refresh), backend classes, units and study sessions with the buddy and checker, and the backend teacher dashboard and student progress. Features land on the branches listed under "Roadmap".

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

### Classes, units and study sessions

1. A **teacher** creates a class and gets a six-character join code. The code avoids 0/O and 1/I/L so it can be read aloud.
2. The teacher adds **units**: a title plus their own material (50–12,000 characters). Students never receive the material through the API, so sessions stay closed-book.
3. A **student** joins with the code, picks a unit and starts a session. The buddy, Pip, greets them with a fixed line, so there's no wait.
4. Each time the student speaks, the buddy replies with one curious question. About once every three replies it says a plausible mistake for the student to correct. It never confirms whether the student is right.
5. On **finish**, the checker grades the whole conversation against the unit's **fixed key ideas** and returns:
   - a **gap map**: key ideas marked covered or missing
   - **misconceptions**, each with a correction, including any of the buddy's planted mistakes the student agreed with
   - one exam-style **application question**
   - one **next step**
6. The student answers the application question once, and the checker grades it as correct, partly correct or incorrect.

Sessions are capped at **15 minutes and 8 student turns** (`SESSION_MINUTES`, `MAX_STUDENT_TURNS`). The cap keeps sessions short, so the app doesn't become more screen time.

| Method | Path | Who | What it does |
| --- | --- | --- | --- |
| `POST` | `/classrooms` | teacher | Create a class |
| `GET` | `/classrooms` | both | Classes you own or joined |
| `POST` | `/classrooms/join` | student | Join with a code |
| `POST` | `/classrooms/{id}/units` | teacher | Add a unit with material |
| `GET` | `/classrooms/{id}/units` | members | List units (no material) |
| `POST` | `/sessions` | student | Start a session on a unit |
| `GET` | `/sessions/{id}` | student | Conversation and feedback |
| `POST` | `/sessions/{id}/turns` | student | Send what you said, get the buddy's reply |
| `POST` | `/sessions/{id}/finish` | student | Get the gap map, question and next step |
| `POST` | `/sessions/{id}/application-answer` | student | Answer the question, get it graded |
| `GET` | `/classrooms/{id}/dashboard` | owner teacher | Class and per-student results |
| `GET` | `/progress/me` | student | Own progress and mascot |

**Fixed key ideas.** The first time any session on a unit finishes, the model extracts 3–8 key ideas from the material. They're stored on the unit (`units.key_ideas`), and the row is locked during extraction so two students finishing at once can't get different lists. Every later session is graded on that same list, which is what makes results comparable across students. Adding a unit never waits on the model.

### Teacher dashboard and student progress

A student's standing on a unit is their **latest** finished session, so earlier struggles don't hold them back.

- **Per unit (class view):** how many students attempted it and their average coverage. For each key idea: how many students covered or missed it, how many misconceptions about it, and up to three **anonymous** examples. Misconceptions that don't match any idea are listed separately.
- **Per student:** sessions completed, latest coverage and missing ideas per unit, and an average across the units attempted.
- Students are **listed by name, never ranked**. There are no leaderboards, no streaks and no time-spent metrics; the research flagged ranking and labelling as harms.
- **Mascot:** grows one level per 5 distinct key ideas the student has explained correctly, across all their sessions. Time in the app doesn't count. The app decides what each level looks like.

Anything a user isn't allowed to see answers **404, not 403**, so outsiders can't tell whether a class or session exists.

### AI layer (`backend/app/ai/`)

- `chat_model.py`: the `ChatModel` interface. To use a hosted model, subclass it and return the new class from `get_chat_model()` in `app/dependencies.py`.
- `ollama_model.py`: the Ollama adapter. It raises Ollama's context window to 8,192 tokens, because the default is too small for material plus a conversation.
- `buddy.py`: the friendly buddy (temperature 0.7).
- `checker.py`: the strict checker (temperature 0). Its output is forced into a JSON schema, validated with Pydantic and retried once if malformed. If it fails twice, the app gets a 503 and the session stays open.
- `transcript.py`: student text is escaped and wrapped in `<student>` tags, so it can't close the tags and slip in instructions.

If the model fails, the app gets a **503 and nothing is saved**, so the student can simply retry.

## Inputs and outputs

- Input: a student's spoken explanation of a unit, and the teacher's material for that unit.
- Output: buddy follow-up questions, then a gap map (covered, missing, incorrect), one application question and one next step. Teachers get per-subject coverage and recurring misconceptions.

## Known limitations

- Ollama on a laptop serves only a few sessions at once and an 8B model makes a weak checker. Switch to a hosted model before real users.
- **Checker accuracy is unmeasured, and with `llama3.1:8b` it is not good enough for teachers yet.** Live tests separated a strong student (67%) from a weak one (17%) correctly. But the model also:
  - under-credited an idea the student did explain
  - flagged correct statements as misconceptions
  - once attributed the buddy's planted mistake to the student

  Before any teacher sees scores: switch to a stronger model, then have teachers grade 100–200 explanations and compare them with the checker's.
- Sessions graded before a unit had fixed key ideas are left out of idea-level tallies (they still count for coverage).
- The dashboard is computed on each request. That's fine for class-sized data; cache it if classes get very large.
- The first model call after Ollama starts takes about 15 seconds while the model loads. After that, buddy replies take about 1 second and the checker about 9 seconds on an M-series Mac.
- Model calls block a worker thread while they wait. That's fine for the MVP; at scale, run more workers or move these routes to async.
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
