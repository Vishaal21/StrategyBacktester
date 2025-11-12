import time
from typing import Tuple, List
from models.strategy import StrategyConfig, StrategyValidationResponse
from models.backtest import (
    BacktestRequest, BacktestResponse, BacktestResults,
    DailyPnL, StrategySummary, BacktestPeriod
)
from repositories.dataset_repository import DatasetRepository
from repositories.options_repository import OptionsRepository


class BacktestService:
    def __init__(self, dataset_repo: DatasetRepository):
        self.dataset_repo = dataset_repo

    def validate_strategy(self, strategy: StrategyConfig) -> StrategyValidationResponse:
        # Validate that the user's strategy parameters are valid before running backtest
        dataset = self.dataset_repo.load_dataset(strategy.dataset_name)
        if not dataset:
            return StrategyValidationResponse(
                valid=False,
                message=f"Dataset '{strategy.dataset_name}' not found",
                error_code="DATASET_NOT_FOUND"
            )

        options_repo = OptionsRepository(dataset)

        if not options_repo.validate_strategy_params(strategy.strike, strategy.expiry, strategy.option_type):
            available_strikes = options_repo.get_available_strikes_for_expiry(strategy.expiry, strategy.option_type)
            return StrategyValidationResponse(
                valid=False,
                message=f"Strike {strategy.strike} not available for expiry {strategy.expiry}. "
                        f"Available strikes: {available_strikes[:10]}",
                error_code="INVALID_STRIKE"
            )

        # Find first available entry price
        available_dates = options_repo.get_available_dates()
        entry_price = None

        for date in available_dates:
            price = options_repo.get_option_price(date, strategy.strike, strategy.expiry, strategy.option_type)
            if price:
                entry_price = price
                break

        if entry_price is None:
            return StrategyValidationResponse(
                valid=False,
                message="No pricing data available for this option",
                error_code="NO_PRICING_DATA"
            )

        return StrategyValidationResponse(
            valid=True,
            message="Strategy configuration is valid",
            entry_price=entry_price
        )

    def execute_backtest(self, request: BacktestRequest) -> BacktestResponse:
        # Main backtest execution - runs the strategy simulation and calculates P/L over the date range
        start_time = time.time()

        try:
            dataset = self.dataset_repo.load_dataset(request.strategy.dataset_name)
            if not dataset:
                return BacktestResponse(
                    status="error",
                    message=f"Dataset '{request.strategy.dataset_name}' not found",
                    error_code="DATASET_NOT_FOUND"
                )

            options_repo = OptionsRepository(dataset)

            available_dates = options_repo.get_available_dates()
            if not available_dates:
                return BacktestResponse(
                    status="error",
                    message="No data available in dataset",
                    error_code="INSUFFICIENT_DATA"
                )

            start_date = request.date_range.start_date
            end_date = request.date_range.end_date
            expiry = request.strategy.expiry

            # Get dates within backtest range, stopping at expiry
            backtest_dates = [
                d for d in available_dates
                if start_date <= d <= min(end_date, expiry)
            ]

            if not backtest_dates:
                return BacktestResponse(
                    status="error",
                    message=f"No data available for entry date {start_date}",
                    error_code="INSUFFICIENT_DATA"
                )

            entry_date = backtest_dates[0]
            entry_price = options_repo.get_option_price(
                entry_date,
                request.strategy.strike,
                request.strategy.expiry,
                request.strategy.option_type
            )

            if entry_price is None:
                return BacktestResponse(
                    status="error",
                    message=f"No pricing data for entry date {entry_date}",
                    error_code="NO_PRICING_DATA"
                )

            # Run backtest calculations
            daily_pnl_data, final_pnl, position_closed, exit_reason = self.calculate_pnl(
                options_repo,
                request.strategy,
                backtest_dates,
                entry_price
            )

            win_rate = self.calculate_win_rate(daily_pnl_data)
            max_drawdown = self.calculate_max_drawdown(daily_pnl_data)

            execution_time_ms = int((time.time() - start_time) * 1000)

            return BacktestResponse(
                status="success",
                strategy_summary=StrategySummary(
                    option_type=request.strategy.option_type,
                    strike=request.strategy.strike,
                    expiry=request.strategy.expiry,
                    position_direction=request.strategy.position_direction,
                    quantity=request.strategy.quantity,
                    entry_price=entry_price,
                    entry_date=entry_date
                ),
                backtest_period=BacktestPeriod(
                    start_date=start_date,
                    end_date=backtest_dates[-1],
                    total_days=len(backtest_dates)
                ),
                results=BacktestResults(
                    daily_pnl=daily_pnl_data,
                    final_pnl=final_pnl,
                    win_rate=win_rate,
                    max_drawdown=max_drawdown,
                    position_closed=position_closed,
                    exit_reason=exit_reason
                ),
                execution_time_ms=execution_time_ms
            )

        except Exception as e:
            return BacktestResponse(
                status="error",
                message=f"Internal server error during backtest execution: {str(e)}",
                error_code="BACKTEST_FAILED"
            )

    def calculate_pnl(
        self,
        options_repo: OptionsRepository,
        strategy: StrategyConfig,
        backtest_dates: List[str],
        entry_price: float
    ) -> Tuple[List[DailyPnL], float, bool, str]:
        # Calculate daily mark-to-market P/L throughout the backtest period
        CONTRACT_MULTIPLIER = 100
        position_multiplier = 1 if strategy.position_direction == "buy" else -1

        daily_pnl_data = []
        cumulative_pnl = 0.0
        position_closed = False
        exit_reason = "backtest_end"

        for date in backtest_dates:
            current_price = options_repo.get_option_price(date, strategy.strike, strategy.expiry, strategy.option_type)
            underlying_price = options_repo.get_underlying_price(date)

            # Check if we've reached expiry
            if date == strategy.expiry:
                if strategy.option_type == "call":
                    intrinsic_value = max(0, underlying_price - strategy.strike)
                else:  # put
                    intrinsic_value = max(0, strategy.strike - underlying_price)

                settlement_pnl = (intrinsic_value - entry_price) * position_multiplier * CONTRACT_MULTIPLIER * strategy.quantity
                cumulative_pnl = settlement_pnl
                position_closed = True
                exit_reason = "expiry"

                daily_pnl_data.append(DailyPnL(
                    date=date,
                    cumulative_pnl=round(cumulative_pnl, 2),
                    underlying_price=round(underlying_price, 2)
                ))
                break

            # MTM P/L calculation
            if current_price is not None:
                daily_change = (current_price - entry_price) * position_multiplier * CONTRACT_MULTIPLIER * strategy.quantity
                cumulative_pnl = daily_change

            daily_pnl_data.append(DailyPnL(
                date=date,
                cumulative_pnl=round(cumulative_pnl, 2),
                underlying_price=round(underlying_price, 2) if underlying_price else 0.0
            ))

        final_pnl = cumulative_pnl
        return daily_pnl_data, round(final_pnl, 2), position_closed, exit_reason

    def calculate_win_rate(self, daily_pnl_data: List[DailyPnL]) -> float:
        # Win rate = percentage of days where cumulative P/L was positive
        if not daily_pnl_data:
            return 0.0

        positive_days = sum(1 for day in daily_pnl_data if day.cumulative_pnl > 0)
        win_rate = (positive_days / len(daily_pnl_data)) * 100

        return round(win_rate, 2)

    def calculate_max_drawdown(self, daily_pnl_data: List[DailyPnL]) -> float:
        # Max drawdown = largest peak-to-trough decline in cumulative P/L
        if not daily_pnl_data:
            return 0.0

        peak = float('-inf')
        max_drawdown = 0.0

        for day in daily_pnl_data:
            pnl = day.cumulative_pnl

            if pnl > peak:
                peak = pnl

            drawdown = peak - pnl

            if drawdown > max_drawdown:
                max_drawdown = drawdown

        return round(-max_drawdown, 2)
