import os
from dotenv import load_dotenv
import requests
import json

# Load .env variables
load_dotenv()

API_KEY = os.getenv("ALPACA_API_KEY")
API_SECRET = os.getenv("ALPACA_SECRET_KEY")

BASE_URL = "https://data.alpaca.markets/v2/stocks/bars"

HEADERS = {
    "APCA-API-KEY-ID": API_KEY,
    "APCA-API-SECRET-KEY": API_SECRET,
}

params = {
    "symbols": "TSLA",
    "timeframe": "1Min",
    "start": "2024-01-03T00:00:00Z",
    "end": "2024-01-04T00:00:00Z",
    "limit": 10000
}

all_data = {
    "bars": {},
}

while True:
    response = requests.get(BASE_URL, headers=HEADERS, params=params)
    data = response.json()

    # Merge bar data by symbol
    for symbol, bars in data.get("bars", {}).items():
        if symbol not in all_data["bars"]:
            all_data["bars"][symbol] = []
        all_data["bars"][symbol].extend(bars)

    # Check if there's a next page
    next_token = data.get("next_page_token")
    if next_token:
        params["page_token"] = next_token
    else:
        break

# Pretty print
print(json.dumps(all_data, indent=2))

# Save to file
with open("alpaca_bars_raw.json", "w") as f:
    json.dump(all_data, f, indent=2)
