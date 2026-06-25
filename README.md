# Graduation Project - Module 3

## How to Run the Project
1. Clone or extract the project directory.
2. Open your terminal in the project root folder.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the local development server:
   ```bash
   npm run dev
   ```

## External Assets & Model Checkpoints
* **MediaPipe Face Mesh Models**: These models are loaded dynamically at runtime via the `src/utils/mediapipeLoader.ts` script directly from the official Google CDN. No large model files are included locally in this repository to save space.