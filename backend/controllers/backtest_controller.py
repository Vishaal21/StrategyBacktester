from fastapi import APIRouter
from models.backtest import BacktestRequest, BacktestResponse
from services.backtest_service import BacktestService
from repositories.dataset_repository import DatasetRepository

router = APIRouter(prefix="/api/backtest", tags=["backtest"])

dataset_repo = DatasetRepository()
backtest_service = BacktestService(dataset_repo)


@router.post("/run", response_model=BacktestResponse)
async def run_backtest(request: BacktestRequest):
    # Endpoint to execute a backtest with given strategy and date range
    return backtest_service.execute_backtest(request)
