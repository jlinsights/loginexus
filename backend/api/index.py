from app.main import app

# Vercel requires a variable named 'app' to be the entry point
# We already have 'app' from app.main, but we re-export it here explicitly if needed.
# The @vercel/python builder looks for 'app' in the specified file.
