from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from controllers import strategy_controller, backtest_controller, dataset_controller
import os

app = FastAPI(
    title="Options Strategy Backtester API",
    description="API for backtesting single-leg options strategies",
    version="1.0.0"
)

# CORS origins - allow localhost for development and production frontend
allowed_origins = [
    "http://localhost:3000",
    "http://localhost:5173",
]

# Add production frontend URL if set in environment
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    allowed_origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(strategy_controller.router)
app.include_router(backtest_controller.router)
app.include_router(dataset_controller.router)


@app.get("/")
async def root():
    return {
        "message": "Options Strategy Backtester API",
        "version": "1.0.0",
        "endpoints": {
            "strategy_validation": "/api/strategy/validate",
            "backtest_execution": "/api/backtest/run",
            "list_datasets": "/api/datasets/list",
            "dataset_metadata": "/api/datasets/{dataset_name}/metadata"
        }
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
