# Frontend Documentation

## Tổng quan

Frontend sử dụng **Next.js 14+** với App Router, TypeScript, và Tailwind CSS.

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript 5+
- **Styling**: Tailwind CSS 3+ + shadcn/ui
- **State Management**: Zustand / React Context
- **Forms**: React Hook Form + Zod
- **Authentication**: NextAuth.js (Casdoor provider)
- **HTTP Client**: Axios / Fetch API

## Project Structure

```
apps/web/
├── app/                  # App Router pages
│   ├── (auth)/           # Auth group
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/      # Dashboard group
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── api/              # API routes
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── components/           # React components
│   ├── ui/               # shadcn/ui components
│   ├── forms/            # Form components
│   ├── layouts/          # Layout components
│   └── shared/           # Shared components
├── lib/                  # Utilities
│   ├── api.ts            # API client
│   ├── auth.ts           # Auth helpers
│   ├── utils.ts          # General utils
│   └── validations.ts    # Zod schemas
├── public/               # Static assets
├── styles/               # Global styles
├── auth.ts               # NextAuth config
├── middleware.ts         # Next.js middleware
└── tailwind.config.ts    # Tailwind config
```

## Design System

### Color Palette

Wataomi sử dụng Indigo-based palette với full accessibility support (WCAG AA).

#### CSS Variables
```css
:root {
  /* Primary - Indigo */
  --primary-50: #eef2ff;
  --primary-100: #e0e7ff;
  --primary-200: #c7d2fe;
  --primary-300: #a5b4fc;
  --primary-400: #818cf8;
  --primary-500: #6366f1;  /* Main brand color */
  --primary-600: #4f46e5;
  --primary-700: #4338ca;
  --primary-800: #3730a3;
  --primary-900: #312e81;

  /* Secondary - Slate */
  --secondary-50: #f8fafc;
  --secondary-100: #f1f5f9;
  --secondary-500: #64748b;
  --secondary-900: #0f172a;

  /* Accent - Emerald */
  --accent-500: #10b981;
  --accent-600: #059669;

  /* Semantic Colors */
  --error: #ef4444;
  --warning: #f59e0b;
  --success: #22c55e;
  --info: #3b82f6;

  /* Neutrals */
  --background: #ffffff;
  --foreground: #0f172a;
  --muted: #f1f5f9;
  --border: #e2e8f0;
}

.dark {
  --background: #0f172a;
  --foreground: #f8fafc;
  --muted: #1e293b;
  --border: #334155;
}
```

#### Tailwind Usage
```tsx
// Primary colors
<button className="bg-primary-500 hover:bg-primary-600 text-white">
  Click me
</button>

// Semantic colors
<div className="text-error">Error message</div>
<div className="bg-success text-white">Success!</div>
```

### Typography

```css
/* Font Family */
--font-sans: 'Inter', system-ui, sans-serif;
--font-mono: 'Fira Code', monospace;

/* Font Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
```

### Spacing

Sử dụng Tailwind spacing scale (4px base unit).

```tsx
<div className="p-4">      {/* 16px padding */}
<div className="mt-8">     {/* 32px margin-top */}
<div className="gap-6">    {/* 24px gap */}
```

### Components

#### Button Variants
```tsx
// Primary
<Button variant="primary">Primary Action</Button>

// Secondary
<Button variant="secondary">Secondary Action</Button>

// Outline
<Button variant="outline">Outline Button</Button>

// Ghost
<Button variant="ghost">Ghost Button</Button>

// Destructive
<Button variant="destructive">Delete</Button>
```

#### Input Fields
```tsx
<Input 
  type="email" 
  placeholder="Enter email"
  error={errors.email?.message}
/>
```

## Routing

### App Router Structure

```
app/
├── (auth)/
│   ├── login/page.tsx           # /login
│   └── register/page.tsx        # /register
├── (dashboard)/
│   ├── layout.tsx               # Dashboard layout
│   ├── page.tsx                 # /dashboard
│   ├── users/
│   │   ├── page.tsx             # /dashboard/users
│   │   └── [id]/page.tsx        # /dashboard/users/:id
│   └── settings/page.tsx        # /dashboard/settings
└── api/
    └── auth/[...nextauth]/route.ts
```

### Navigation

```tsx
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Link component
<Link href="/dashboard">Dashboard</Link>

// Programmatic navigation
const router = useRouter();
router.push('/dashboard');
```

## State Management

### Zustand Store Example

```typescript
import { create } from 'zustand';

interface UserState {
  user: User | null;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
}));
```

### Usage
```tsx
const { user, setUser } = useUserStore();
```

## Forms & Validation

### React Hook Form + Zod

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be 8+ characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    // Handle login
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}
      
      <input type="password" {...register('password')} />
      {errors.password && <span>{errors.password.message}</span>}
      
      <button type="submit">Login</button>
    </form>
  );
}
```

## API Integration

### API Client Setup

```typescript
// lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  timeout: 10000,
});

// Request interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Usage
```typescript
import api from '@/lib/api';

// GET request
const users = await api.get('/api/v1/users');

// POST request
const newUser = await api.post('/api/v1/users', {
  email: 'user@example.com',
  username: 'newuser',
});
```

## Authentication

### NextAuth Configuration

```typescript
// auth.ts
import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';

export const authConfig: NextAuthConfig = {
  providers: [
    {
      id: 'casdoor',
      name: 'Casdoor',
      type: 'oauth',
      authorization: {
        url: `${process.env.CASDOOR_ENDPOINT}/login/oauth/authorize`,
        params: { scope: 'openid profile email' },
      },
      token: `${process.env.CASDOOR_ENDPOINT}/login/oauth/access_token`,
      userinfo: `${process.env.CASDOOR_ENDPOINT}/api/get-account`,
      clientId: process.env.CASDOOR_CLIENT_ID,
      clientSecret: process.env.CASDOOR_CLIENT_SECRET,
    },
  ],
  pages: {
    signIn: '/login',
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
```

### Protected Routes

```typescript
// middleware.ts
import { auth } from './auth';

export default auth((req) => {
  if (!req.auth && req.nextUrl.pathname.startsWith('/dashboard')) {
    return Response.redirect(new URL('/login', req.url));
  }
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

## Code Style

### Component Structure

```tsx
// components/UserCard.tsx
import { FC } from 'react';
import { cn } from '@/lib/utils';

interface UserCardProps {
  user: User;
  className?: string;
  onEdit?: () => void;
}

export const UserCard: FC<UserCardProps> = ({ 
  user, 
  className,
  onEdit 
}) => {
  return (
    <div className={cn('rounded-lg border p-4', className)}>
      <h3 className="text-lg font-semibold">{user.username}</h3>
      <p className="text-sm text-muted-foreground">{user.email}</p>
      {onEdit && (
        <button onClick={onEdit} className="mt-2">
          Edit
        </button>
      )}
    </div>
  );
};
```

### Naming Conventions

- **Components**: PascalCase (`UserCard.tsx`)
- **Hooks**: camelCase with `use` prefix (`useUser.ts`)
- **Utils**: camelCase (`formatDate.ts`)
- **Constants**: UPPER_SNAKE_CASE (`API_URL`)

### File Organization

```
components/
├── ui/              # Reusable UI components
├── forms/           # Form components
├── layouts/         # Layout components
└── features/        # Feature-specific components
    └── users/
        ├── UserCard.tsx
        ├── UserList.tsx
        └── UserForm.tsx
```

## Performance

### Image Optimization
```tsx
import Image from 'next/image';

<Image 
  src="/logo.png" 
  alt="Logo" 
  width={200} 
  height={100}
  priority  // For above-the-fold images
/>
```

### Code Splitting
```tsx
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <p>Loading...</p>,
});
```

### Caching
```typescript
// Server Component with caching
export default async function Page() {
  const data = await fetch('https://api.example.com/data', {
    next: { revalidate: 3600 } // Cache for 1 hour
  });
  
  return <div>{/* render data */}</div>;
}
```

## Accessibility

### ARIA Labels
```tsx
<button aria-label="Close dialog">
  <X className="h-4 w-4" />
</button>
```

### Keyboard Navigation
```tsx
<div 
  role="button" 
  tabIndex={0}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
>
  Click me
</div>
```

### Focus Management
```tsx
import { useRef, useEffect } from 'react';

const inputRef = useRef<HTMLInputElement>(null);

useEffect(() => {
  inputRef.current?.focus();
}, []);

<input ref={inputRef} />
```

## Testing

### Component Testing (Jest + React Testing Library)

```typescript
import { render, screen } from '@testing-library/react';
import { UserCard } from './UserCard';

describe('UserCard', () => {
  it('renders user information', () => {
    const user = { username: 'testuser', email: 'test@example.com' };
    render(<UserCard user={user} />);
    
    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });
});
```

## Environment Variables

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

CASDOOR_ENDPOINT=http://localhost:8001
CASDOOR_CLIENT_ID=your-client-id
CASDOOR_CLIENT_SECRET=your-client-secret
```

## Build & Deployment

```bash
# Development
npm run dev

# Build
npm run build

# Production
npm run start

# Lint
npm run lint
```
