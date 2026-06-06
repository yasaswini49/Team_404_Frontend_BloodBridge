# BloodBridge Frontend

React + Vite frontend for the BloodBridge blood donor coordination platform.

## Stack

- React 19 + TypeScript + Vite
- shadcn/ui components + Tailwind CSS v4
- Framer Motion animations
- lucide-react icons

## Environment

Copy `.env.example` to `.env` and set the backend URL:

```env
VITE_API_BASE=http://localhost:8000/api
```

Change the host/port when deploying to a remote backend.

## Setup

```bash
npm install
npm run dev
```

Frontend: http://localhost:5173  
Backend: http://localhost:8000 (run separately from `Team_404_BloodBridge`)

## Backend

```bash
cd ../Team_404_BloodBridge
docker-compose up -d   # or: uvicorn main:app --reload
```

## Build

```bash
npm run build
```

Output in `dist/`.
