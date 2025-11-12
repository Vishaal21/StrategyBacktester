from fastapi import APIRouter, HTTPException
from models.options import DatasetListResponse, DatasetMetadataResponse
from services.dataset_service import DatasetService
from repositories.dataset_repository import DatasetRepository

router = APIRouter(prefix="/api/datasets", tags=["datasets"])

dataset_repo = DatasetRepository()
dataset_service = DatasetService(dataset_repo)


@router.get("/list", response_model=DatasetListResponse)
async def list_datasets():
    # Endpoint to get list of all available datasets for dropdown
    return dataset_service.list_all_datasets()


@router.get("/{dataset_name}/metadata", response_model=DatasetMetadataResponse)
async def get_dataset_metadata(dataset_name: str):
    # Endpoint to get detailed metadata including available strikes and expiries
    response = dataset_service.get_dataset_metadata(dataset_name)

    if response is None:
        raise HTTPException(
            status_code=404,
            detail={
                "status": "error",
                "message": f"Dataset '{dataset_name}' not found",
                "error_code": "DATASET_NOT_FOUND"
            }
        )

    return response
