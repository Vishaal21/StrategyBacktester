import json
from pathlib import Path
from typing import List, Optional
from models.options import OptionsDataset, DatasetInfo


class DatasetRepository:
    def __init__(self, data_dir: str = "data"):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)

    def list_datasets(self) -> List[DatasetInfo]:
        # Scan the data directory and return summary info for all available datasets
        datasets = []

        for json_file in self.data_dir.glob("*.json"):
            try:
                with open(json_file, 'r') as f:
                    data = json.load(f)

                metadata = data.get('metadata', {})
                datasets.append(DatasetInfo(
                    name=metadata.get('dataset_name', json_file.stem),
                    date_range=metadata.get('date_range', {}),
                    record_count=metadata.get('record_count', len(data.get('data', [])))
                ))
            except Exception as e:
                # Skip corrupted files and continue processing others
                print(f"Error loading dataset {json_file}: {e}")
                continue

        return datasets

    def load_dataset(self, dataset_name: str) -> Optional[OptionsDataset]:
        # Load the full dataset with all historical options data
        file_path = self.data_dir / f"{dataset_name}.json"

        if not file_path.exists():
            return None

        try:
            with open(file_path, 'r') as f:
                data = json.load(f)
                return OptionsDataset(**data)
        except Exception as e:
            print(f"Error loading dataset {dataset_name}: {e}")
            return None

    def dataset_exists(self, dataset_name: str) -> bool:
        # Quick check if a dataset file exists without loading it
        return (self.data_dir / f"{dataset_name}.json").exists()
