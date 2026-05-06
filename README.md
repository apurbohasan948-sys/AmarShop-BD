# AmarShop BD - Deployment Guide

This project is configured to run on **AI Studio** and is optimized for deployment to **Cloud Run** and **GitHub Pages**.

## Local Development
1. `npm install`
2. `npm run dev`

## Deployment to Cloud Run (via AI Studio)
The project is set up as a Full-Stack application. AI Studio will automatically detect the `server.ts` and `start` script to deploy a robust container.

## Deployment to GitHub Pages
If you are deploying to GitHub Pages, you must update the `base` path in `vite.config.ts`:

1. Open `vite.config.ts`.
2. Update the `base` property (if deploying to a sub-path):
   ```typescript
   export default defineConfig({
     base: '/AmarShop-BD/',
     // ...
   });
   ```
3. Run `npm run build`.
4. Push the `dist` folder to your `gh-pages` branch.

## Troubleshooting Build Errors
- **TypeScript Errors**: Run `npm run lint` to check for any static type issues.
- **Missing Env Vars**: Ensure `GEMINI_API_KEY` is set in your deployment environment if the AI features are used during build.
- **Node Version**: This project requires Node 20+.
