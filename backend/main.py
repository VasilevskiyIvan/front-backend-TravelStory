from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from pathlib import Path
import uvicorn

from app.routers import reports, auth, users
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from fastapi.middleware.cors import CORSMiddleware

from app.routers.auth import limiter

app = FastAPI()

app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

# Обработчик ошибок превышения лимита
@app.exception_handler(RateLimitExceeded)
async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Too many requests"}
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://192.168.0.78:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключение роутеров
app.include_router(reports.router)
app.include_router(auth.router)
app.include_router(users.router)

if __name__ == "__main__":
    uvicorn.run(app, host="192.168.0.78", port=8000)