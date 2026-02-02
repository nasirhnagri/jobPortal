# Job Portal Backend (FastAPI)

## Run the API

1. **Create `.env`** from the example (if you don't have one):
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set at least:
   - `MONGO_URL` – MongoDB connection string (e.g. `mongodb://localhost:27017`)
   - `DB_NAME` – Database name (e.g. `jobnexus`)

2. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Start the server** (listens on http://localhost:8000):
   ```bash
   python server.py
   ```
   Or with uvicorn directly:
   ```bash
   uvicorn server:app --host 0.0.0.0 --port 8000
   ```

4. **Optional:** Set `CORS_ORIGINS=http://localhost:3000` in `.env` if the frontend runs on port 3000 and you want to restrict CORS.

5. **API docs:** http://localhost:8000/docs

## Demo login

- **Super Admin:** admin@jobconnect.com / Admin@123
