# Storyboard - Social Media Management Platform

A comprehensive social media content management system for managing multiple brands, generating AI-powered content prompts, and tracking content through production workflows.

## Features

- **8-Step Brand Onboarding** - Comprehensive brand setup including mission, audience, visual lexicon, content rules, and topic decks
- **Multi-Brand Management** - Manage unlimited brands from a single dashboard
- **AI Prompt Generation** - DeepSeek-powered content generation for video prompts, titles, descriptions, and tags
- **Monthly Calendar View** - Visual content planning and scheduling across brands
- **Guided Workflow Stepper** - 6-stage content production pipeline (Idea → Prompted → Generated → Enhanced → QC → Scheduled → Published)
- **Bulk Generation** - Generate content for 7-30 days at once with weighted topic variety
- **Platform-Specific** - Optimized for TikTok, Instagram, and YouTube with platform constraints

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **AI**: DeepSeek API
- **Forms**: React Hook Form + Zod

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account and project
- DeepSeek API key

### 1. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 2. Set Up Supabase Database

1. Go to your Supabase project's SQL Editor
2. Run the schema file:

\`\`\`bash
# Copy the contents of supabase-schema.sql and paste into Supabase SQL Editor
\`\`\`

This will create all necessary tables:
- \`brands\` - Brand profiles and guidelines
- \`topics\` - Content topics with weights
- \`content_items\` - Individual content pieces
- \`generations\` - AI-generated prompts and metadata
- \`assets\` - Video and thumbnail files
- \`templates\` - Reusable prompt templates

### 3. Configure Environment Variables

The \`.env.local\` file is already configured with your credentials. Verify these values:

\`\`\`env
ELEVENLABS_API_KEY=your_key
KEIAI_API_KEY=your_key
DEEPSEEK_API_KEY=your_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
\`\`\`

### 4. Run Development Server

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to see the app.

### 5. Build for Production

\`\`\`bash
npm run build
npm run start
\`\`\`

## Usage Guide

### Creating Your First Brand

1. Click "New Brand" on the Brands page
2. Complete the 8-step onboarding wizard:
   - **Step 1**: Basic Info (name, color)
   - **Step 2**: Mission & Core Values
   - **Step 3**: Audience & Voice Tone
   - **Step 4**: Visual Lexicon (keywords, negative prompts)
   - **Step 5**: Content Rules (dos/don'ts)
   - **Step 6**: Proof Points & CTAs
   - **Step 7**: Platform Selection
   - **Step 8**: Topic Deck (with weights)

### Generating Content

#### Single Item Generation
1. Select a brand from the dashboard
2. Navigate to Calendar
3. Click a date
4. System will:
   - Pick a weighted random topic
   - Generate 3 prompt variations
   - Create title, description, tags
   - Provide thumbnail brief

#### Bulk Generation
1. Go to "Bulk Generate"
2. Select brand and platform
3. Choose date range (7-30 days)
4. Click "Generate"
5. System generates content for each day respecting topic variety

### Managing Content Workflow

Each content item moves through 6 stages:

1. **Idea** - Topic selected
2. **Prompted** - AI prompts generated
3. **Generated** - Video created externally
4. **Enhanced** - Edits complete
5. **QC** - Quality checked
6. **Scheduled** - Ready to publish
7. **Published** - Live on platform

Use the workflow stepper to move content through stages, add notes, attach files, and mark blockers.

## Project Structure

\`\`\`
/app
  /(dashboard)     - Main app pages
  /api            - API routes
/components
  /ui             - shadcn/ui components
  /onboarding     - Brand onboarding wizard
  /workflow       - Content workflow components
/lib
  /actions        - Server actions
  /deepseek.ts    - AI generation logic
  /supabase.ts    - Database client
  /topics.ts      - Topic selection logic
/types            - TypeScript definitions
\`\`\`

## Design System

- **Colors**: Dark mode with glassmorphic effects
- **Corners**: rounded-lg throughout (no pills)
- **Cards**: \`bg-white/5\` with \`backdrop-blur-xl\`
- **Typography**: Inter font family
- **Status Colors**: Color-coded by workflow stage

## API Endpoints

- \`POST /api/generate\` - Generate content for a single item
- \`GET /api/topics/[brandId]\` - Fetch topics for a brand

## Database Schema

Key relationships:
- \`brands\` 1:N \`topics\`
- \`brands\` 1:N \`content_items\`
- \`content_items\` 1:N \`generations\`
- \`content_items\` 1:N \`assets\`

## Tips & Best Practices

1. **Topic Weights**: Higher weight = more frequent selection (1-10 scale)
2. **Visual Keywords**: Be specific - these inject directly into AI prompts
3. **Negative Prompts**: Explicitly state what to avoid visually
4. **Bulk Generation**: Use for planning ahead, then refine individual items
5. **Workflow Notes**: Document decisions and feedback for each stage

## Troubleshooting

### Build Errors
If you encounter TypeScript errors, ensure all dependencies are installed:
\`\`\`bash
npm install
\`\`\`

### Supabase Connection Issues
Verify your environment variables are correct and the Supabase schema has been run.

### AI Generation Fails
Check that your DeepSeek API key is valid and has sufficient quota.

## Future Enhancements

- Direct platform publishing integration
- Performance analytics and learning loop
- Daily autopilot (scheduled generation)
- Template library
- Collaborative features
- Image generation integration

## License

Private - Single User

## Support

For issues or questions, contact the development team.

---

**Built with** ❤️ **for content creators**
