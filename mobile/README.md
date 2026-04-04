# Cadence Mobile — iOS App

React Native companion app for the Cadence college athletics scheduling platform.

## Features

- **Coach view** — Team availability heatmap, event scheduling with AI conflict-check, CARA compliance dashboard, roster management, scheduling insights
- **Athlete view** — Daily schedule, weekly calendar with block management, team events feed
- **Role-based navigation** — Coaches get 5 tabs, athletes get 3
- **Sport theming** — 15 sports with unique accent colors applied throughout the UI
- **CARA tracking** — Progress bars and warnings for NCAA hour limits
- **Dark navy design** — Matches the Cadence web app visual language

---

## Prerequisites

- **macOS** (required for iOS development)
- **Xcode 15+** — [Download from Mac App Store](https://apps.apple.com/us/app/xcode/id497799835)
- **Node.js 18+** — `brew install node`
- **CocoaPods** — `sudo gem install cocoapods`
- **Watchman** — `brew install watchman`

---

## Setup

### 1. Install Dependencies

```bash
cd /Users/brodyvign/.openclaw/workspace/cadence/mobile
npm install
```

### 2. Install iOS Pods

```bash
cd ios
pod install
cd ..
```

> If `ios/` directory doesn't exist yet (scaffold-only mode), generate it first:
> ```bash
> npx @react-native-community/cli init CadenceMobile --directory . --skip-install
> npm install
> cd ios && pod install && cd ..
> ```

### 3. Start Metro Bundler

```bash
npm start
```

### 4. Run on iOS Simulator

```bash
npm run ios
```

Or open `ios/CadenceMobile.xcworkspace` in Xcode and press **⌘R**.

---

## Backend Configuration

By default, the app points to `http://localhost:4001/api`. This works with the iOS Simulator.

### For physical device (same Wi-Fi):

Edit `src/services/api.js`:

```js
export const API_BASE_URL = 'http://192.168.1.XXX:4001/api';
// Replace with your Mac's local IP (System Settings → Wi-Fi → Details)
```

### For production deployment:

```js
export const API_BASE_URL = 'https://your-backend.com/api';
```

---

## Project Structure

```
mobile/
├── App.jsx                        # Root component
├── index.js                       # Entry point
├── package.json
├── src/
│   ├── context/
│   │   └── AuthContext.jsx        # Auth state + AsyncStorage session
│   ├── services/
│   │   ├── api.js                 # Axios instance + all API functions
│   │   └── auth.js                # Login/register/logout helpers
│   ├── lib/
│   │   ├── colors.js              # Design tokens (colors, spacing, fonts)
│   │   └── sportThemes.js         # Sport → color/icon theme mapping
│   ├── navigation/
│   │   ├── RootNavigator.jsx      # Auth gate → Coach or Athlete tabs
│   │   ├── AuthNavigator.jsx      # Login / Register stack
│   │   ├── CoachTabNavigator.jsx  # 5-tab coach navigator
│   │   └── AthleteTabNavigator.jsx # 3-tab athlete navigator
│   ├── components/
│   │   ├── ScreenWrapper.jsx      # Safe area + scroll wrapper
│   │   ├── Card.jsx               # Dark surface card
│   │   ├── Button.jsx             # Primary / outline / ghost button
│   │   ├── Input.jsx              # Styled text input with label
│   │   ├── CARABar.jsx            # CARA hours progress bar
│   │   └── SectionHeader.jsx      # Section title with optional action
│   └── screens/
│       ├── auth/
│       │   ├── LoginScreen.jsx    # Email/password + quick-login buttons
│       │   └── RegisterScreen.jsx # Multi-step: info → role → sport
│       ├── coach/
│       │   ├── CoachHomeScreen.jsx       # Dashboard with stats + events
│       │   ├── TeamAvailabilityScreen.jsx # Scrollable week heatmap
│       │   ├── ScheduleEventScreen.jsx    # Create event + Find Best Times
│       │   ├── CoachPromptsScreen.jsx     # AI scheduling insights
│       │   ├── RosterScreen.jsx           # Athlete list with CARA bars
│       │   └── ComplianceScreen.jsx       # CARA compliance dashboard
│       ├── athlete/
│       │   ├── AthleteHomeScreen.jsx  # Today + upcoming + conflicts
│       │   ├── MyScheduleScreen.jsx   # Weekly calendar + add blocks
│       │   └── TeamScheduleScreen.jsx # Team event feed
│       └── shared/
│           └── ProfileScreen.jsx      # User info + sign out
```

---

## Demo Accounts

These work with the Cadence backend running locally:

| Role    | Email                          | Password  |
|---------|-------------------------------|-----------|
| Coach   | `coach@demo.cadence.app`      | `demo123` |
| Athlete | `athlete@demo.cadence.app`    | `demo123` |

Or use the quick-login buttons on the Login screen.

---

## Navigation Flow

```
App Launch
  └─ Loading (rehydrate session)
       ├─ No session → AuthNavigator
       │    ├─ LoginScreen
       │    └─ RegisterScreen (3 steps)
       └─ Session exists
            ├─ Coach → CoachTabNavigator
            │    ├─ Home (CoachHomeScreen)
            │    ├─ Availability (TeamAvailabilityScreen)
            │    ├─ Schedule (ScheduleEventScreen)
            │    ├─ Roster (RosterScreen)
            │    └─ Compliance (ComplianceScreen)
            └─ Athlete → AthleteTabNavigator
                 ├─ Home (AthleteHomeScreen)
                 ├─ My Schedule (MyScheduleScreen)
                 └─ Team (TeamScheduleScreen)
```

---

## Key API Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `POST /auth/login` | Login |
| `POST /auth/register` | Register |
| `GET /events` | Fetch events |
| `POST /events` | Create event |
| `GET /schedule-blocks` | Athlete availability blocks |
| `POST /schedule-blocks` | Add availability block |
| `POST /conflict-check/suggest` | AI best-time suggestions |
| `GET /compliance/summary` | Team CARA summary |
| `GET /compliance/forecast` | Week forecast |
| `GET /roster` | Team roster |

---

## Troubleshooting

**Metro bundler won't start:**
```bash
npx react-native start --reset-cache
```

**iOS build fails:**
```bash
cd ios && pod install && cd ..
```

**"Unable to connect to server" on device:**
- Check `API_BASE_URL` in `src/services/api.js`
- Make sure backend is running: `cd backend && npm start`
- On physical device: use your Mac's local IP, not `localhost`

**Xcode signing error:**
- Open `ios/CadenceMobile.xcworkspace` in Xcode
- Select your Apple ID in Signing & Capabilities
- Set Bundle Identifier to something unique (e.g., `com.yourname.cadence`)

---

## Development Tips

- Run `npm start` first, then `npm run ios` in a separate terminal
- Press `i` in Metro to open iOS Simulator
- Shake device (or Cmd+D in Simulator) to open React Native Dev Menu
- Enable Fast Refresh for live code updates without full reload

---

*Built with React Native 0.76 · Cadence v1.0*
