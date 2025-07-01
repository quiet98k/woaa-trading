"""
SimTime updater: maps continuous real-world time to market-only simulated time.
Skips weekends and non-market hours by fast-forwarding over them.
"""

import asyncio
from datetime import datetime, timedelta, time
from zoneinfo import ZoneInfo
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.user_setting import UserSetting
from app.database import async_session_maker

TICK_INTERVAL = 1  # seconds
LA_ZONE = ZoneInfo("America/Los_Angeles")
MARKET_OPEN = time(6, 30)
MARKET_CLOSE = time(13, 0)


def is_market_day(dt: datetime) -> bool:
    return dt.weekday() < 5  # Mon–Fri


def is_during_market_hours(dt: datetime) -> bool:
    return is_market_day(dt) and MARKET_OPEN <= dt.time() < MARKET_CLOSE


def next_market_open(dt: datetime) -> datetime:
    dt = dt + timedelta(days=1)
    while True:
        if is_market_day(dt):
            return dt.replace(hour=6, minute=30, second=0, microsecond=0)
        dt += timedelta(days=1)


def advance_market_time(start: datetime, seconds: float) -> datetime:
    current = start
    print(f"[advance_market_time] Starting from {current}, advancing {seconds} seconds")

    while seconds > 0:
        if not is_market_day(current) or current.time() >= MARKET_CLOSE:
            print(f"[advance_market_time] Outside market hours at {current}, skipping to next open")
            current = next_market_open(current)
            continue

        if current.time() < MARKET_OPEN:
            current = current.replace(hour=6, minute=30, second=0, microsecond=0)
            print(f"[advance_market_time] Before market open, jumping to 6:30 AM: {current}")

        market_close = current.replace(hour=13, minute=0, second=0, microsecond=0)
        time_left_today = (market_close - current).total_seconds()

        step = min(seconds, time_left_today)
        current += timedelta(seconds=step)
        seconds -= step
        print(f"[advance_market_time] Advanced by {step} seconds, now at {current}, remaining: {seconds}")

        if step == time_left_today:
            print(f"[advance_market_time] Reached market close, advancing to next open")
            current = next_market_open(current)

    print(f"[advance_market_time] Final advanced time: {current}")
    return current


async def update_simulation_time():
    while True:
        print("[update_simulation_time] Ticking...")
        async with async_session_maker() as session:
            await update_all_users_sim_time(session)
        await asyncio.sleep(TICK_INTERVAL)


async def update_all_users_sim_time(session: AsyncSession):
    now_utc = datetime.now(tz=ZoneInfo("UTC"))
    print(f"[update_all_users_sim_time] Current UTC: {now_utc}")

    result = await session.execute(select(UserSetting))
    users = result.scalars().all()

    print(f"[update_all_users_sim_time] Found {len(users)} users")

    for user in users:
        print(f"[update_all_users_sim_time] Processing user {user.user_id}")
        if user.paused:
            print("[update_all_users_sim_time] Skipped: paused")
            continue
        if user.speed <= 0:
            print("[update_all_users_sim_time] Skipped: speed <= 0")
            continue

        elapsed = (now_utc - user.last_updated).total_seconds()
        print(f"[update_all_users_sim_time] Elapsed real time: {elapsed} seconds")

        user.last_updated = now_utc

        sim_time_la = user.sim_time.astimezone(LA_ZONE)
        advanced_time = advance_market_time(sim_time_la, elapsed * user.speed)
        user.sim_time = advanced_time.astimezone(ZoneInfo("UTC"))

        print(f"[update_all_users_sim_time] Updated sim_time: {user.sim_time.isoformat()}")
        session.add(user)

    await session.commit()
    print("[update_all_users_sim_time] Changes committed")
