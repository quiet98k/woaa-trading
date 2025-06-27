from datetime import datetime
from dotenv import load_dotenv
import os
from alpaca.data.historical import StockHistoricalDataClient
from alpaca.data.requests import StockBarsRequest
from alpaca.data.timeframe import TimeFrame
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.dates as mdates

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
  symbol_or_symbols=["NVDA"],
  timeframe=TimeFrame.Minute,
  start=datetime(2024, 3, 5, 12, 12),
  end=datetime(2024, 3, 5, 12, 13)
)

# Retrieve daily bars for Bitcoin in a DataFrame and printing it
stock_bars = client.get_stock_bars(request_params)

df = stock_bars.df.reset_index()  # Now timestamp is a column
print(df)

df['timestamp'] = pd.to_datetime(df['timestamp']).dt.tz_convert('America/Los_Angeles')
df.set_index('timestamp', inplace=True)

df = df.between_time("06:30", "13:00")


# Resample to 1-minute intervals to keep all time slots (including missing ones)
open_prices = df['open'].resample('1min').asfreq()


# Plot and save
plt.figure(figsize=(16, 6))
plt.plot(open_prices.index, open_prices.values, label='Open Price')

plt.gca().xaxis.set_major_locator(mdates.HourLocator())
plt.gca().xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d %H:%M'))

plt.title('Stock')
plt.xlabel('Timestamp')
plt.ylabel('Open Price')
plt.grid(True)
plt.legend()
plt.tight_layout()

# Save to file (PNG, but can use .jpg, .pdf, etc.)
plt.savefig("stock_graph.svg")