# Testing Plan: Authentication Components

## Overview
This document provides a comprehensive testing plan for the GoogleAuthModal and UserProfile components, covering functional testing, integration testing, edge cases, accessibility, and responsive design.

---

## 1. GoogleAuthModal Component Testing

### 1.1 Basic Functionality

#### Test: Modal Visibility Control
- **Setup:** Start with `uiStore.showAuthModal = false`
- **Action:** Set `uiStore.setShowAuthModal(true)`
- **Expected:** Modal appears with "Sign In" title
- **Action:** Close modal (X button or backdrop click)
- **Expected:** Modal disappears, `uiStore.showAuthModal = false`

#### Test: GoogleLogin Button Display
- **Setup:** Open modal
- **Expected:** GoogleLogin button is visible and centered
- **Expected:** No error messages displayed initially
- **Expected:** Not in loading state

### 1.2 Authentication Flow

#### Test: Successful Google Authentication
- **Setup:** Open modal
- **Action:** Click GoogleLogin button
- **Action:** Complete Google OAuth flow successfully
- **Expected:** Modal shows loading state
- **Expected:** Token exchange occurs (check network tab for POST to `/auth/google`)
- **Expected:** On success, modal closes automatically
- **Expected:** `authStore.token` is set (check localStorage: 'tipical-auth')
- **Expected:** `authStore.user` contains userId, email, name, picture
- **Expected:** No error messages remain

#### Test: Failed Google Authentication (User Cancels)
- **Setup:** Open modal
- **Action:** Click GoogleLogin button
- **Action:** Cancel Google OAuth flow
- **Expected:** Error message displays: "Failed to authenticate with Google. Please try again."
- **Expected:** Modal remains open
- **Expected:** GoogleLogin button is still available
- **Expected:** No loading state

#### Test: Failed Token Exchange (Backend Error)
- **Setup:** Open modal, modify backend to return 401
- **Action:** Complete Google OAuth flow
- **Expected:** Loading state shows during exchange
- **Expected:** Error message displays: "Invalid credentials. Please try again."
- **Expected:** Modal remains open
- **Expected:** Loading state ends
- **Expected:** Auth state is NOT set

#### Test: Network Error
- **Setup:** Open modal, disable network or stop backend
- **Action:** Complete Google OAuth flow
- **Expected:** Error message displays: "Unable to sign in. Please try again later."
- **Expected:** Modal remains open
- **Expected:** User can retry

### 1.3 Loading States

#### Test: Loading During Token Exchange
- **Setup:** Add artificial delay to authService.googleAuth
- **Action:** Complete Google OAuth flow
- **Expected:** Loading spinner appears
- **Expected:** "Authenticating..." text displays
- **Expected:** GoogleLogin button is hidden
- **Expected:** Modal cannot be closed (Escape and backdrop clicks disabled)
- **Expected:** Close button (X) is disabled or hidden

#### Test: Loading Indicator Clears on Success
- **Action:** Complete successful authentication
- **Expected:** Loading state ends
- **Expected:** Modal closes immediately

#### Test: Loading Indicator Clears on Error
- **Action:** Trigger authentication error
- **Expected:** Loading state ends
- **Expected:** Error message appears
- **Expected:** User can retry

### 1.4 Error Handling

#### Test: Error Message Display
- **Action:** Trigger any error scenario
- **Expected:** ErrorMessage component renders
- **Expected:** Error title and message are user-friendly
- **Expected:** Error icon is visible
- **Expected:** Retry button is present

#### Test: Retry Functionality
- **Setup:** Trigger error to show error message
- **Action:** Click "Try Again" button
- **Expected:** Error message clears
- **Expected:** GoogleLogin button reappears
- **Expected:** User can attempt authentication again

#### Test: Multiple Error Scenarios
- **Test Case 1:** Google auth fails → Error shows
- **Test Case 2:** Backend returns 401 → Different error message
- **Test Case 3:** Network timeout → Network-specific error
- **Expected:** Each error has appropriate message

### 1.5 Modal Interaction

#### Test: Escape Key to Close
- **Setup:** Open modal (not loading)
- **Action:** Press Escape key
- **Expected:** Modal closes
- **Expected:** `uiStore.showAuthModal = false`

#### Test: Escape Key Disabled During Loading
- **Setup:** Open modal, trigger authentication (loading state)
- **Action:** Press Escape key
- **Expected:** Modal remains open
- **Expected:** Loading continues

#### Test: Backdrop Click to Close
- **Setup:** Open modal (not loading)
- **Action:** Click outside modal (on backdrop)
- **Expected:** Modal closes

#### Test: Backdrop Click Disabled During Loading
- **Setup:** Open modal, trigger authentication (loading state)
- **Action:** Click backdrop
- **Expected:** Modal remains open

#### Test: Close Button (X) Click
- **Setup:** Open modal
- **Action:** Click X button
- **Expected:** Modal closes
- **Expected:** Error state clears

### 1.6 State Management

#### Test: Auth State Persistence
- **Action:** Complete successful authentication
- **Action:** Refresh browser page
- **Expected:** User remains authenticated
- **Expected:** localStorage contains 'tipical-auth' with token and user

#### Test: Error State Clears on Close
- **Setup:** Trigger error to show error message
- **Action:** Close modal
- **Action:** Reopen modal
- **Expected:** Error message is gone
- **Expected:** Fresh state (GoogleLogin button visible)

---

## 2. UserProfile Component Testing

### 2.1 Basic Functionality

#### Test: Hidden When Not Authenticated
- **Setup:** Clear authStore (not authenticated)
- **Expected:** UserProfile component does not render
- **Expected:** No avatar in top-right corner

#### Test: Visible When Authenticated
- **Setup:** Login (set authStore with token and user)
- **Expected:** UserProfile component renders
- **Expected:** Avatar appears in top-right corner
- **Expected:** User name is visible (or initials if no picture)

### 2.2 Avatar Display

#### Test: Avatar with Picture
- **Setup:** Login with user that has `picture` URL
- **Expected:** Avatar displays user's picture
- **Expected:** Image is circular (40px diameter on desktop)
- **Expected:** Image has proper border and styling

#### Test: Avatar Without Picture (Fallback)
- **Setup:** Login with user that has no `picture`
- **Expected:** Avatar displays first letter of user's name
- **Expected:** Fallback is in a colored circle
- **Expected:** Letter is centered and visible

#### Test: Avatar Image Load Error
- **Setup:** Login with invalid picture URL
- **Expected:** Avatar falls back to initials
- **Expected:** No broken image icon shows

### 2.3 Dropdown Functionality

#### Test: Dropdown Opens on Avatar Click
- **Setup:** Authenticated
- **Action:** Click avatar
- **Expected:** Dropdown menu appears below avatar
- **Expected:** Dropdown is positioned correctly (right-aligned)
- **Expected:** Dropdown has proper z-index (appears above content)

#### Test: Dropdown Shows User Info
- **Setup:** Open dropdown
- **Expected:** User's name is displayed
- **Expected:** User's email is displayed
- **Expected:** Long emails are truncated with ellipsis
- **Expected:** Divider separates info from actions

#### Test: Dropdown Closes on Avatar Click
- **Setup:** Dropdown is open
- **Action:** Click avatar again
- **Expected:** Dropdown closes

#### Test: Dropdown Closes on Outside Click
- **Setup:** Dropdown is open
- **Action:** Click anywhere outside dropdown
- **Expected:** Dropdown closes

#### Test: Dropdown Closes on Escape Key
- **Setup:** Dropdown is open
- **Action:** Press Escape key
- **Expected:** Dropdown closes
- **Expected:** Focus returns to avatar button

### 2.4 Logout Functionality

#### Test: Sign Out Button Click
- **Setup:** Authenticated, dropdown open
- **Action:** Click "Sign Out" button
- **Expected:** `authStore.clearAuth()` is called
- **Expected:** Auth token is removed from localStorage
- **Expected:** User object is cleared
- **Expected:** Dropdown closes
- **Expected:** UserProfile component disappears
- **Expected:** User is logged out

#### Test: State After Logout
- **Action:** Logout as above
- **Action:** Check authStore
- **Expected:** `authStore.token = null`
- **Expected:** `authStore.user = null`
- **Expected:** `authStore.isAuthenticated() = false`

### 2.5 Responsive Design

#### Test: Desktop View (>1024px)
- **Setup:** Desktop viewport
- **Expected:** Avatar is 40px diameter
- **Expected:** Dropdown is 240px wide (w-60)
- **Expected:** Positioned in top-right corner
- **Expected:** Hover effects work

#### Test: Tablet View (768px - 1024px)
- **Setup:** Tablet viewport
- **Expected:** Avatar is 40px diameter
- **Expected:** Dropdown is 240px wide
- **Expected:** Touch-friendly tap targets

#### Test: Mobile View (<768px)
- **Setup:** Mobile viewport (375px width)
- **Expected:** Avatar is 36px diameter
- **Expected:** Dropdown uses max-w-[calc(100vw-2rem)]
- **Expected:** Dropdown doesn't extend beyond viewport
- **Expected:** Right-aligned to screen edge
- **Expected:** Sign Out button has min-height 44px (touch-friendly)

#### Test: Very Small Mobile (<375px)
- **Setup:** Small phone viewport (320px)
- **Expected:** Dropdown scales appropriately
- **Expected:** Text doesn't overflow
- **Expected:** All tap targets are accessible

### 2.6 Accessibility

#### Test: Keyboard Navigation
- **Action:** Tab to avatar
- **Expected:** Avatar receives focus (visible focus ring)
- **Action:** Press Enter or Space
- **Expected:** Dropdown opens
- **Action:** Press Escape
- **Expected:** Dropdown closes, focus returns to avatar

#### Test: Screen Reader Support
- **Setup:** Use screen reader (or check HTML)
- **Expected:** Avatar has aria-label="User menu"
- **Expected:** Avatar has aria-expanded="true/false"
- **Expected:** Avatar has aria-haspopup="true"
- **Expected:** Dropdown has proper role="menu"
- **Expected:** Sign Out button has descriptive text

#### Test: Focus Management
- **Action:** Open dropdown
- **Expected:** Focus moves to first interactive element (Sign Out button)
- **Action:** Close dropdown (Escape or outside click)
- **Expected:** Focus returns to avatar button

#### Test: Color Contrast
- **Setup:** Use accessibility checker (browser DevTools)
- **Expected:** Text meets WCAG AA standards (4.5:1 for normal text)
- **Expected:** Avatar border has sufficient contrast
- **Expected:** Hover/focus states are visible

### 2.7 Edge Cases

#### Test: Very Long Name
- **Setup:** User with name > 30 characters
- **Expected:** Name truncates with ellipsis in dropdown
- **Expected:** Full name visible in tooltip (optional)
- **Expected:** Avatar shows first letter correctly

#### Test: Very Long Email
- **Setup:** User with email > 40 characters
- **Expected:** Email truncates with ellipsis
- **Expected:** Email is still readable
- **Expected:** No horizontal scroll in dropdown

#### Test: Special Characters in Name
- **Setup:** User with name containing emoji or unicode
- **Expected:** Displays correctly in dropdown
- **Expected:** Avatar fallback handles gracefully

#### Test: Rapid Click on Avatar
- **Action:** Click avatar multiple times rapidly
- **Expected:** Dropdown toggles correctly
- **Expected:** No UI glitches
- **Expected:** No duplicate dropdowns

---

## 3. Integration Testing

### 3.1 Full Authentication Flow

#### Test: Complete Login Flow
1. **Initial State:** Not authenticated
2. **Action:** Open GoogleAuthModal (via uiStore)
3. **Expected:** Modal opens, GoogleLogin button visible
4. **Action:** Click GoogleLogin, complete OAuth
5. **Expected:** Modal closes
6. **Expected:** UserProfile appears in top-right
7. **Expected:** Avatar shows user picture or initials
8. **Verification:** Check localStorage for auth data
9. **Verification:** Check authStore.isAuthenticated() = true

#### Test: Complete Logout Flow
1. **Initial State:** Authenticated (from previous test)
2. **Action:** Click UserProfile avatar
3. **Expected:** Dropdown opens
4. **Action:** Click "Sign Out"
5. **Expected:** Dropdown closes
6. **Expected:** UserProfile disappears
7. **Expected:** User is logged out
8. **Verification:** Check localStorage is cleared
9. **Verification:** Check authStore.isAuthenticated() = false

### 3.2 Persistence Testing

#### Test: Auth Persists Across Page Refresh
1. **Setup:** Login successfully
2. **Action:** Refresh browser (F5 or Ctrl+R)
3. **Expected:** UserProfile still visible
4. **Expected:** Still authenticated
5. **Expected:** Token and user data intact in authStore

#### Test: Logout Clears Persistence
1. **Setup:** Authenticated
2. **Action:** Logout
3. **Action:** Refresh browser
4. **Expected:** Still logged out
5. **Expected:** No auth data in localStorage

### 3.3 API Integration

#### Test: Auth Token in API Requests
1. **Setup:** Login successfully
2. **Action:** Make API request (e.g., search businesses)
3. **Expected:** Request includes `Authorization: Bearer {token}` header
4. **Verification:** Check network tab for header

#### Test: 401 Auto-Logout
1. **Setup:** Authenticated with expired/invalid token
2. **Action:** Make API request that returns 401
3. **Expected:** apiClient interceptor catches 401
4. **Expected:** `authStore.clearAuth()` is called
5. **Expected:** UserProfile disappears
6. **Expected:** User is logged out
7. **Expected:** Can re-authenticate

### 3.4 State Synchronization

#### Test: Auth State Sync Between Components
1. **Setup:** Open GoogleAuthModal
2. **Action:** Complete login in modal
3. **Expected:** Modal closes
4. **Expected:** UserProfile appears immediately (reactivity works)
5. **Expected:** Both components use same authStore state

#### Test: Multiple Tabs (Same Browser)
1. **Setup:** Open app in Tab 1
2. **Action:** Login in Tab 1
3. **Action:** Open app in Tab 2
4. **Expected:** Tab 2 shows authenticated state (localStorage shared)
5. **Action:** Logout in Tab 1
6. **Known Limitation:** Tab 2 may not immediately reflect logout (localStorage doesn't sync across tabs in real-time)
7. **Action:** Refresh Tab 2
8. **Expected:** Tab 2 now shows logged out state

---

## 4. Error Scenarios & Edge Cases

### 4.1 Network Errors

#### Test: Offline During Login
- **Setup:** Disable network
- **Action:** Attempt to login
- **Expected:** Error message about network issue
- **Expected:** User can retry when back online

#### Test: Slow Network
- **Setup:** Throttle network to 3G speed
- **Action:** Login
- **Expected:** Loading state shows while waiting
- **Expected:** Eventually succeeds or times out with error

### 4.2 Backend Errors

#### Test: Backend Unavailable
- **Setup:** Stop backend server
- **Action:** Attempt to login
- **Expected:** Error message displayed
- **Expected:** User can retry

#### Test: Backend Returns Invalid Data
- **Setup:** Mock backend to return malformed response
- **Action:** Login
- **Expected:** Error handling catches issue
- **Expected:** User-friendly error message

### 4.3 Google OAuth Errors

#### Test: Popup Blocked
- **Setup:** Browser blocks popups (if using popup mode)
- **Action:** Click GoogleLogin
- **Expected:** Error or instruction to enable popups
- **Note:** GoogleLogin uses modal by default, not popup

#### Test: Google Services Unavailable
- **Setup:** Mock Google OAuth to be unavailable
- **Action:** Click GoogleLogin
- **Expected:** Error message displayed

### 4.4 Browser Compatibility

#### Test: LocalStorage Disabled
- **Setup:** Disable localStorage in browser settings
- **Action:** Login
- **Expected:** May work in session but won't persist
- **Known Limitation:** Zustand persist middleware may fail gracefully

#### Test: Cookies Disabled
- **Action:** Disable cookies
- **Expected:** OAuth flow may be affected
- **Test:** Verify if affects Google OAuth

### 4.5 Race Conditions

#### Test: Rapid Login/Logout
- **Action:** Login, immediately logout, login again
- **Expected:** State remains consistent
- **Expected:** No stale data

#### Test: Concurrent Login Attempts
- **Action:** Click GoogleLogin multiple times quickly
- **Expected:** Only one auth flow executes
- **Expected:** No duplicate API calls

---

## 5. Accessibility Testing

### 5.1 Screen Reader Testing

#### Test: VoiceOver (macOS) / NVDA (Windows)
- **Action:** Navigate with screen reader
- **Expected:** All interactive elements are announced
- **Expected:** Modal announces when opened
- **Expected:** Dropdown announces when opened
- **Expected:** Button roles are correct

### 5.2 Keyboard-Only Navigation

#### Test: Complete Flow Without Mouse
- **Action:** Tab through entire flow
- **Expected:** Can open modal (trigger button needed)
- **Expected:** Can activate GoogleLogin with Enter/Space
- **Expected:** Can close modal with Escape
- **Expected:** Can open UserProfile dropdown
- **Expected:** Can activate Sign Out
- **Expected:** Focus is always visible

### 5.3 High Contrast Mode

#### Test: Windows High Contrast
- **Setup:** Enable Windows high contrast mode
- **Expected:** All UI elements remain visible
- **Expected:** Borders and text have sufficient contrast

### 5.4 Text Scaling

#### Test: Browser Zoom (200%)
- **Action:** Zoom browser to 200%
- **Expected:** Modal remains usable
- **Expected:** Dropdown remains usable
- **Expected:** No text overflow

#### Test: OS Text Scaling
- **Setup:** Increase OS font size
- **Expected:** Text scales appropriately
- **Expected:** Layout adapts

---

## 6. Performance Testing

### 6.1 Render Performance

#### Test: Modal Open/Close Speed
- **Action:** Open and close modal repeatedly
- **Expected:** Smooth animations
- **Expected:** No lag or jank
- **Metric:** < 100ms to open/close

#### Test: Dropdown Toggle Speed
- **Action:** Toggle dropdown repeatedly
- **Expected:** Instant response
- **Expected:** Smooth animation

### 6.2 Network Performance

#### Test: Token Exchange Duration
- **Action:** Complete login
- **Metric:** Token exchange should complete in < 2 seconds (normal network)
- **Expected:** Loading indicator shows during wait

### 6.3 Memory Leaks

#### Test: Event Listener Cleanup
- **Action:** Mount/unmount components repeatedly
- **Expected:** No memory leaks in event listeners
- **Verification:** Use browser DevTools memory profiler

---

## 7. Visual Regression Testing

### 7.1 Modal Appearance

#### Test: Modal Layout (Desktop)
- **Verify:** Modal centered on screen
- **Verify:** Proper spacing and padding
- **Verify:** GoogleLogin button centered
- **Verify:** Close button (X) in top-right

#### Test: Modal Layout (Mobile)
- **Verify:** Modal has horizontal margins (mx-4)
- **Verify:** Content is readable
- **Verify:** Button sizes are appropriate

### 7.2 UserProfile Appearance

#### Test: Avatar Styling
- **Verify:** Circular shape (rounded-full)
- **Verify:** Proper border color
- **Verify:** Hover effects work
- **Verify:** Focus ring visible

#### Test: Dropdown Styling
- **Verify:** Proper shadow (shadow-xl)
- **Verify:** Rounded corners (rounded-lg)
- **Verify:** Proper spacing (p-2, p-3)
- **Verify:** Divider is visible

---

## 8. Security Testing

### 8.1 Token Handling

#### Test: Token Not Exposed in URL
- **Verify:** Auth token never appears in URL
- **Verify:** Token only in localStorage and memory

#### Test: Token in Secure Storage
- **Verify:** Token stored in localStorage (acceptable for SPA)
- **Note:** Consider secure cookie for production

### 8.2 XSS Prevention

#### Test: User Data Sanitization
- **Setup:** User with `<script>` tag in name
- **Expected:** React escapes HTML by default
- **Expected:** No script execution

---

## 9. Testing Tools & Setup

### 9.1 Manual Testing Tools
- **Browser DevTools:** Network tab, Console, Application (localStorage)
- **React DevTools:** Component state inspection
- **React Query DevTools:** Already configured
- **Accessibility Tools:**
  - Lighthouse (Chrome DevTools)
  - axe DevTools extension
  - WAVE extension

### 9.2 Test Data
**Valid Test User:**
```json
{
  "userId": "test-user-123",
  "email": "test@example.com",
  "name": "Test User",
  "picture": "https://example.com/avatar.jpg"
}
```

**User Without Picture:**
```json
{
  "userId": "test-user-456",
  "email": "nopic@example.com",
  "name": "No Picture User"
}
```

**User With Long Name:**
```json
{
  "userId": "test-user-789",
  "email": "longname@example.com",
  "name": "This Is A Very Long Name That Should Truncate"
}
```

### 9.3 Testing Checklist

**Pre-Deployment:**
- [ ] All GoogleAuthModal tests pass
- [ ] All UserProfile tests pass
- [ ] Integration tests pass
- [ ] Accessibility tests pass
- [ ] Responsive design verified on 3+ screen sizes
- [ ] Tested in Chrome, Firefox, Safari
- [ ] No console errors
- [ ] No memory leaks
- [ ] Auth persists across refresh
- [ ] Logout works completely

---

## 10. Known Limitations & Future Enhancements

### Current Limitations
1. **Multi-Tab Sync:** Auth state doesn't sync in real-time across tabs (requires page refresh)
2. **Token Refresh:** No automatic token refresh (tokens may expire)
3. **Remember Me:** No "remember me" option (always persists)

### Future Enhancements
1. Add "Remember Me" checkbox to control persistence
2. Implement token refresh before expiration
3. Add social login options (Facebook, Apple)
4. Add profile editing functionality
5. Add user avatar upload
6. Implement session timeout warnings

---

## Appendix: Test Execution Log Template

```markdown
## Test Execution Log
**Date:** YYYY-MM-DD
**Tester:** Name
**Environment:** Development / Staging / Production
**Browser:** Chrome 120.0 / Firefox 121.0 / Safari 17.0
**Viewport:** Desktop 1920x1080 / Mobile 375x667

### GoogleAuthModal Tests
- [ ] Modal visibility control - PASS/FAIL
- [ ] Successful authentication - PASS/FAIL
- [ ] Failed authentication - PASS/FAIL
- [ ] Loading states - PASS/FAIL
- [ ] Error handling - PASS/FAIL
- [ ] Escape key - PASS/FAIL
- [ ] Backdrop click - PASS/FAIL

### UserProfile Tests
- [ ] Hidden when not authenticated - PASS/FAIL
- [ ] Avatar display - PASS/FAIL
- [ ] Dropdown functionality - PASS/FAIL
- [ ] Logout - PASS/FAIL
- [ ] Responsive design - PASS/FAIL
- [ ] Accessibility - PASS/FAIL

### Integration Tests
- [ ] Full login flow - PASS/FAIL
- [ ] Full logout flow - PASS/FAIL
- [ ] Auth persistence - PASS/FAIL
- [ ] API integration - PASS/FAIL

**Notes:**
[Any issues, bugs, or observations]
```
