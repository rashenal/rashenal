import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import HabitsAPI, { habitsSwaggerSchema } from './v1/habits';
import TasksAPI, { tasksSwaggerSchema } from './v1/tasks';
import GoalsAPI, { goalsSwaggerSchema } from './v1/goals';
import JobsAPI from './v1/jobs';
import CoachAPI from './v1/coach';
import { mergeSwaggerSchemas } from '../lib/swagger/utils';
import { authenticateApiKey, authenticateUser } from '../lib/auth';

const app = express();

// Middleware
app.use(express.json());

// CORS configuration for external access
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://rashenal.com', 'https://app.rashenal.com']
    : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Rate limit exceeded for AI endpoints',
});

app.use('/api/', apiLimiter);

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime()
  });
});

// API v1 routes with authentication
const v1Router = express.Router();

// Authentication middleware - use API key OR user session
v1Router.use((req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (apiKey) {
    return authenticateApiKey(req, res, next);
  } else {
    return authenticateUser(req, res, next);
  }
});

// Habits endpoints
v1Router.get('/habits', HabitsAPI.getAllHabits);
v1Router.get('/habits/:id', HabitsAPI.getHabit);
v1Router.post('/habits', HabitsAPI.createHabit);
v1Router.put('/habits/:id', HabitsAPI.updateHabit);
v1Router.delete('/habits/:id', HabitsAPI.deleteHabit);
v1Router.post('/habits/:id/complete', HabitsAPI.completeHabit);
v1Router.get('/habits/:id/analytics', HabitsAPI.getHabitAnalytics);

// Tasks endpoints
v1Router.get('/tasks', TasksAPI.getAllTasks);
v1Router.get('/tasks/:id', TasksAPI.getTask);
v1Router.post('/tasks', TasksAPI.createTask);
v1Router.put('/tasks/:id', TasksAPI.updateTask);
v1Router.delete('/tasks/:id', TasksAPI.deleteTask);
v1Router.get('/tasks/suggestions', strictLimiter, TasksAPI.getAISuggestions);
v1Router.post('/tasks/batch-operations', TasksAPI.batchOperations);

// Goals endpoints
v1Router.get('/goals', GoalsAPI.getAllGoals);
v1Router.get('/goals/:id', GoalsAPI.getGoal);
v1Router.post('/goals', GoalsAPI.createGoal);
v1Router.put('/goals/:id', GoalsAPI.updateGoal);
v1Router.delete('/goals/:id', GoalsAPI.deleteGoal);
v1Router.post('/goals/:id/progress', GoalsAPI.updateProgress);
v1Router.get('/goals/:id/progress', GoalsAPI.getGoalProgress);
v1Router.post('/goals/:id/milestones', GoalsAPI.addMilestone);

// Jobs endpoints
v1Router.get('/jobs', JobsAPI.getAllJobs);
v1Router.get('/jobs/:id', JobsAPI.getJob);
v1Router.put('/jobs/:id/status', JobsAPI.updateJobStatus);

// Coach endpoints (with stricter rate limiting)
v1Router.get('/coach/history', CoachAPI.getChatHistory);
v1Router.post('/coach/message', strictLimiter, CoachAPI.sendMessage);
v1Router.get('/coach/insights', strictLimiter, CoachAPI.getInsights);

app.use('/api/v1', v1Router);

// Swagger documentation
const swaggerSchemas = mergeSwaggerSchemas([
  habitsSwaggerSchema,
  tasksSwaggerSchema,
  goalsSwaggerSchema
]);

app.get('/api/docs', (req, res) => {
  res.json(swaggerSchemas);
});

// Interactive API explorer (basic HTML)
app.get('/api/explorer', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Rashenal API Explorer</title>
      <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui.css" />
    </head>
    <body>
      <div id="swagger-ui"></div>
      <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-bundle.js"></script>
      <script>
        SwaggerUIBundle({
          url: '/api/docs',
          dom_id: '#swagger-ui',
          presets: [
            SwaggerUIBundle.presets.apis,
            SwaggerUIBundle.presets.standalone
          ]
        });
      </script>
    </body>
    </html>
  `);
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('API Error:', err);
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString(),
    path: req.path
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.path,
    method: req.method
  });
});

export default app;