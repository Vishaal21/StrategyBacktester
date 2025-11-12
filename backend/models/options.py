from pydantic import BaseModel, Field
from typing import List, Dict


class OptionRecord(BaseModel):
    date: str
    underlying: float = Field(gt=0)
    expiry: str
    strike: float = Field(gt=0)
    type: str = Field(pattern="^(call|put)$")
    mid_price: float = Field(gt=0)


class DatasetMetadata(BaseModel):
    dataset_name: str
    date_range: Dict[str, str]
    record_count: int


class OptionsDataset(BaseModel):
    metadata: DatasetMetadata
    data: List[OptionRecord]


class DatasetInfo(BaseModel):
    name: str
    date_range: Dict[str, str]
    record_count: int


class DatasetListResponse(BaseModel):
    datasets: List[DatasetInfo]
    total_count: int


class DatasetMetadataResponse(BaseModel):
    name: str
    date_range: Dict[str, str]
    available_expiries: List[str]
    available_strikes: Dict[str, List[float]]
    record_count: int
