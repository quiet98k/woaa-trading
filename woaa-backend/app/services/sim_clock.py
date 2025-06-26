"""
Background simulation time updater for all users.
"""

import asyncio
from sqlalchemy import UUID
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.user_setting import UserSetting
from app.services.sim_ws import sim_time_manager
from datetime import datetime, timedelta, timezone


async def update_all_users_sim_time():
    """
    Run forever: check each user's sim_time and advance if needed.
    """
    last_tick: dict[UUID, datetime] = {}

    while True:
        await asyncio.sleep(1)

        db: Session = SessionLocal()
        try:
            users = db.query(UserSetting).all()
            now = datetime.now(timezone.utc)

            for user in users:
                sim_now = user.sim_time
                speed = user.speed

                # Calculate real-world time interval required for 1 sim minute
                real_seconds_per_sim_minute = 60.0 / speed
                last_time = last_tick.get(user.user_id, now)

                # If enough real time has passed, tick forward
                if (now - last_time).total_seconds() >= real_seconds_per_sim_minute:
                    user.sim_time += timedelta(minutes=1)
                    user.updated_at = now
                    last_tick[user.user_id] = now

                    db.commit()
                    db.refresh(user)

                    await sim_time_manager.send_sim_time(user.user_id, user.sim_time.isoformat())

        except Exception as e:
            print(f"[SimTime Error] {e}")
        finally:
            db.close()
