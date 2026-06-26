# 📚 NexaLearn Proctoring Module

---

## 📖 Overview

This module is demonstrating the core proctoring engine for the NexaLearn platform. It uses real-time face detection, gaze tracking, and browser monitoring to measure student attention during learning and quiz sessions.


## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- A **webcam** (required for proctoring features)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/CMP26/CamModule.git
   cd CamModule
   ```

2. **Install dependencies**

   ```bash
   npm install 
   ```

3. **Start the development server**

   ```bash
   npm run dev
   ```

5. **Allow camera access** when prompted.

---

## ✨ Features

- **👁️ Real-time Gaze Detection**  
  Tracks head yaw, pitch, and iris position using MediaPipe to determine if the user is looking at the screen.

- **⏱️ Attention Timer**  
  A 3-second countdown triggers a pause when the user looks away, switches tabs, or leaves the frame.

- **👥 Multi-face Detection**  
  Detects if multiple faces are present (anti-cheating for quizzes).

- **🔄 Browser Monitoring**  
  Detects tab switches and window blur/focus events.

- **📊 Session Logging**  
  Automatically logs study and quiz sessions with metrics like focus percentage, gaze-in/out time, and active/inactive presence.

- **🪪 Identity Verification (Experimental)**  
  Uses `@vladmandic/face-api` to compare a reference photo with live webcam feed (optional future feature).

- **📈 Analytics Dashboard**  
  Visualizes study and quiz metrics using interactive pie charts.

---

## 🛠️ Core Technology Stack

| Architecture / Framework | Purpose & Implementation |
| :--- | :--- |
| **React 18** | Functional component tree and modular interface states |
| **TypeScript** | Strict compile-time data typing and contract schemas |
| **Vite** | Blazing-fast asset compilation and optimization engine |
| **MediaPipe FaceMesh** | Low-latency 468-point facial topology processing |
| **@vladmandic/face-api** | Asynchronous neural network biometric matching layers |
| **Recharts** | Vector graphics layer for telemetry log mapping |
| **HTML5 LocalStorage** | Multi-tab synchronized state persistence fallback matrix |

---


## 📂 Project Structure

```
src/
├── components/          
│   ├── Home.tsx
│   ├── Learning.tsx
│   ├── Quiz.tsx
│   |── Logs.tsx
|   ├── Home.css
│   ├── Learning.css
│   ├── Quiz.css
│   └── Logs.css
│
├── context/             # Core state management 
│   ├── AppContext.tsx   # Main app state provider
│   ├── CameraContext.tsx # Webcam stream provider
│   └── reducer.ts       # Reducer for study/quiz session state
│
├── hooks/               # Proctoring logic (YOUR ORIGINAL WORK)
│   ├── useFaceMesh.ts   # Gaze detection via MediaPipe
│   ├── useAttentionDetection.ts # 3-second countdown timer
│   ├── useBrowserMonitor.ts # Tab/window focus tracking
│   └── useIdentityVerification.ts # Face verification (POC)
│
├── utils/               # Pure utilities (YOUR ORIGINAL WORK)
│   ├── gazeUtils.ts     # Gaze ratio, head yaw/pitch math
│   └── mediapipeLoader.ts # MediaPipe singleton loader
│
├── types/               # TypeScript interfaces
│   ├── index.ts
│   └── sessionTypes.ts
│
├── App.tsx              # Root component
├── App.css              # Global styles
├── main.tsx             # React entry point
├── main.css             # Base styles
└── index.ts             # Hook exports
```

---

## 🧪 How to Use the App

### 1. Home Dashboard
- Click **"Study Content"** → Enter Learning Mode.
- Click **"Take Quiz"** → Enter Quiz Mode.
- Click **"View Analytics"** → View session logs.

### 2. Learning Mode
- Choose **Article** or **Video**.
- The 4 status cards show:
  - **Face** detected?
  - **Looking Away** or focused?
  - **Attentive** or distracted?
  - **Tab Focus** or switched?
- If you look away for **3 seconds**, the video pauses (in Video mode).

### 3. Quiz Mode
- Answer 2 questions.
- The system tracks **Gaze In** and **Gaze Out** time.
- **Submit** to see your score and focus percentage.
- **Exit Without Submitting** discards the session.

### 4. Analytics Dashboard
- View **Overall Study Focus** (Active vs Inactive time).
- View **Exam Logs** with focus percentage and pie charts.
- Click **Clear Logs** to reset all data.

---

## 🔬 How It Works (Technical Deep Dive)

### Gaze Detection (`useFaceMesh`)
- MediaPipe detects 468 facial landmarks.
- Face width is measured using the outer eye corners.
- A **dynamic scaling factor** adjusts thresholds based on camera distance.
- Gaze, yaw, and pitch are combined to decide if the user is looking away.
- A **500ms grace period** prevents false positives on blinks.

### Attention Timer (`useAttentionDetection`)
- When distraction is detected, a 3-second countdown starts.
- If the user returns before the countdown ends, it resets (no log).
- If the countdown hits 0, the video pauses and a log is created.

### Session Logging (`reducer.ts`)
- Study sessions track `activePresenceTime` and `inactiveTime`.
- Quiz sessions track `gazeInTime` and `gazeOutTime`.
- Focus % is calculated as `gazeInTime / (gazeInTime + gazeOutTime)`.
- Logs are persisted in `localStorage` and sync across tabs via `storage` events.

### Cross-Tab Sync
- The `storage` event listener merges logs from other tabs without duplication (using Map-based deduplication).