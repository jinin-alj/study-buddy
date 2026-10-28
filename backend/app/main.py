from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import auth, classrooms, study_sessions


def create_app() -> FastAPI:
    """Build the FastAPI application with all routes attached."""
    app = FastAPI(title="Study Buddy API", version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=get_settings().cors_origin_list(),
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
        allow_headers=["Authorization", "Content-Type"],
    )

    @app.get("/health")
    def read_health() -> dict[str, str]:
        """Report that the API is running, for load balancers and uptime checks."""
        return {"status": "ok"}

    app.include_router(auth.router)
    app.include_router(classrooms.router)
    app.include_router(study_sessions.router)
    return app


app = create_app()
