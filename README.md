# Tipical - Tipping Information Crowd-Sourced App

Full-stack single-page app for crowd-sourcing business tipping practices.

## Tech Stack

### Backend (.NET 10.0)
- ASP.NET Core Web API
- Entity Framework Core 10.0 with PostgreSQL & PostGIS
- Google OAuth 2.0 with JWT tokens
- Swagger/OpenAPI documentation

### Frontend (React 19.2.3)
- React 19.2.3 with TypeScript
- Vite build tool
- TanStack Query (React Query)
- Zustand state management
- Tailwind CSS
- Google Maps JavaScript API
- Google OAuth integration

## Project Structure

```
tipical/
├── tipical-backend/          # .NET 10.0 API
│   ├── src/
│   │   ├── Tipical.Api/           # Web API controllers
│   │   ├── Tipical.Core/          # Domain models & interfaces
│   │   └── Tipical.Infrastructure/ # Data access & services
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── .env.example
└── tipical-frontend/         # React SPA
    ├── src/
    │   ├── components/            # React components
    │   ├── services/              # API services
    │   ├── stores/                # Zustand stores
    │   ├── types/                 # TypeScript types
    │   └── hooks/                 # Custom React hooks
    ├── .env.example
    └── package.json
```

## Quick Start

### Prerequisites
- .NET 10.0 SDK
- Node.js 18+
- Docker & Docker Compose (with Rosetta enabled on Apple Silicon)
- Google Cloud Platform account (for API keys)

### Backend Setup

1. Navigate to backend directory:
```bash
cd tipical-backend
```

2. Copy environment example:
```bash
cp .env.example .env
```

3. Update `.env` with your Google API keys and JWT secret

4. Start the API and PostgreSQL:
```bash
docker compose up --build -d
```

5. Run migrations (from repo root):
```bash
dotnet ef database update \
  --project tipical-backend/src/Tipical.Infrastructure \
  --startup-project tipical-backend/src/Tipical.Api
```

API will be available at `http://localhost:5050`
Swagger UI at `http://localhost:5050/swagger`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd tipical-frontend
```

2. Copy environment example:
```bash
cp .env.example .env
```

3. Update `.env` with your Google Maps & OAuth credentials

4. Install dependencies:
```bash
npm install
```

5. Start dev server:
```bash
npm run dev
```

Frontend will be available at `http://localhost:5173`

## API Endpoints

### Authentication
- `POST /api/v1/auth/google` - Verify Google OAuth token
- `GET /api/v1/auth/me` - Get current user info (authenticated)

### Businesses
- `GET /api/v1/businesses/search` - Search businesses (query is optional; omit for proximity-only results)

### Tipping
- `GET /api/v1/tipping/votes/{businessId}` - Get vote aggregates
- `GET /api/v1/tipping/votes/{businessId}/user` - Get user's vote
- `PUT /api/v1/tipping/votes/{businessId}` - Submit/update vote

## Tipping Policy System

### Policy Types
- **NoTips** (0) - Best: No tips requested
- **TipsExcludeTax** (1) - Middle: Tips calculated before tax
- **TipsIncludeTax** (2) - Worst: Tips calculated on post-tax total

### Voting Rules
- One vote per user per business
- Users can change their vote anytime
- Winning policy = most votes
- Rankings: NoTips > TipsExcludeTax > TipsIncludeTax

### Visual Design
- 🟢 Green = NoTips
- 🟡 Yellow = TipsExcludeTax
- 🔴 Red = TipsIncludeTax
- ⚪ Gray = Unknown (no votes)

## Google Cloud Setup

1. Create Google Cloud project
2. Enable APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
3. Create OAuth 2.0 Client ID for web app
4. Create API keys (backend & frontend)
5. Configure authorized origins/redirect URIs

## Database Schema

### businesses
- id (UUID)
- google_place_id (VARCHAR, unique, nullable)
- name, address
- latitude, longitude
- location (PostGIS geography point)
- place_types (TEXT[])
- phone, website
- timestamps

### tipping_votes
- id (UUID)
- business_id (FK to businesses)
- user_id (Google user ID)
- tipping_policy (ENUM: 0, 1, 2)
- timestamps
- UNIQUE(business_id, user_id)

## Docker Deployment (local)

```bash
cd tipical-backend
docker compose up --build
```

Services:
- postgres: `localhost:6543`
- api: `localhost:5050`

## Development Notes

### Backend
- Migrations are in `tipical-backend/src/Tipical.Infrastructure/Migrations/`
- Connection string in `appsettings.json`
- PostGIS enabled for geospatial queries

### Frontend
- Vite dev server with HMR
- Tailwind JIT compilation
- TypeScript strict mode

## License

MIT

## Contributors

Built with Claude Code
