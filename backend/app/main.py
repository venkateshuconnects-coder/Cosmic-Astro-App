from fastapi import Depends, FastAPI, Header, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from app import db
from app.engine import build_compatibility_report, generate_report
from app.schemas import (
    AstroRequest,
    AstroResponse,
    AuthResponse,
    CompatibilityRequest,
    CompatibilityResponse,
    HistoryItem,
    UserInfo,
    UserLogin,
    UserRegister,
)

app = FastAPI(
    title="Cosmic Astrology API",
    description="Generates a personalized daily astrology report.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event() -> None:
    db.init_db()


def get_current_user(
    authorization: str | None = Header(None, alias="Authorization"),
) -> dict | None:
    if not authorization:
        return None
    token = authorization.removeprefix("Bearer ").strip()
    if not token:
        return None
    user = db.get_user_by_token(token)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token"
        )
    return user


@app.post("/register", response_model=AuthResponse)
def register_user(request: UserRegister) -> AuthResponse:
    try:
        user = db.register_user(
            request.email, request.password, request.first_name, request.last_name
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        ) from exc
    token = db.create_token(user["id"])
    return AuthResponse(token=token, user=UserInfo(**user))


@app.post("/login", response_model=AuthResponse)
def login_user(request: UserLogin) -> AuthResponse:
    user = db.authenticate_user(request.email, request.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password"
        )
    token = db.create_token(user["id"])
    return AuthResponse(token=token, user=UserInfo(**user))


@app.get("/me", response_model=UserInfo)
def get_me(current_user: dict = Depends(get_current_user)) -> UserInfo:
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required"
        )
    return UserInfo(**current_user)


@app.post("/generate-astro-report", response_model=AstroResponse)
def generate_astro_report(
    request: AstroRequest, current_user: dict | None = Depends(get_current_user)
) -> AstroResponse:
    """Generate a personalized astrology report for the given user input."""
    report = generate_report(request)
    user_id = current_user["id"] if current_user else None
    db.save_report(report, request, user_id=user_id)
    return report


@app.get("/history", response_model=list[HistoryItem])
def fetch_history(
    first_name: str | None = Query(None, description="Filter by first name"),
    last_name: str | None = Query(None, description="Filter by last name"),
    current_user: dict | None = Depends(get_current_user),
) -> list[HistoryItem]:
    return db.get_history(
        first_name=first_name,
        last_name=last_name,
        user_id=current_user["id"] if current_user else None,
    )


@app.post("/compatibility-check", response_model=CompatibilityResponse)
def compatibility_check(request: CompatibilityRequest) -> CompatibilityResponse:
    return build_compatibility_report(request)
