import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { initDb } from './db/database';
import settingsRouter from './routes/settings';
import dropdownsRouter from './routes/dropdowns';
import jobsRouter from './routes/jobs';
import applicantsRouter from './routes/applicants';
import assessmentsRouter from './routes/assessments';
import analyticsRouter from './routes/analytics';

const app = express();
const PORT = process.env.PORT ?? 3001;
const isProd = process.env.NODE_ENV === 'production';

// In dev allow the Vite dev server on :5173; in prod same origin so no CORS needed.
if (!isProd) app.use(cors());

app.use(express.json());

app.use('/api/settings', settingsRouter);
app.use('/api/dropdowns', dropdownsRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/applicants', applicantsRouter);
app.use('/api/assessments', assessmentsRouter);
app.use('/api/analytics', analyticsRouter);

// Serve the built React app in production (backend/dist/ → ../../frontend/dist)
if (isProd) {
  const frontendDist = path.join(__dirname, '../../frontend/dist');
  if (fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    app.get('*', (_req, res) => res.sendFile(path.join(frontendDist, 'index.html')));
  }
}

initDb();

app.listen(PORT, () => {
  console.log(`ATS backend running on http://localhost:${PORT}`);
});
