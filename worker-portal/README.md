# Worker Portal

Sanitation Worker Portal for EnvironmentTech platform.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` file:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Run development server:
```bash
npm run dev
```

Server runs on http://localhost:3000 (or 3002 if ports 3000/3001 are in use)

## Features

- **Dashboard**: View and manage assigned tasks
- **Task Management**: Accept, reject, or complete tasks
- **Earnings**: Track daily/weekly/monthly earnings
- **Profile**: Manage worker profile and settings
- **Registration**: New worker registration flow

## Pages

- `/` - Main dashboard with tasks
- `/profile` - Worker profile
- `/earnings` - Earnings and transactions
- `/register` - New worker registration
