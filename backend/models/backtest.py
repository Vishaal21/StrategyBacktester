from pydantic import BaseModel, Field, validator
from typing import List
from datetime import datetime
from .strategy import StrategyConfig


class DateRange(BaseModel):
    start_date: str
    end_date: str

    @validator('start_date', 'end_date')
    def validate_date_format(cls, v):
        try:
            datetime.strptime(v, '%Y-%m-%d')
        except ValueError:
            raise ValueError('Date must be in YYYY-MM-DD format')
        return v


class BacktestRequest(BaseModel):
    strategy: StrategyConfig
    date_range: DateRange


class DailyPnL(BaseModel):
    date: str
    cumulative_pnl: float
    underlying_price: float


class StrategySummary(BaseModel):
    option_type: str
    strike: float
    expiry: str
    position_direction: str
    quantity: int
    entry_price: float
    entry_date: str


class BacktestPeriod(BaseModel):
    start_date: str
    end_date: str
    total_days: int


class BacktestResults(BaseModel):
    daily_pnl: List[DailyPnL]
    final_pnl: float
    win_rate: float = Field(ge=0, le=100)
    max_drawdown: float
    position_closed: bool
    exit_reason: str = Field(pattern="^(expiry|backtest_end)$")


class BacktestResponse(BaseModel):
    status: str = Field(pattern="^(success|error)$")
    strategy_summary: StrategySummary | None = None
    backtest_period: BacktestPeriod | None = None
    results: BacktestResults | None = None
    execution_time_ms: int | None = None
    message: str | None = None
    error_code: str | None = None
