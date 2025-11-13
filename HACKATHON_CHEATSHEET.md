# Yogi.AI - Hackathon Cheatsheet

This document is a quick reference guide to the project's file structure, helping you quickly locate key features and code sections during your presentation.

---

### 1. Overall UI Structure & Layout

The main screen is divided into a 2x2 grid. The layout and composition of these panes are defined here.

-   **File:** `src/app/page.tsx`
-   **What it does:** Organizes the four main UI panes (`CameraPane`, `PoseAnalysisPane`, `BreathingPane`, `PlanPane`) into a grid layout. It acts as the main entry point for the user interface.

---

### 2. Central State Management

All the application's state (like the selected pose, user's custom poses, feedback messages, etc.) and the logic to update it are centralized in a single custom hook for clean, maintainable code.

-   **File:** `src/hooks/use-yoga-dashboard.ts`
-   **What it does:** This is the "brain" of the application. It manages all application state and contains the handler functions for major user interactions (e.g., selecting a pose, adding a new pose, generating a plan).

---

### 3. Real-time Pose Correction (Camera & AI Analysis)

This is where the live camera feed is processed to detect and analyze the user's pose in real-time.

-   **File:** `src/components/pose-correction-client.tsx`
-   **What it does:**
    -   Accesses the user's webcam.
    -   Uses the MediaPipe `PoseLandmarker` library to detect body keypoints from the video stream.
    -   Continuously analyzes the keypoints against the rules for the selected pose.
    -   Calculates pose accuracy and breathing rate.
    -   Initiates audio feedback for corrections.
-   **File:** `src/lib/pose-analyzer.ts`
-   **What it does:** Contains the core `analyzePose` function, which takes the user's current keypoints and a set of rules, and returns feedback messages and an accuracy score.

---

### 4. Adding a Custom Pose (with AI)

The user can add their own poses. This feature uses AI to automatically create the analysis rules and generate a representative image.

-   **File:** `src/components/add-pose-form.tsx`
-   **What it does:** Provides the dialog form for the user to enter a pose name and description. On submission, it coordinates calls to the AI to generate an image and the analysis rules.
-   **File:** `src/ai/flows/generate-pose-rules.ts`
-   **What it does:** This is the Genkit AI flow that takes a pose description (and optionally an image) and returns a structured set of analysis rules (angles, tolerances, feedback messages).
-   **File:** `src/ai/flows/generate-pose-image.ts`
-   **What it does:** This Genkit AI flow takes a pose name and description and uses a text-to-image model to generate a new image for that pose.

---

### 5. Personalized Yoga Plan (AI)

This feature allows the user to get a custom yoga sequence based on their goals.

-   **File:** `src/components/layout/PlanPane.tsx`
-   **What it does:** Contains the UI for the user to enter their goal and see the generated plan.
-   **File:** `src/ai/flows/generate-yoga-plan.ts`
-   **What it does:** The Genkit AI flow that takes the user's goal as input and returns a sequence of yoga poses.

---

### 6. Audio Feedback (AI)

When the user needs to correct their pose, they receive spoken instructions.

-   **File:** `src/ai/flows/audio-feedback-pose-correction.ts`
-   **What it does:** A Genkit AI flow that uses a text-to-speech model to convert a feedback string (e.g., "Straighten your back leg") into an audio data URI that can be played in the browser.

---

### 7. Pose Definitions & Constants

This is where the data for the default, built-in yoga poses is stored.

-   **File:** `src/lib/pose-constants.ts`
-   **What it does:** Defines the names, keypoint mappings, and default analysis rules for the initial set of poses (Tree, Warrior II, etc.).
-   **File:** `src/lib/placeholder-images.json`
-   **What it does:** Stores the image URLs and descriptions for the default poses.

---

### 8. Server Actions (Backend Communication)

These functions act as the bridge between the client-side UI and the server-side AI flows.

-   **File:** `src/app/actions.ts`
-   **What it does:** Exports async functions (`getYogaPlan`, `getAIPoseRules`, etc.) that can be called from client components to securely execute the Genkit AI flows on the server.
