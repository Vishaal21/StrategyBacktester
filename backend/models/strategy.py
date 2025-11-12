from pydantic import BaseModel, Field, validator
from datetime import datetime


class StrategyConfig(BaseModel):
    dataset_name: str
    option_type: str = Field(pattern="^(call|put)$")
    strike: float = Field(gt=0)
    expiry: str
    position_direction: str = Field(pattern="^(buy|sell)$")
    quantity: int = Field(gt=0)

    @validator('expiry')
    def validate_date_format(cls, v):
        try:
            datetime.strptime(v, '%Y-%m-%d')
        except ValueError:
            raise ValueError('Expiry must be in YYYY-MM-DD format')
        return v


class StrategyValidationResponse(BaseModel):
    valid: bool
    message: str
    entry_price: float | None = None
    error_code: str | None = None
