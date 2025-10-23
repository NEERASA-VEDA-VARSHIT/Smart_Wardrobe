# SmartWardrobe Frontend

A modern, AI-powered wardrobe management application built with React and Tailwind CSS.

## Features

- **Landing Page**: Beautiful hero section with features showcase and call-to-action
- **Authentication**: Sign in, sign up, and password reset pages
- **Dashboard**: Main application interface with wardrobe management
- **Responsive Design**: Mobile-first approach with modern UI/UX
- **Dark Theme**: Elegant dark gradient design with yellow accents

## Pages

- `/` - Landing page with hero section and features
- `/signin` - User login page
- `/signup` - User registration page
- `/forgot-password` - Password reset page
- `/home` - Main dashboard (requires authentication)

## Tech Stack

- **React 19** - Frontend framework
- **Tailwind CSS 4** - Utility-first CSS framework
- **React Router DOM** - Client-side routing
- **Vite** - Build tool and development server

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:5173`

## Design System

### Colors
- **Primary**: Yellow (#fbbf24)
- **Background**: Dark gradient (gray-900 to black)
- **Text**: White and gray variants
- **Accents**: Blue, green, purple for different features

### Typography
- **Font**: Inter (system font fallback)
- **Headings**: Bold, large sizes
- **Body**: Regular weight, readable sizes

### Components
- **Buttons**: Rounded corners, hover effects, yellow primary
- **Cards**: Glass morphism effect, subtle borders
- **Forms**: Clean inputs with focus states
- **Navigation**: Minimalist with clear hierarchy

## Project Structure

```
src/
├── pages/
│   ├── Landing.jsx          # Landing page
│   ├── SignIn.jsx           # Login page
│   ├── SignUp.jsx           # Registration page
│   ├── ForgotPassword.jsx   # Password reset page
│   └── Home.jsx             # Main dashboard
├── App.jsx                  # Main app component with routing
├── index.css                # Global styles and animations
└── main.jsx                 # Entry point
```

## Development

- **Hot Reload**: Changes are reflected immediately
- **ESLint**: Code linting for quality
- **Tailwind**: Utility classes for rapid styling
- **Responsive**: Mobile-first responsive design

## Future Enhancements

- State management with Redux/Context
- API integration for backend communication
- Image upload and processing
- AI-powered outfit recommendations
- User profile management
- Social features and sharing