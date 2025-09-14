# BINGO Display Application

A high-performance, secure, and well-organized real-time BINGO game display interface built with Next.js 15, React 19, and TypeScript.

## 🏗️ Architecture Overview

The application follows industry-standard patterns with clear separation of concerns:

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Main display page
│   └── globals.css        # Global styles
├── components/            # Reusable UI components
│   ├── ui/               # Basic UI components
│   ├── bingo/            # BINGO-specific components
│   └── layout/           # Layout components
├── hooks/                # Custom React hooks
├── lib/                  # Utilities and configurations
├── types/                # TypeScript type definitions
└── styles/               # Additional styles
```

## 🚀 Features

### Core Functionality
- **Real-time BINGO Display**: Live game updates via Socket.IO
- **3D Animated Effects**: Keno ball animations and visual feedback
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Fullscreen Support**: Cross-browser fullscreen functionality
- **Multi-language Support**: AM (Amharic), OR (Oromo), TG (Tigrinya)

### Security Features
- **Input Validation**: Comprehensive token and data validation
- **XSS Prevention**: Input sanitization and CSP headers
- **Rate Limiting**: Built-in rate limiting for API calls
- **Error Handling**: Robust error handling and logging
- **Memory Management**: Automatic cleanup and leak prevention

### Performance Optimizations
- **Code Splitting**: Automatic code splitting with Next.js
- **Bundle Optimization**: Optimized package imports
- **Image Optimization**: WebP and AVIF support
- **Debouncing/Throttling**: Performance utilities for user interactions
- **React.memo**: Component memoization for better performance

## 🛠️ Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript 5
- **UI Library**: React 19
- **Styling**: Tailwind CSS v4
- **Real-time**: Socket.IO Client
- **Build Tool**: Next.js built-in bundler
- **Linting**: ESLint with Next.js config

## 📦 Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

### Socket.IO Configuration

The application connects to the BINGO server using Socket.IO with the following configuration:

- **Base URL**: Configurable via `NEXT_PUBLIC_API_BASE_URL`
- **Authentication**: Display token passed via URL parameter
- **Reconnection**: Automatic reconnection with exponential backoff
- **Error Handling**: Comprehensive error handling and logging

## 🎮 Usage

### Accessing the Display

The display is accessed via URL with a display token:

```
http://localhost:3000?token=DISPLAY_TOKEN
```

### Display Features

1. **BINGO Board**: Interactive 75-number grid with real-time updates
2. **Current Number**: 3D animated display of the current called number
3. **Game Information**: Real-time status, progress, and statistics
4. **Verification Modal**: Winner verification display
5. **Language Selection**: Multi-language support for announcements

## 🔒 Security

### Security Headers

The application includes comprehensive security headers:

- **X-Frame-Options**: DENY (prevents clickjacking)
- **X-Content-Type-Options**: nosniff (prevents MIME sniffing)
- **Referrer-Policy**: origin-when-cross-origin
- **X-XSS-Protection**: 1; mode=block
- **Strict-Transport-Security**: max-age=31536000; includeSubDomains
- **Content-Security-Policy**: Comprehensive CSP policy

### Input Validation

- **Token Validation**: Secure display token validation
- **XSS Prevention**: Input sanitization utilities
- **URL Validation**: Secure URL parsing and validation
- **Type Safety**: Full TypeScript coverage

## 🎨 Styling

### Design System

The application uses a consistent design system:

- **Color Palette**: Green theme with consistent color usage
- **Typography**: Geist font family for modern readability
- **Spacing**: Consistent spacing using Tailwind's spacing scale
- **Animations**: Smooth transitions and micro-interactions

### Responsive Design

- **Mobile-First**: Responsive design starting from mobile
- **Breakpoints**: Tailwind CSS breakpoints for all screen sizes
- **Touch-Friendly**: Optimized for touch interactions
- **Accessibility**: ARIA labels and keyboard navigation

## 🔧 Development

### Code Organization

The codebase follows industry best practices:

- **Separation of Concerns**: Clear separation between UI, logic, and data
- **Component Composition**: Reusable components with proper props
- **Custom Hooks**: Encapsulated logic in custom hooks
- **Type Safety**: Full TypeScript coverage with strict types
- **Error Boundaries**: Comprehensive error handling

### Performance

- **Bundle Size**: Optimized bundle with tree shaking
- **Lazy Loading**: Automatic code splitting
- **Caching**: Efficient caching strategies
- **Memory Management**: Automatic cleanup and leak prevention

## 🚀 Deployment

### Production Build

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Environment Setup

1. Set `NEXT_PUBLIC_API_BASE_URL` to your BINGO server URL
2. Configure any additional environment variables
3. Ensure proper SSL/TLS configuration for production

### Docker Support

The application can be containerized using Docker:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📊 Monitoring

### Error Tracking

The application includes comprehensive error handling:

- **Client-side Errors**: Automatic error capture and logging
- **Network Errors**: Socket.IO connection error handling
- **Performance Monitoring**: Built-in performance tracking
- **User Analytics**: Anonymous usage analytics (optional)

### Health Checks

- **Connection Status**: Real-time connection monitoring
- **Game Status**: Live game state tracking
- **Performance Metrics**: Automatic performance monitoring

## 🤝 Contributing

### Development Guidelines

1. **TypeScript**: All code must be properly typed
2. **ESLint**: Follow the established linting rules
3. **Testing**: Write tests for new features
4. **Documentation**: Update documentation for changes
5. **Performance**: Ensure optimal performance

### Code Style

- **Prettier**: Automatic code formatting
- **ESLint**: Code quality enforcement
- **TypeScript**: Strict type checking
- **Conventional Commits**: Standard commit message format

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:

1. Check the documentation
2. Review existing issues
3. Create a new issue with detailed information
4. Contact the development team

---

**Built with ❤️ for the BINGO gaming community**
