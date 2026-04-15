# Workspace

## Overview

SafeSync — Civic Issue Reporting & Emergency Proof System. A full-stack web application for citizens to report civic issues, track complaints, earn rewards, record emergency SOS audio, and for admins to manage complaints with department routing, SLA monitoring, and performance tracking.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite, TailwindCSS, shadcn/ui, React Query, Wouter routing
- **Auth**: JWT (jsonwebtoken + bcryptjs)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   └── safesync/           # React + Vite frontend (SafeSync app)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
└── ...config files
```

## Color Theme

- Primary Background: #1E1E2F (Midnight Blue)
- Accent: #8A2BE2 (Neon Purple)
- Secondary: #F4F6FC (Ice White)

## Database Schema

Tables:
- `users` — user accounts with roles (user/admin), points
- `complaints` — civic issue reports with status, department, verification, black marks
- `sos_recordings` — emergency audio/video recordings
- `notifications` — user notifications
- `audit_logs` — all system actions
- `reward_history` — points earned per complaint

## API Routes

All routes under `/api`:
- `/auth` — register, login, logout, me
- `/complaints` — CRUD + delay flag
- `/sos` — SOS recording management
- `/notifications` — list & mark read
- `/rewards/summary` — points summary
- `/admin/*` — admin: login, complaints, assign, verify, stats, audit-logs

## Default Admin Credentials

- Email: `admin@safesync.com`
- Password: `admin123`

## Key Features

1. User authentication (JWT-based)
2. Complaint submission with GPS, device info, media upload
3. AI-based verification (logic-based confidence scoring 0-100%)
4. Smart department routing via keyword matching
5. SLA monitoring with black mark system
6. Reward points (10 base + 5 urgency + 5 confidence bonuses)
7. Emergency SOS recording (audio via MediaRecorder API)
8. Notifications system
9. Admin panel with full complaint management
10. Audit logs & department performance tracking
