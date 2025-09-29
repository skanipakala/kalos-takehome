<img width="1345" height="1159" alt="image" src="https://github.com/user-attachments/assets/9256de68-7ba3-4d56-a755-e198e6c42829" />
<img width="667" height="1105" alt="image" src="https://github.com/user-attachments/assets/e4a3b886-901a-4ea1-82e9-1ebdc5465aa2" />


# Image Generation Studio

A full-stack TypeScript application that generates professional LinkedIn B2B ad images using AI. Built for the Kalos take-home assignment.

## Quick Start

```bash
npm run dev
```

This starts both the backend API server (port 3001) and frontend React app (port 5173). Open http://localhost:5173 to use the app.

**Prerequisites:**
- Node.js 18+
- A Runware API key (get one at https://my.runware.ai/signup)

**Setup:**
1. Add your Runware API key to `apps/server/.env`:
   ```
   RUNWARE_API_KEY=your_key_here
   ```

2. Run the app:
   ```bash
   npm run dev
   ```

## Technical Approach

### Architecture
I went with a monorepo structure using npm workspaces instead of the originally planned pnpm + Turborepo setup. This was a pragmatic decision - while pnpm workspaces are more efficient, npm workspaces are more universally supported and easier to debug when things go wrong (which they did during setup).

**Why Monorepo?**
The monorepo approach made sense for this project because:
- **Shared Types** - The frontend and backend need to share the same TypeScript interfaces and Zod schemas
- **Type Safety** - Changes to API contracts automatically propagate to the frontend
- **Single Source of Truth** - No need to maintain separate type definitions
- **Simplified Development** - One command starts both servers, shared tooling
- **Code Reuse** - Common utilities and configurations can be shared

The app follows a clean separation of concerns:
- **Backend**: Express + tRPC for type-safe API communication
- **Frontend**: React + Vite with Tailwind for styling
- **Shared**: Zod schemas and TypeScript types in a shared package

### Key Decisions

**1. Express over Hono**
Originally planned to use Hono, but switched to Express due to better tRPC integration and more stable TypeScript support. Hono v4 had some compatibility issues with the tRPC adapter.

**2. Professional Image Prompts**
The biggest challenge was getting the AI to generate professional B2B marketing images instead of anime/artistic content. I solved this by:
- Using `runware:101@1` model (more business-focused)
- Adding negative prompts to exclude artistic styles
- Crafting specific prompts for corporate environments, business meetings, and professional settings

**3. In-Memory Storage**
Used ephemeral storage (Map) instead of a database since the requirement was "no database". This works fine for a demo but means all data is lost on server restart.

**4. Aspect Ratio Constraints**
Runware requires image dimensions to be multiples of 64. I adjusted the aspect ratios to comply:
- LinkedIn Post: 1216×640 (1.9:1)
- Square: 1088×1088 (1:1) 
- Portrait: 896×1152 (4:5)

### Trade-offs

**What I prioritized:**
- **Speed of development** - Chose familiar tools over bleeding edge
- **Type safety** - Full TypeScript coverage with tRPC
- **User experience** - Auto-save forms, sample data, clear error messages
- **Professional output** - Spent time on prompt engineering

**What I sacrificed:**
- **Performance optimization** - No image caching or lazy loading
- **Testing** - No unit or integration tests
- **Production readiness** - No deployment config or monitoring
- **Advanced features** - No user accounts, image history, or advanced editing

## Assumptions & Limitations

**Assumptions:**
- Users have a Runware API key and credits
- Images are for LinkedIn B2B marketing specifically
- Users are comfortable with basic form interfaces
- No need for user authentication or data persistence

**Limitations:**
- Server restart clears all generated image data
- No image persistence between sessions
- Limited to 5 image styles (could be more)
- No advanced image editing capabilities
- No batch download functionality
- No image quality/seed controls for users

## Code Quality

I focused on maintainable code with:
- **TypeScript strict mode** - Full type safety
- **ESLint configuration** - Code quality enforcement
- **Clean architecture** - Separated concerns, reusable components
- **Error handling** - User-friendly error messages
- **Code organization** - Logical file structure and naming

## Areas for Review

I'd appreciate feedback on:

1. **Prompt Engineering** - Are the generated images actually suitable for LinkedIn B2B ads? This was the trickiest part.

2. **API Design** - Is the tRPC setup clean and extensible? Any suggestions for the image generation endpoints?

3. **Frontend UX** - Does the studio interface make sense for tweaking images? Any missing features?

4. **Code Structure** - Is the monorepo organization logical? Any refactoring suggestions?

5. **Error Handling** - Are the error messages helpful? Any edge cases I missed?

The codebase is intentionally simple and focused on the core requirements. I prioritized getting a working demo over advanced features, but I'm curious about what you'd add or change for a production version.

## Demo

Try the Superhuman example:
- Company: superhuman.com
- Product: Superhuman  
- Value: Get through your inbox twice as fast
- Audience: CEO, Founder, Executive Assistant
- CTA: Try Superhuman Free

This should generate 5 distinct professional business images that you can then customize in the studio.
