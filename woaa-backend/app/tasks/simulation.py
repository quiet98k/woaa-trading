import asyncio
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.user_setting import UserSetting
from app.database import async_session_maker

TICK_INTERVAL = 1  # seconds

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
        if user.paused or user.speed <= 0:
            continue  # Skip updates if paused or speed is invalid

        elapsed_real_seconds = (now - user.last_updated).total_seconds()
        sim_time_delta = timedelta(seconds=elapsed_real_seconds * user.speed)

        user.sim_time += sim_time_delta
        user.last_updated = now
        session.add(user)

    await session.commit()
