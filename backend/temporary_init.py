from app.database import get_db, AsyncSessionLocal
from app.models import User
from app.security import get_password_hash

async def create_first_admin():
    async with AsyncSessionLocal() as session:
        admin = User(
            username="superadmin",
            email="new@email.com",
            password_hash=get_password_hash("AdminPass123!"),
            role="admin",
            first_name = "Иван",
            last_name = "Василевский"
        )
        session.add(admin)
        await session.commit()

if __name__ == "__main__":
    import asyncio
    asyncio.run(create_first_admin())