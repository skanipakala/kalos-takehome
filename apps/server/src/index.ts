import express from 'express';
import cors from 'cors';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { router } from '@repo/trpc';
import { imagesRouter } from './routers/images';
import 'dotenv/config';

// Create the main tRPC router
const appRouter = router({
  images: imagesRouter,
});

export type AppRouter = typeof appRouter;

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;

// Enable CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'], // Vite default ports
  credentials: true,
}));

// Mount tRPC
app.use(
  '/trpc',
  createExpressMiddleware({
    router: appRouter,
  })
);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Image Generation Studio API', 
    status: 'healthy',
    endpoints: {
      trpc: '/trpc',
      health: '/'
    }
  });
});

console.log(`🚀 Server starting on port ${port}`);
console.log(`📡 tRPC endpoint: http://localhost:${port}/trpc`);
console.log(`🔑 Runware API Key: ${process.env.RUNWARE_API_KEY ? 'Configured' : 'Missing!'}`);

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});