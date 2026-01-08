# Hotel Concierge

AI-powered digital concierge for hotels. Streamline guest services, staff management, and create exceptional hospitality experiences.

## Features

- **AI Concierge Chat**: Guests can request services, get recommendations, and plan itineraries through natural conversation
- **Multi-language Support**: English, Portuguese, Spanish, German, French, Italian
- **Service Request Management**: Staff dashboard to manage and fulfill guest requests in real-time
- **Itinerary Planning**: Help guests plan their trips with local recommendations
- **QR Code Access**: Guests scan room QR codes for instant access without login
- **Admin Dashboard**: Manage hotels, rooms, staff, services, and recommendations

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI**: shadcn/ui, Tailwind CSS, Framer Motion
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions, Realtime)
- **AI**: OpenAI API (GPT-4o)
- **State**: TanStack Query, React Hook Form
- **i18n**: i18next

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- OpenAI API key

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd hotel-concierge

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file with the following variables:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

For Supabase Edge Functions, configure these secrets in your Supabase dashboard:

- `OPENAI_API_KEY`: Your OpenAI API key
- `RESEND_API_KEY`: Your Resend API key (for invitation emails)
- `APP_URL`: Your production app URL

## Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint
```

## Deployment

### Vercel / Netlify

1. Connect your repository
2. Set environment variables
3. Deploy

### Supabase Edge Functions

```bash
# Deploy all functions
supabase functions deploy

# Deploy a specific function
supabase functions deploy concierge-chat
```

## Project Structure

```
src/
├── components/
│   ├── admin/       # Admin dashboard components
│   ├── chat/        # Concierge chat components
│   ├── guest/       # Guest-facing components
│   ├── itinerary/   # Itinerary planning
│   ├── staff/       # Staff dashboard components
│   └── ui/          # shadcn/ui components
├── hooks/           # Custom React hooks
├── integrations/    # Supabase client setup
├── lib/             # Utilities (i18n, helpers)
├── locales/         # Translation files
└── pages/           # Page components
```

## License

MIT
