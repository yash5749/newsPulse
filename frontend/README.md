# News Pulse Frontend

Next.js frontend for the News Pulse topic-clustered news timeline.

## Environment

Create `.env.local` for local development:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

For Vercel, set `NEXT_PUBLIC_API_URL` to the deployed Node API URL, for example:

```env
NEXT_PUBLIC_API_URL=https://<your-render-api>.onrender.com/api
```

## Development

```bash
npm install
npm run dev
```

## Validation

```bash
npm run lint
npm run build
```
