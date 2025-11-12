import json
from datetime import datetime, timedelta
import random


def generate_sample_dataset(output_filepath: str, start_date_str: str, days: int = 30):
    current_underlying = 4800.0
    strikes = [4700, 4750, 4800, 4850, 4900]
    data_records = []

    current_date = datetime.strptime(start_date_str, '%Y-%m-%d')
    expiry_date = current_date + timedelta(days=5)
    all_dates = []

    for day in range(days):
        current_underlying += random.uniform(-50, 50)
        current_underlying = max(4500, min(5100, current_underlying))

        date_str = current_date.strftime('%Y-%m-%d')
        expiry_str = expiry_date.strftime('%Y-%m-%d')
        all_dates.append(date_str)

        for strike in strikes:
            moneyness_call = current_underlying - strike
            call_price = max(5, moneyness_call + random.uniform(10, 50) if moneyness_call > 0 else random.uniform(5, 30))

            data_records.append({
                'date': date_str,
                'underlying': round(current_underlying, 2),
                'expiry': expiry_str,
                'strike': strike,
                'type': 'call',
                'mid_price': round(call_price, 2)
            })

            moneyness_put = strike - current_underlying
            put_price = max(5, moneyness_put + random.uniform(10, 50) if moneyness_put > 0 else random.uniform(5, 30))

            data_records.append({
                'date': date_str,
                'underlying': round(current_underlying, 2),
                'expiry': expiry_str,
                'strike': strike,
                'type': 'put',
                'mid_price': round(put_price, 2)
            })

        current_date += timedelta(days=1)

        if day % 5 == 4:
            expiry_date = current_date + timedelta(days=5)

    metadata = {
        'dataset_name': output_filepath.split('/')[-1].replace('.json', ''),
        'date_range': {
            'start': all_dates[0],
            'end': all_dates[-1]
        },
        'record_count': len(data_records)
    }

    output = {
        'metadata': metadata,
        'data': data_records
    }

    with open(output_filepath, 'w') as jsonfile:
        json.dump(output, jsonfile, indent=2)

    print(f"✅ Generated {len(data_records)} records")
    print(f"📁 Saved to: {output_filepath}")
    print(f"📅 Date range: {all_dates[0]} to {all_dates[-1]}")
    print(f"💰 Strikes: {strikes}")


if __name__ == "__main__":
    generate_sample_dataset(
        output_filepath='backend/data/SPX_Sample.json',
        start_date_str='2024-01-02',
        days=30
    )
