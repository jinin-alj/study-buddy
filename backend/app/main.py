from fastapi import FastAPI


def create_app() -> FastAPI:
    """Build the FastAPI application with all routes attached."""
    app = FastAPI(title="Study Buddy API", version="0.1.0")

    @app.get("/health")
    def read_health() -> dict[str, str]:
        """Report that the API is running, for load balancers and uptime checks."""
        return {"status": "ok"}

    return app


app = create_app()
