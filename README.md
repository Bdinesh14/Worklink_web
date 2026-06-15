# Work-Link Application

Work-Link is a cross-platform service platform connecting hirers (clients) with workers. The system consists of an Expo-based mobile application (for mobile clients/workers) and a Vite/React-based web administration/portal application.

---

## Technical Stack Overview

### 1. Frontend
The system features two separate frontends targeting mobile and web clients, located under the [Frontend/](file:///c:/Users/dines/OneDrive/Desktop/Work-Link web/Frontend) directory:

*   **Mobile App (Expo & React Native)** — Lives in [Frontend/Mobile/](file:///c:/Users/dines/OneDrive/Desktop/Work-Link web/Frontend/Mobile)
    *   **Framework:** [Expo (SDK 54)](https://expo.dev/) & React Native
    *   **Language:** TypeScript
    *   **Navigation:** React Navigation (`@react-navigation/native`, stack, and bottom-tabs)
    *   **Key Files & Locations:**
        *   Root entry point: [App.tsx](file:///c:/Users/dines/OneDrive/Desktop/Work-Link web/Frontend/Mobile/App.tsx)
        *   App entry declaration: [index.ts](file:///c:/Users/dines/OneDrive/Desktop/Work-Link web/Frontend/Mobile/index.ts)
        *   App Configuration: [app.json](file:///c:/Users/dines/OneDrive/Desktop/Work-Link web/Frontend/Mobile/app.json) and [eas.json](file:///c:/Users/dines/OneDrive/Desktop/Work-Link web/Frontend/Mobile/eas.json)
        *   Screens directory: [screens/](file:///c:/Users/dines/OneDrive/Desktop/Work-Link web/Frontend/Mobile/screens)
            *   Hirer flow screens: [screens/hirer/](file:///c:/Users/dines/OneDrive/Desktop/Work-Link web/Frontend/Mobile/screens/hirer)
            *   Worker flow screens: [screens/worker/](file:///c:/Users/dines/OneDrive/Desktop/Work-Link web/Frontend/Mobile/screens/worker)
            *   Authentication screens: `LoginScreen.tsx`, `RegisterScreen.tsx`, `ForgotPasswordScreen.tsx` (in the [screens/](file:///c:/Users/dines/OneDrive/Desktop/Work-Link web/Frontend/Mobile/screens) folder)

*   **Web App (React & Vite)** — Lives in [Frontend/Web/](file:///c:/Users/dines/OneDrive/Desktop/Work-Link web/Frontend/Web)
    *   **Framework:** React 19 + [Vite](https://vite.dev/) (fast bundler and development server)
    *   **Language:** TypeScript
    *   **Routing:** React Router DOM (v7)
    *   **Styling:** Custom CSS modules/files
    *   **Key Files & Locations:**
        *   Web HTML entry: [index.html](file:///c:/Users/dines/OneDrive/Desktop/Work-Link web/Frontend/Web/index.html)
        *   Vite config: [vite.config.ts](file:///c:/Users/dines/OneDrive/Desktop/Work-Link web/Frontend/Web/vite.config.ts)
        *   Web entry point: [src/main.tsx](file:///c:/Users/dines/OneDrive/Desktop/Work-Link web/Frontend/Web/src/main.tsx)
        *   Web App controller: [src/App.tsx](file:///c:/Users/dines/OneDrive/Desktop/Work-Link web/Frontend/Web/src/App.tsx)
        *   Web Pages directory: [src/pages/](file:///c:/Users/dines/OneDrive/Desktop/Work-Link web/Frontend/Web/src/pages)
            *   Hirer flow pages: [src/pages/hirer/](file:///c:/Users/dines/OneDrive/Desktop/Work-Link web/Frontend/Web/src/pages/hirer)
            *   Worker flow pages: [src/pages/worker/](file:///c:/Users/dines/OneDrive/Desktop/Work-Link web/Frontend/Web/src/pages/worker)
            *   Shared/General pages: [src/pages/shared/](file:///c:/Users/dines/OneDrive/Desktop/Work-Link web/Frontend/Web/src/pages/shared)

---

## 2. Backend & Database
Work-Link uses **Firebase** as its Backend-as-a-Service (BaaS) and database provider. Setup, configuration, and JSON schemas are documented under the [Backend/](file:///c:/Users/dines/OneDrive/Desktop/Work-Link web/Backend) folder.

*   **Authentication & Authorization:** 
    *   **Firebase Authentication** manages user roles, sessions, and credentials.
*   **Database:**
    *   **Firebase Realtime Database (RTDB)** stores all real-time application data (users, jobs, applications, chat messages, availability, profiles, and reports).
    *   **Database Region:** Asia Southeast (Singapore)
*   **Key Initialization Files & Locations:**
    *   **Mobile Firebase Setup:** [firebase.ts](file:///c:/Users/dines/OneDrive/Desktop/Work-Link web/Frontend/Mobile/services/firebase.ts)
        *   Initializes Firebase App, Auth with AsyncStorage persistence, and the Realtime Database client instance.
    *   **Web Firebase Setup:** [firebase.ts](file:///c:/Users/dines/OneDrive/Desktop/Work-Link web/Frontend/Web/src/services/firebase.ts)
        *   Initializes Firebase App, Auth with browser local persistence, and the Realtime Database client instance.
    *   **Firebase Configuration Details:** [Backend/Firebase/README.md](file:///c:/Users/dines/OneDrive/Desktop/Work-Link web/Backend/Firebase/README.md)
        *   Contains details on DB rules, Cascading deletes, and schema descriptions.

---

## Project Structure Overview

```
Work-Link web/
├── Frontend/
│   ├── Mobile/                      # Expo Mobile App
│   │   ├── services/
│   │   │   └── firebase.ts          # Mobile Firebase auth & database initializer
│   │   ├── screens/                 # Mobile app screens
│   │   │   ├── hirer/               # Hirer client flows
│   │   │   └── worker/              # Worker client flows
│   │   ├── App.tsx                  # Mobile main app setup
│   │   ├── app.json                 # Expo configuration
│   │   └── package.json             # Mobile package scripts and dependencies
│   │
│   └── Web/                         # Vite React Web App
│       ├── src/
│       │   ├── services/
│       │   │   └── firebase.ts      # Web Firebase auth & database initializer
│       │   ├── pages/               # Web pages layout and routing targets
│       │   │   ├── hirer/           # Hirer dashboard & job management pages
│       │   │   ├── worker/          # Worker schedules, requests, and profiles
│       │   │   └── shared/          # Shared screens (e.g. notifications)
│       │   ├── App.tsx              # Web main routing entry point
│       │   └── main.tsx             # Web bootstrap file
│       ├── index.html               # Web index page template
│       └── package.json             # Web package scripts and dependencies
│
└── Backend/
    └── Firebase/                    # Serverless Firebase Backend Resources
        ├── Firebase Config.txt      # API key configurations backup
        └── README.md                # Realtime DB schema and documentation
```

---

## Getting Started

### 1. Run Mobile App (Expo Metro Bundler)
Navigate to the mobile directory and start the packager:
```bash
cd Frontend/Mobile
npm install
npm run start
```

### 2. Run Web Portal (Vite React App)
Navigate to the web directory and start the development server:
```bash
cd Frontend/Web
npm install
npm run dev
```
By default, the Vite application starts on [http://localhost:5173/](http://localhost:5173/).

