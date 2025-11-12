from fastapi import APIRouter
from models.strategy import StrategyConfig, StrategyValidationResponse
from services.backtest_service import BacktestService
from repositories.dataset_repository import DatasetRepository

router = APIRouter(prefix="/api/strategy", tags=["strategy"])

dataset_repo = DatasetRepository()
backtest_service = BacktestService(dataset_repo)


@router.post("/validate", response_model=StrategyValidationResponse)
async def validate_strategy(strategy: StrategyConfig):
    # Endpoint to validate strategy parameters before running backtest
    return backtest_service.validate_strategy(strategy)
