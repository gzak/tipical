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

## Current Implementation Status

### ✅ Completed - Backend
1. ✅ Solution structure with 3 projects (Api, Core, Infrastructure)
2. ✅ PostgreSQL with PostGIS via docker-compose
3. ✅ Core models (Business, TippingVote, TippingPolicy enum)
4. ✅ Entity Framework Core with PostGIS migrations
5. ✅ JWT authentication configuration
6. ✅ Google OAuth service implementation
7. ✅ Auth Controller (/google, /me endpoints)
8. ✅ Google Places Service integration
9. ✅ Business repository with geospatial queries
10. ✅ Businesses Controller (search, nearby endpoints)
11. ✅ Tipping Vote repository with upsert logic
12. ✅ Tipping Controller (vote endpoints)
13. ✅ Middleware (CORS, exception handling)
14. ✅ Swagger configuration
15. ✅ Backend Dockerfile & docker-compose

### ✅ Completed - Frontend Foundation
1. ✅ Vite + React + TypeScript project
2. ✅ Tailwind CSS configuration
3. ✅ TypeScript types & interfaces
4. ✅ Zustand stores (auth, UI, map)
5. ✅ API service layer (auth, business, tipping)
6. ✅ Axios with auth interceptors

### 🚧 Remaining - Frontend Components
1. ⏳ React Query setup & providers
2. ⏳ Google OAuth components
3. ⏳ Google Maps integration
4. ⏳ Search bar & results
5. ⏳ Business detail panel
6. ⏳ Tipping policy display & selector
7. ⏳ Main App layout
8. ⏳ Responsive design
9. ⏳ Error handling & loading states

## Quick Start

### Prerequisites
- .NET 10.0 SDK
- Node.js 18+
- Docker & Docker Compose
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

3. Update `.env` with your Google API keys

4. Start PostgreSQL:
```bash
docker-compose up postgres -d
```

5. Run migrations:
```bash
cd src/Tipical.Infrastructure
dotnet ef database update --startup-project ../Tipical.Api/Tipical.Api.csproj
```

6. Run the API:
```bash
cd ../Tipical.Api
dotnet run
```

API will be available at `http://localhost:5000`
Swagger UI at `http://localhost:5000/swagger`

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
- `GET /api/v1/businesses/search` - Search businesses
- `GET /api/v1/businesses/{id}` - Get business by ID
- `GET /api/v1/businesses/nearby` - Get nearby businesses

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

## Docker Deployment

Build and run everything with Docker Compose:
```bash
cd tipical-backend
docker-compose up --build
```

Services:
- postgres: `localhost:5432`
- api: `localhost:5000`

## Development Notes

### Backend
- Migrations are in `tipical-backend/src/Tipical.Infrastructure/Migrations/`
- Connection string in `appsettings.json`
- PostGIS enabled for geospatial queries

### Frontend
- Vite dev server with HMR
- Tailwind JIT compilation
- TypeScript strict mode

## Next Steps

1. Complete React components implementation
2. Integrate Google Maps API
3. Add Google OAuth flow
4. Build business search UI
5. Create tipping vote interface
6. Add responsive mobile design
7. Implement error boundaries
8. Add loading states
9. Performance optimization
10. E2E testing

## License

MIT

## Contributors

Built with Claude Code
