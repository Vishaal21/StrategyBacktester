from typing import List, Optional, Dict
from models.options import OptionsDataset, OptionRecord


class OptionsRepository:
    def __init__(self, dataset: OptionsDataset):
        self.dataset = dataset
        self.data = dataset.data

    def get_option_price(self, date: str, strike: float, expiry: str, option_type: str) -> Optional[float]:
        # Find the mid price for a specific option on a given date
        for record in self.data:
            if (record.date == date and record.strike == strike and
                record.expiry == expiry and record.type == option_type):
                return record.mid_price
        return None

    def get_underlying_price(self, date: str) -> Optional[float]:
        # Get the SPX underlying price for a specific date
        for record in self.data:
            if record.date == date:
                return record.underlying
        return None

    def get_available_dates(self) -> List[str]:
        # Return all unique trading dates in the dataset
        dates = set(record.date for record in self.data)
        return sorted(list(dates))

    def get_available_expiries(self) -> List[str]:
        # Return all unique expiration dates available in the dataset
        expiries = set(record.expiry for record in self.data)
        return sorted(list(expiries))

    def get_available_strikes_for_expiry(self, expiry: str, option_type: str) -> List[float]:
        # Get all strikes available for a specific expiry and option type
        strikes = set(
            record.strike
            for record in self.data
            if record.expiry == expiry and record.type == option_type
        )
        return sorted(list(strikes))

    def get_all_strikes_by_expiry(self) -> Dict[str, List[float]]:
        # Build a map of expiry dates to available strikes (used for frontend dropdowns)
        strikes_by_expiry = {}

        for record in self.data:
            if record.expiry not in strikes_by_expiry:
                strikes_by_expiry[record.expiry] = set()
            strikes_by_expiry[record.expiry].add(record.strike)

        return {
            expiry: sorted(list(strikes))
            for expiry, strikes in strikes_by_expiry.items()
        }

    def filter_by_date_range(self, start_date: str, end_date: str) -> List[OptionRecord]:
        # Filter dataset to only include records within a date range
        return [
            record for record in self.data
            if start_date <= record.date <= end_date
        ]

    def validate_strategy_params(self, strike: float, expiry: str, option_type: str) -> bool:
        # Check if the given strike/expiry/type combination exists in the dataset
        for record in self.data:
            if (record.strike == strike and record.expiry == expiry and record.type == option_type):
                return True
        return False
