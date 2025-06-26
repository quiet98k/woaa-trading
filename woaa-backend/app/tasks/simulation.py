import asyncio
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.user_setting import UserSetting
from app.database import async_session_maker

TICK_INTERVAL = 1  # seconds; the loop interval

async def update_simulation_time():
    while True:
        async with async_session_maker() as session:
            await update_all_users_sim_time(session)
        await asyncio.sleep(TICK_INTERVAL)


async def update_all_users_sim_time(session: AsyncSession):
    now = datetime.now(timezone.utc)

    result = await session.execute(select(UserSetting))
    users = result.scalars().all()

    for user in users:
        if user.speed <= 0:
            continue  # paused

        real_elapsed = (now - user.last_updated).total_seconds()
        sim_minutes_to_add = int(real_elapsed * user.speed)

        if sim_minutes_to_add <= 0:
            continue

        for _ in range(sim_minutes_to_add):
            user.sim_time += timedelta(minutes=1)
            await asyncio.sleep(0.1)  # slight delay to simulate smooth flow

        user.last_updated = now
        session.add(user)

    await session.commit()
