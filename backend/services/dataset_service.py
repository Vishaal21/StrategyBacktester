from typing import Optional
from models.options import DatasetListResponse, DatasetMetadataResponse
from repositories.dataset_repository import DatasetRepository
from repositories.options_repository import OptionsRepository


class DatasetService:
    def __init__(self, dataset_repo: DatasetRepository):
        self.dataset_repo = dataset_repo

    def list_all_datasets(self) -> DatasetListResponse:
        # Get basic info about all datasets for the frontend dropdown
        datasets = self.dataset_repo.list_datasets()
        return DatasetListResponse(datasets=datasets, total_count=len(datasets))

    def get_dataset_metadata(self, dataset_name: str) -> Optional[DatasetMetadataResponse]:
        # Load detailed metadata including all available strikes and expiries
        # This is used when user selects a dataset to populate form options
        dataset = self.dataset_repo.load_dataset(dataset_name)
        if not dataset:
            return None

        options_repo = OptionsRepository(dataset)
        available_expiries = options_repo.get_available_expiries()
        available_strikes = options_repo.get_all_strikes_by_expiry()

        return DatasetMetadataResponse(
            name=dataset.metadata.dataset_name,
            date_range=dataset.metadata.date_range,
            available_expiries=available_expiries,
            available_strikes=available_strikes,
            record_count=dataset.metadata.record_count
        )
