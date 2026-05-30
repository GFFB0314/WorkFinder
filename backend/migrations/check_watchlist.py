from app.database import SessionLocal
from app.models import Watchlist

db = SessionLocal()
watchlists = db.query(Watchlist).all()

if not watchlists:
    print("No watchlists found in database")
else:
    for wl in watchlists:
        print(f"Watchlist ID: {wl.id}")
        print(f"  Keywords: {wl.keywords}")
        print(f"  Active: {wl.active}")
        print(f"  Location: {wl.location}")
        print(f"  Remote Only: {wl.remote_only}")
        print(f"  Experience: {wl.experience_level}")
        print(f"  Frequency: {wl.frequency}")
        print()

db.close()
