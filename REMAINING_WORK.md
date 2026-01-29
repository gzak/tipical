# Tipical - Remaining Work Items

## Overview
This document tracks all remaining implementation tasks for the Tipical application. The backend is 100% complete. The frontend foundation (types, stores, services) is complete. The remaining work is primarily React components and UI implementation.

---

## Frontend Components

### 1. React Query Setup
**Status**: ✅ Complete
**Priority**: High
**Location**: `src/main.tsx`

**Tasks**:
- [x] Install `@tanstack/react-query` (already installed)
- [x] Install `@tanstack/react-query-devtools`
- [x] Create `QueryClient` instance
- [x] Wrap app with `QueryClientProvider`
- [x] Add React Query DevTools (for development)
- [x] Configure default query options (staleTime: 5min, gcTime: 10min, retry: 1)

**Files Modified**:
- `src/main.tsx` - Added QueryClient configuration and provider

---

### 2. Google OAuth Provider Setup
**Status**: ✅ Complete
**Priority**: High
**Location**: `src/main.tsx`

**Tasks**:
- [x] Install `@react-oauth/google` (already installed)
- [x] Wrap app with `GoogleOAuthProvider`
- [x] Configure with `VITE_GOOGLE_OAUTH_CLIENT_ID`
- [x] Ensure proper provider nesting (GoogleOAuth → QueryClient → App)
- [x] Add environment variable validation

**Files Modified**:
- `src/main.tsx` - Added GoogleOAuthProvider wrapper
- `src/types/index.ts` - Fixed TypeScript enum to use const object pattern for compatibility with `erasableSyntaxOnly`
- `src/services/*.ts` - Updated imports to use type-only imports for `verbatimModuleSyntax`

---

### 3. Authentication Components
**Status**: ⏳ Not Started
**Priority**: High
**Location**: `src/components/auth/`

#### 3.1 GoogleAuthModal Component
**Tasks**:
- [ ] Create modal component using `@react-oauth/google`
- [ ] Add `GoogleLogin` button
- [ ] Handle successful login callback
- [ ] Exchange Google token for JWT via backend
- [ ] Update authStore with token and user info
- [ ] Handle errors gracefully
- [ ] Close modal on success
- [ ] Style with Tailwind CSS

**Files to Create**:
- `src/components/auth/GoogleAuthModal.tsx`

**Dependencies**:
- `@react-oauth/google`
- `src/services/authService.ts` (✅ created)
- `src/stores/authStore.ts` (✅ created)
- `src/stores/uiStore.ts` (✅ created)

#### 3.2 UserProfile Component
**Tasks**:
- [ ] Create user avatar dropdown component
- [ ] Display user name, email, and picture
- [ ] Add "Sign Out" button
- [ ] Handle sign out (clear authStore)
- [ ] Position in top-right corner
- [ ] Responsive design for mobile

**Files to Create**:
- `src/components/auth/UserProfile.tsx`

---

### 4. Common UI Components
**Status**: ✅ Complete
**Priority**: High
**Location**: `src/components/common/`

**Tasks**:
- [x] Create `Modal.tsx` (base modal component with backdrop, ESC key support)
- [x] Create `Button.tsx` (reusable button with variants: primary, secondary, danger, success, ghost)
- [x] Create `Sidebar.tsx` (sliding panel with left/right positioning, multiple widths)
- [x] Create `Loading.tsx` (loading spinner with size options and fullScreen mode)
- [x] Create `ErrorMessage.tsx` (error display component with retry button)
- [x] Create `index.ts` (barrel export for all common components)

**Files Created**:
- `src/components/common/Button.tsx` - Reusable button with loading state and variants
- `src/components/common/Modal.tsx` - Modal with ESC key, backdrop click, and customizable size
- `src/components/common/Sidebar.tsx` - Sliding sidebar panel with smooth animations
- `src/components/common/Loading.tsx` - Animated loading spinner component
- `src/components/common/ErrorMessage.tsx` - Error display with icon and retry action
- `src/components/common/index.ts` - Centralized exports for easy importing

---

### 5. Google Maps Integration
**Status**: ⏳ Not Started
**Priority**: High
**Location**: `src/components/map/`

#### 5.1 GoogleMap Component
**Tasks**:
- [ ] Install `@react-google-maps/api` (already installed)
- [ ] Create `useLoadScript` hook for Maps API
- [ ] Create `GoogleMap` component with full-screen layout
- [ ] Configure with `VITE_GOOGLE_MAPS_API_KEY`
- [ ] Connect to mapStore for center/zoom state
- [ ] Handle map click events
- [ ] Add user location marker (blue dot)

**Files to Create**:
- `src/components/map/GoogleMap.tsx`

**Dependencies**:
- `@react-google-maps/api`
- `src/stores/mapStore.ts` (✅ created)

#### 5.2 BusinessMarker Component
**Tasks**:
- [ ] Create custom marker component for businesses
- [ ] Color-code by winning tipping policy:
  - 🟢 Green = NoTips
  - 🟡 Yellow = TipsExcludeTax
  - 🔴 Red = TipsIncludeTax
  - ⚪ Gray = Unknown
- [ ] Handle marker click to open business panel
- [ ] Add hover effects
- [ ] Cluster markers when zoomed out (optional)

**Files to Create**:
- `src/components/map/BusinessMarker.tsx`

**Dependencies**:
- `src/stores/uiStore.ts` (✅ created)
- `src/types/index.ts` (✅ created)

#### 5.3 BusinessInfoWindow Component
**Tasks**:
- [ ] Create info window for marker quick preview
- [ ] Display business name
- [ ] Display winning policy badge
- [ ] Add "View Details" button
- [ ] Handle close event

**Files to Create**:
- `src/components/map/BusinessInfoWindow.tsx`

---

### 6. Search Functionality
**Status**: ⏳ Not Started
**Priority**: High
**Location**: `src/components/search/`

#### 6.1 SearchBar Component
**Tasks**:
- [ ] Create search input component (fixed at top)
- [ ] Add text input with search icon
- [ ] Implement debouncing (300ms)
- [ ] Integrate with Google Places Autocomplete (optional)
- [ ] Handle search submission
- [ ] Use React Query to fetch results
- [ ] Add "Use My Location" button
- [ ] Show loading state during search

**Files to Create**:
- `src/components/search/SearchBar.tsx`

**Dependencies**:
- `src/services/businessService.ts` (✅ created)
- `@tanstack/react-query`

#### 6.2 SearchResults Component
**Tasks**:
- [ ] Create collapsible sidebar for results
- [ ] Display list of businesses
- [ ] Show business name, address, and policy badge
- [ ] Sort by tipping policy ranking (NoTips first)
- [ ] Handle business selection to open detail panel
- [ ] Add empty state message
- [ ] Make responsive (hide on mobile by default)

**Files to Create**:
- `src/components/search/SearchResults.tsx`

---

### 7. Business Detail Components
**Status**: ⏳ Not Started
**Priority**: High
**Location**: `src/components/business/`

#### 7.1 BusinessDetailPanel Component
**Tasks**:
- [ ] Create sliding sidebar panel
- [ ] Fetch business details on open
- [ ] Display business information:
  - Name
  - Address
  - Phone
  - Website (as link)
  - Place types
- [ ] Embed TippingPolicyDisplay component
- [ ] Embed TippingPolicySelector component
- [ ] Add close button
- [ ] Responsive: full-screen on mobile
- [ ] Show loading state while fetching

**Files to Create**:
- `src/components/business/BusinessDetailPanel.tsx`

**Dependencies**:
- `src/services/businessService.ts` (✅ created)
- `src/stores/uiStore.ts` (✅ created)

---

### 8. Tipping Policy Components
**Status**: ⏳ Not Started
**Priority**: High
**Location**: `src/components/tipping/`

#### 8.1 TippingPolicyDisplay Component
**Tasks**:
- [ ] Create component to show winning policy
- [ ] Display policy with color-coded badge:
  - 🟢 Green background for NoTips
  - 🟡 Yellow background for TipsExcludeTax
  - 🔴 Red background for TipsIncludeTax
  - ⚪ Gray for Unknown
- [ ] Show vote count (e.g., "15 people say: No Tips")
- [ ] Show "Unknown" message if no votes
- [ ] Add message: "Be the first to share the tipping policy"
- [ ] Use React Query to fetch vote aggregate

**Files to Create**:
- `src/components/tipping/TippingPolicyDisplay.tsx`

**Dependencies**:
- `src/services/tippingService.ts` (✅ created)
- `@tanstack/react-query`

#### 8.2 TippingPolicySelector Component
**Tasks**:
- [ ] Create 3-button voting interface
- [ ] Buttons:
  - "No Tips" (green)
  - "Tips Exclude Tax" (yellow)
  - "Tips Include Tax" (red)
- [ ] Highlight user's current vote if exists
- [ ] Check authentication before allowing vote
- [ ] Open auth modal if not logged in
- [ ] Submit vote on button click
- [ ] Use React Query mutation for optimistic updates
- [ ] Show success feedback
- [ ] Handle errors
- [ ] Disable buttons while submitting

**Files to Create**:
- `src/components/tipping/TippingPolicySelector.tsx`

**Dependencies**:
- `src/services/tippingService.ts` (✅ created)
- `src/stores/authStore.ts` (✅ created)
- `src/stores/uiStore.ts` (✅ created)
- `@tanstack/react-query`

---

### 9. Custom Hooks
**Status**: ⏳ Not Started
**Priority**: Medium
**Location**: `src/hooks/`

**Tasks**:
- [ ] Create `useGeolocation.ts` - Get user's location
- [ ] Create `useDebounce.ts` - Debounce search input
- [ ] Create `useBusinessSearch.ts` - React Query hook for search
- [ ] Create `useTippingData.ts` - React Query hook for voting

**Files to Create**:
- `src/hooks/useGeolocation.ts`
- `src/hooks/useDebounce.ts`
- `src/hooks/useBusinessSearch.ts`
- `src/hooks/useTippingData.ts`

---

### 10. Main App Layout
**Status**: ⏳ Not Started
**Priority**: High
**Location**: `src/App.tsx`

**Tasks**:
- [ ] Replace default Vite template with custom layout
- [ ] Create full-screen map layout
- [ ] Add fixed SearchBar at top
- [ ] Add SearchResults sidebar (collapsible)
- [ ] Add BusinessDetailPanel sidebar (slides in)
- [ ] Add UserProfile in top-right
- [ ] Add GoogleAuthModal (conditionally rendered)
- [ ] Position all components correctly
- [ ] Make responsive for mobile
- [ ] Add z-index management

**Files to Modify**:
- `src/App.tsx` (replace existing content)

**Dependencies**:
- All components created above

---

### 11. App Providers Setup
**Status**: ⏳ Not Started
**Priority**: High
**Location**: `src/main.tsx`

**Tasks**:
- [ ] Import and configure providers
- [ ] Provider nesting order:
  1. `GoogleOAuthProvider` (outermost)
  2. `QueryClientProvider`
  3. `App` component
- [ ] Clean up default Vite template code
- [ ] Ensure environment variables are loaded

**Files to Modify**:
- `src/main.tsx`

---

## UI/UX Polish

### 12. Responsive Design
**Status**: ⏳ Not Started
**Priority**: Medium
**Location**: All components

**Tasks**:
- [ ] Test on mobile viewport (< 768px)
- [ ] Make sidebars full-screen on mobile
- [ ] Ensure touch interactions work on map
- [ ] Make search bar mobile-friendly
- [ ] Stack UI elements vertically on small screens
- [ ] Test on tablet viewport (768px - 1024px)
- [ ] Add hamburger menu for mobile (if needed)

---

### 13. Error Handling
**Status**: ⏳ Not Started
**Priority**: Medium
**Location**: Multiple files

**Tasks**:
- [ ] Create `ErrorBoundary` component
- [ ] Add error states to all React Query hooks
- [ ] Display user-friendly error messages
- [ ] Handle network errors gracefully
- [ ] Add retry logic for failed requests
- [ ] Handle 401 unauthorized errors (clear auth)
- [ ] Handle 404 not found errors
- [ ] Log errors to console for debugging

**Files to Create**:
- `src/components/ErrorBoundary.tsx`

---

### 14. Loading States
**Status**: ⏳ Not Started
**Priority**: Medium
**Location**: Multiple components

**Tasks**:
- [ ] Add loading spinners to all async operations
- [ ] Show skeleton screens for business details
- [ ] Add loading state to search results
- [ ] Add loading state to map markers
- [ ] Show loading overlay during authentication
- [ ] Add loading state to vote submission
- [ ] Use consistent loading UI throughout app

---

## Performance Optimization

### 15. Performance Enhancements
**Status**: ⏳ Not Started
**Priority**: Low
**Location**: Multiple files

**Tasks**:
- [ ] Implement React Query caching strategies
- [ ] Add debouncing to search input (300ms)
- [ ] Implement map marker clustering (optional)
- [ ] Use `React.memo` for expensive components
- [ ] Lazy load components with `React.lazy`
- [ ] Optimize bundle size with code splitting
- [ ] Add service worker for offline support (optional)
- [ ] Optimize images and assets

---

## Docker & Deployment

### 16. Frontend Dockerfile
**Status**: ⏳ Not Started
**Priority**: High
**Location**: `tipical-frontend/`

**Tasks**:
- [ ] Create multi-stage Dockerfile
- [ ] Build stage: `npm run build`
- [ ] Runtime stage: nginx to serve static files
- [ ] Create nginx.conf for SPA routing
- [ ] Add to docker-compose.yml
- [ ] Configure environment variables
- [ ] Test containerized build

**Files to Create**:
- `tipical-frontend/Dockerfile`
- `tipical-frontend/nginx.conf`

**Files to Modify**:
- `tipical-backend/docker-compose.yml` (add frontend service)

---

### 17. Production Configuration
**Status**: ⏳ Not Started
**Priority**: Medium
**Location**: Backend & Frontend

**Tasks**:
- [ ] Create production appsettings.json
- [ ] Configure production CORS origins
- [ ] Set up environment variable management
- [ ] Configure HTTPS/SSL
- [ ] Add health check endpoints
- [ ] Configure logging (Serilog or similar)
- [ ] Set up monitoring and alerts
- [ ] Add rate limiting configuration

---

## Testing

### 18. Backend Tests
**Status**: ⏳ Not Started
**Priority**: Low
**Location**: `tipical-backend/tests/`

**Tasks**:
- [ ] Create test projects (xUnit)
- [ ] Unit tests for services
- [ ] Unit tests for repositories
- [ ] Integration tests for controllers
- [ ] Mock Google OAuth for tests
- [ ] Mock Google Places API for tests
- [ ] Test geospatial queries
- [ ] Test vote upsert logic
- [ ] Test winning policy calculation

**Projects to Create**:
- `Tipical.Tests.Unit`
- `Tipical.Tests.Integration`

---

### 19. Frontend Tests
**Status**: ⏳ Not Started
**Priority**: Low
**Location**: `tipical-frontend/src/__tests__/`

**Tasks**:
- [ ] Set up Vitest
- [ ] Set up React Testing Library
- [ ] Unit tests for stores
- [ ] Unit tests for services
- [ ] Component tests for auth components
- [ ] Component tests for map components
- [ ] Component tests for tipping components
- [ ] Mock API calls with MSW
- [ ] Test error handling
- [ ] Test loading states

---

## Documentation

### 20. Google Cloud Setup Guide
**Status**: ⏳ Not Started
**Priority**: High
**Location**: `docs/`

**Tasks**:
- [ ] Write step-by-step Google Cloud setup guide
- [ ] Document how to create project
- [ ] Document how to enable APIs
- [ ] Document OAuth 2.0 configuration
- [ ] Document API key creation and restrictions
- [ ] Document billing alerts setup
- [ ] Add screenshots for key steps
- [ ] Include troubleshooting section

**Files to Create**:
- `docs/GOOGLE_CLOUD_SETUP.md`

---

### 21. Deployment Guide
**Status**: ⏳ Not Started
**Priority**: Medium
**Location**: `docs/`

**Tasks**:
- [ ] Write deployment guide for Azure
- [ ] Write deployment guide for AWS
- [ ] Write deployment guide for DigitalOcean
- [ ] Document database migration process
- [ ] Document environment variable configuration
- [ ] Document CI/CD pipeline setup
- [ ] Include monitoring and logging setup

**Files to Create**:
- `docs/DEPLOYMENT.md`

---

### 22. API Documentation
**Status**: ✅ Partially Complete (Swagger exists)
**Priority**: Low
**Location**: `docs/`

**Tasks**:
- [ ] Add detailed API documentation
- [ ] Document request/response examples
- [ ] Document error codes
- [ ] Document rate limits
- [ ] Add Postman collection
- [ ] Document authentication flow

**Files to Create**:
- `docs/API.md`
- `Tipical.postman_collection.json`

---

## Integration & Verification

### 23. End-to-End Testing
**Status**: ⏳ Not Started
**Priority**: High
**Location**: Manual testing + E2E framework

**Tasks**:
- [ ] Test complete user flow:
  1. Open app
  2. Search for business
  3. Click on business marker
  4. View business details
  5. Sign in with Google
  6. Vote on tipping policy
  7. See vote count update
  8. Change vote
  9. Sign out
- [ ] Test on multiple browsers
- [ ] Test on mobile devices
- [ ] Test with real Google APIs
- [ ] Verify database entries
- [ ] Test concurrent users voting

---

### 24. Database Verification
**Status**: ⏳ Not Started
**Priority**: High
**Location**: PostgreSQL

**Tasks**:
- [ ] Verify PostGIS extension is enabled
- [ ] Verify tables exist (businesses, tipping_votes)
- [ ] Verify unique constraint on (business_id, user_id)
- [ ] Test geospatial queries
- [ ] Verify foreign key constraints
- [ ] Verify indexes are created
- [ ] Check database performance

**SQL Commands**:
```sql
-- Verify tables
\dt

-- Verify PostGIS
SELECT PostGIS_version();

-- Verify constraints
\d tipping_votes

-- Test geospatial query
SELECT * FROM businesses WHERE ST_DWithin(location, ST_MakePoint(-122.4194, 37.7749)::geography, 5000);
```

---

## Priority Summary

### High Priority (Must-Have for MVP)
1. ✅ Backend API (100% complete)
2. ✅ React Query setup (complete)
3. ✅ Google OAuth provider setup (complete)
4. ⏳ Google OAuth components (login modal, user profile)
5. ⏳ Google Maps integration
6. ⏳ Search functionality
7. ⏳ Business detail panel
8. ⏳ Tipping policy display & selector
9. ⏳ Main App layout
10. ⏳ Frontend Dockerfile
11. ⏳ Google Cloud setup guide
12. ⏳ End-to-end testing

### Medium Priority (Important for Production)
12. ⏳ Error handling
13. ⏳ Loading states
14. ⏳ Responsive design
15. ⏳ Production configuration
16. ⏳ Deployment guide

### Low Priority (Nice-to-Have)
18. ⏳ Performance optimizations
19. ⏳ Unit/Integration tests
20. ⏳ API documentation enhancements
21. ⏳ Marker clustering
22. ⏳ Service worker/PWA

---

## Estimated Completion Time

Based on complexity:
- **High Priority Items**: 16-24 hours
- **Medium Priority Items**: 8-12 hours
- **Low Priority Items**: 8-16 hours
- **Total**: 32-52 hours

---

## Notes

- All backend work is complete and tested
- Frontend foundation (types, stores, services) is complete
- Main remaining work is React component implementation
- No blockers - all dependencies are ready
- Can start with any High Priority item

---

## Getting Started with Remaining Work

Recommended order:
1. Set up React Query and providers (`main.tsx`)
2. Create common UI components (Button, Modal, Sidebar)
3. Implement Google OAuth modal
4. Create Google Maps component
5. Build search bar and results
6. Create business detail panel
7. Implement tipping policy components
8. Assemble main App layout
9. Add error handling and loading states
10. Test end-to-end
