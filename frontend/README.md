# WikiTack Frontend

A modern wiki frontend built with Next.js 16, TypeScript, and Tailwind CSS.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Package Manager**: Yarn
- **Runtime**: Node.js 20

## Project Structure

```
frontend/
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # React components
│   │   ├── WikiHeader.tsx
│   │   ├── WikiSidebar.tsx
│   │   └── WikiContent.tsx
│   ├── types/           # TypeScript type definitions
│   │   └── wiki.ts
│   └── lib/             # Utility functions
├── public/              # Static assets
├── Dockerfile           # Docker configuration
└── .dockerignore        # Docker ignore rules
```

## Getting Started

### Development Mode

Install dependencies:

```bash
yarn install
```

Run the development server:

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

Build the application:

```bash
yarn build
```

Start the production server:

```bash
yarn start
```

### Podman

Build and run with Podman:

```bash
# Build the image
podman build -t wikitack-frontend .

# Run the container
podman run -p 3000:3000 wikitack-frontend
```

Or use podman-compose from the root directory:

```bash
cd ..
podman-compose up
```

## Features

- Modern, responsive wiki interface
- Search functionality (UI ready)
- Category browsing
- Recent pages sidebar
- Dark mode support
- Optimized for production with standalone output

## API Integration

The frontend is currently set up with placeholder components. API calls will be integrated in future updates to connect with the backend services.

## License

MIT
