from datetime import datetime
from dotenv import load_dotenv
import os
from alpaca.data.historical import StockHistoricalDataClient
from alpaca.data.requests import StockBarsRequest
from alpaca.data.timeframe import TimeFrame
# Load .env variables
load_dotenv()

API_KEY = os.getenv("ALPACA_API_KEY")
API_SECRET = os.getenv("ALPACA_SECRET_KEY")

# No keys required for crypto data
client = StockHistoricalDataClient(
    api_key=API_KEY,
    secret_key=API_SECRET
)

# Creating request object
request_params = StockBarsRequest(
  symbol_or_symbols=["TSLA"],
  timeframe=TimeFrame.Day,
  start=datetime(2022, 9, 1),
  end=datetime(2022, 9, 7)
)

# Retrieve daily bars for Bitcoin in a DataFrame and printing it
stock_bars = client.get_stock_bars(request_params)

# Convert to dataframe
print(f"{stock_bars.model_dump_json()}")