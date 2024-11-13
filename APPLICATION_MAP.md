# Thrive Oasis Application Map

This document provides a detailed overview of how different components in the Thirveoasis application interact with each other and with the Firebase backend.

## Main Components and Their Interactions

### 1. App.tsx

- Entry point of the application
- Manages the overall state of the application
- Renders either the landing page or the Dashboard component based on user authentication status
- Interacts with:
  - AuthModal (for user authentication)
  - Dashboard (when user is authenticated)
  - Firebase Auth (for checking user authentication status)

### 2. AuthModal.tsx

- Handles user registration and login
- Interacts with:
  - Firebase Auth (for user authentication)
  - Firestore (to create user document upon registration)

### 3. Dashboard.tsx

- Main component for authenticated users
- Manages the overall layout of the dashboard
- Interacts with:
  - MainNavRail (for main navigation)
  - oasisNavRail (for oasis-specific navigation)
  - DashboardContent (for rendering main content)
  - Firestore (to fetch user's oasis and joined oasis)

### 4. MainNavRail.tsx

- Provides main navigation options
- Interacts with:
  - Dashboard (to update active navigation item)

### 5. oasisNavRail.tsx

- Displays user's oasis for quick navigation
- Interacts with:
  - Dashboard (to update selected oasis)

### 6. DashboardContent.tsx

- Renders the main content based on selected navigation item or oasis
- Interacts with:
  - Owneroasis (when a oasis is selected)
  - Settings (when settings navigation item is selected)
  - oasisCreationModal (for creating new oasis)
  - Firestore (to fetch and update oasis data)

### 7. Owneroasis.tsx

- Displays detailed information and management options for a selected oasis
- Interacts with:
  - Firestore (to fetch and update oasis details, members, banned users, and unban requests)

### 8. oasisCreationModal.tsx

- Guides users through the process of creating a new oasis
- Interacts with:
  - Firestore (to create a new oasis document)
  - Firebase Storage (to upload oasis images)

### 9. Settings.tsx

- Allows users to manage their account settings
- Interacts with:
  - Firebase Auth (to update user profile)
  - Firestore (to update user document)

### 10. Community.tsx, Gameroasis.tsx, ContentCreatoroasis.tsx

- Render specific content for different types of oasis
- Interact with:
  - Firestore (to fetch and update oasis-specific data)

## Data Flow

1. User Authentication:
   App.tsx -> AuthModal.tsx -> Firebase Auth -> Firestore

2. Fetching User's oasis:
   App.tsx -> Dashboard.tsx -> Firestore

3. Creating a New oasis:
   DashboardContent.tsx -> oasisCreationModal.tsx -> Firestore & Firebase Storage

4. Managing a oasis:
   Dashboard.tsx -> DashboardContent.tsx -> Owneroasis.tsx -> Firestore

5. Updating User Settings:
   Dashboard.tsx -> DashboardContent.tsx -> Settings.tsx -> Firebase Auth & Firestore

## Firestore Data Structure

- users
  - userId
    - oasis
      - oasisId
        - members
        - bannedUsers
        - unbanRequests
    - joinedoasis
    - bannedUsersAcrossAlloasis

This structure allows for efficient querying and management of user-specific data, including owned oasis, joined oasis, and banned users across all oasis.

## Key Interactions

1. User Registration/Login:

   - AuthModal.tsx handles user input
   - Firebase Auth creates/authenticates the user
   - Firestore creates a new user document (for registration)

2. oasis Creation:

   - oasisCreationModal.tsx collects oasis details
   - Firebase Storage uploads the oasis image (if provided)
   - Firestore creates a new oasis document under the user's oasis collection

3. oasis Management:

   - Owneroasis.tsx fetches oasis details from Firestore
   - Updates to members, banned users, or unban requests are written back to Firestore

4. Navigation:

   - MainNavRail.tsx and oasisNavRail.tsx update the state in Dashboard.tsx
   - DashboardContent.tsx renders the appropriate content based on this state

5. Settings Updates:
   - Settings.tsx updates user profile in Firebase Auth
   - User document in Firestore is updated to reflect changes

This map provides a high-level overview of how the different components in Thirveoasis interact with each other and with the Firebase backend. It should help in understanding the flow of data and the relationships between different parts of the application.
