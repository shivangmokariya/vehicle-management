# Admin Panel Frontend

A modern React frontend for the MERN Admin Panel built with Vite, featuring a responsive design with Tailwind CSS and advanced UI components.

## Features

- **Modern UI/UX**
  - Responsive design with Tailwind CSS
  - Dark/light theme support
  - Advanced components with Headless UI
  - Smooth animations and transitions

- **Authentication**
  - JWT-based authentication
  - Protected routes
  - Automatic token management
  - Login/logout functionality

- **User Management**
  - Create, edit, view, delete users
  - Status management (Active, Inactive, Hold)
  - Role-based user creation (Admin, Sub Seizer)
  - Profile image upload
  - Advanced search and filtering

- **Vehicle Management**
  - Excel file upload interface
  - Bulk vehicle data management
  - CRUD operations for vehicles
  - Advanced search and filtering
  - Statistics dashboard

- **State Management**
  - React Query for server state
  - React Hook Form for form management
  - Context API for authentication

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend server running (see backend README)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## Default Login Credentials

- **Username**: `superadmin`
- **Password**: `admin123`

**⚠️ Important**: Change these credentials after first login!

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
frontend/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable components
│   ├── contexts/        # React contexts
│   ├── pages/           # Page components
│   ├── services/        # API services
│   ├── App.jsx          # Main app component
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
├── package.json         # Dependencies
├── vite.config.js       # Vite configuration
├── tailwind.config.js   # Tailwind configuration
└── postcss.config.js    # PostCSS configuration
```

## Key Technologies

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **React Query** - Server state management
- **React Hook Form** - Form handling
- **Tailwind CSS** - Utility-first CSS framework
- **Headless UI** - Unstyled, accessible UI components
- **Heroicons** - Icon library
- **Axios** - HTTP client
- **React Hot Toast** - Toast notifications

## Features Breakdown

### Authentication
- Login form with validation
- JWT token management
- Protected routes
- Automatic logout on token expiry

### Dashboard
- Statistics overview
- Quick action buttons
- System information display

### User Management
- **User List**: Display all users with search and filtering
- **Create User**: Form to create new Admin or Sub Seizer users
- **Edit User**: Update user information
- **Status Management**: Change user status (Active/Inactive/Hold)
- **Delete User**: Remove users from the system
- **Profile Images**: Upload and manage user profile pictures

### Vehicle Management
- **Vehicle List**: Display all vehicles with advanced search
- **Excel Upload**: Upload Excel files for bulk vehicle data
- **Edit Vehicle**: Update individual vehicle records
- **View Details**: Detailed vehicle information modal
- **Delete Vehicle**: Remove vehicles from the system

## API Integration

The frontend communicates with the backend through RESTful APIs:

- **Authentication**: `/api/auth/*`
- **Users**: `/api/users/*`
- **Vehicles**: `/api/vehicles/*`

All API calls are handled through the `services/api.js` file with automatic token management and error handling.

## Styling

The application uses Tailwind CSS for styling with custom components:

- **Buttons**: `.btn-primary`, `.btn-secondary`, `.btn-danger`
- **Forms**: `.input-field`
- **Cards**: `.card`
- **Tables**: `.table-container`, `.table`, `.table-header`, `.table-body`

## Responsive Design

The application is fully responsive with:
- Mobile-first design approach
- Collapsible sidebar for mobile devices
- Responsive tables with horizontal scrolling
- Adaptive form layouts

## Development

### Adding New Pages
1. Create a new component in `src/pages/`
2. Add the route in `src/App.jsx`
3. Add navigation link in `src/components/Layout.jsx`

### Adding New API Calls
1. Add the API function in `src/services/api.js`
2. Use React Query hooks in components
3. Handle loading and error states

### Styling Guidelines
- Use Tailwind CSS utility classes
- Follow the existing component patterns
- Maintain consistency with the design system

## Production Build

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Preview the build**
   ```bash
   npm run preview
   ```

3. **Deploy**
   - The `dist` folder contains the production build
   - Deploy to your preferred hosting service

## Environment Variables

Create a `.env` file for environment-specific configuration:

### Production (Default)
```env
VITE_API_BASE_URL=https://vehicle-management-z4pv.onrender.com
```

### Local Development
Create a `.env.local` file to override the production URL:
```env
VITE_API_BASE_URL=http://localhost:5000
```

**Note**: The `.env.local` file takes precedence over `.env` and is ignored by git for security.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance

- Code splitting with React Router
- Lazy loading of components
- Optimized bundle size with Vite
- Efficient re-renders with React Query

## Security

- JWT token storage in localStorage
- Automatic token refresh
- Protected routes
- Input validation
- XSS protection

## License

MIT License 