# How to Run This Job Portal Project

This project has **two parts**: a **backend** (Python/FastAPI) and a **frontend** (React). You need to run both.

---

## Prerequisites

- **Node.js** (for the frontend) — [nodejs.org](https://nodejs.org)
- **Python 3.9+** (for the backend)
- **MongoDB** — either:
  - Local: [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community), or
  - Cloud: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (free tier)

---

## Step 1: Backend (API on port 8000)

### 1.1 Open a terminal and go to the backend folder

```powershell
cd "d:\job Portal new\backend"
```

### 1.2 Create `.env` (if you don’t have one)

```powershell
copy .env.example .env
```

Edit `backend\.env` and set:

- **MONGO_URL** — MongoDB connection string  
  - Local: `mongodb://localhost:27017`  
  - Atlas: `mongodb+srv://USER:PASSWORD@cluster.xxxxx.mongodb.net`
- **DB_NAME** — e.g. `jobnexus`

### 1.3 Install Python dependencies (first time only)

```powershell
python -m pip install -r requirements.txt
```

### 1.4 Start the backend

```powershell
python server.py
```

Leave this terminal open. You should see something like:

```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

- API: **http://localhost:8000**
- API docs: **http://localhost:8000/docs**

---

## Step 2: Frontend (React on port 3000)

### 2.1 Open a **second** terminal and go to the frontend folder

```powershell
cd "d:\job Portal new\frontend"
```

### 2.2 Install npm dependencies (first time only)

```powershell
npm install
```

### 2.3 Start the frontend

```powershell
npm start
```

Leave this terminal open. The app will open in the browser at **http://localhost:3000**.

---

## Step 3: Use the app

1. Backend running on **http://localhost:8000**
2. Frontend running on **http://localhost:3000**
3. Open **http://localhost:3000** in your browser and use the app.

### Demo login

- **Email:** admin@jobconnect.com  
- **Password:** Admin@123  

(Super admin is created automatically on first backend start if MongoDB is empty.)

---

## Quick reference

| Part      | Folder    | Start command           | URL                    |
|----------|-----------|-------------------------|------------------------|
| Backend  | `backend` | `python server.py`      | http://localhost:8000 |
| Frontend | `frontend`| `npm start`             | http://localhost:3000 |

---

## Troubleshooting

- **“Cannot connect to server”** — Start the backend first (`python server.py` in `backend`).
- **“No module named 'fastapi'”** — Run `python -m pip install -r requirements.txt` in `backend`.
- **MongoDB connection error** — Check `MONGO_URL` in `backend\.env` and that MongoDB is running (or Atlas cluster is reachable).
- **Frontend can’t reach API** — Ensure `frontend\.env` has `REACT_APP_BACKEND_URL=http://localhost:8000` (or create it from that line).
