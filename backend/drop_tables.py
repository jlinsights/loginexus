from app.database import engine
from app import models
# Import models to ensure they are registered (though import app.models should suffice if it imports them)
# But models.py contains the classes directly so it's fine.

print("Dropping all tables...")
models.Base.metadata.drop_all(bind=engine)
print("All tables dropped successfully.")
