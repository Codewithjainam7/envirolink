# EnviroLink 🌱

A comprehensive waste management platform for Mumbai connecting citizens, sanitation workers, and municipal authorities.

## Project Structure

```
EnvironmentTECH/
├── citizen-app/          # Next.js webapp for citizens to report waste issues
├── authority-dashboard/  # Admin dashboard for municipal authorities
├── worker-portal/        # Portal for sanitation workers
├── shared-data/          # Shared data files between apps
└── docs/                 # Documentation
```

## Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript
- **Styling:** Tailwind CSS, Framer Motion
- **Backend:** Supabase (Auth, Database, Storage)
- **Maps:** Leaflet with OpenStreetMap
- **Icons:** Lucide React

## Features

### Citizen App (Port 3000)
- Report waste issues with photos and location
- Track report status
- View nearby reports on map
- Interactive reporting form

### Authority Dashboard (Port 3001)
- View all reports with filters
- AI-powered task assignment
- Worker management with pending approvals
- Analytics and insights
- Map view of reports

### Worker Portal (Port 3002)
- View assigned tasks
- Update task status
- Track earnings
- Profile management
- Only approved workers can login

## Getting Started

```bash
# Install dependencies for all apps
cd citizen-app && npm install
cd ../authority-dashboard && npm install
cd ../worker-portal && npm install

# Start development servers
npm run dev  # In each app directory
```

## Environment Variables

Each app requires a `.env.local` file with:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Authentication

- **Citizens:** Can use the app without login
- **Workers:** Register → Admin approval → Login
- **Google OAuth:** Enabled for easy sign-in

## License

MIT
