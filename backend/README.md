# Admin Panel Backend

A Node.js/Express backend for the MERN Admin Panel with JWT authentication, role-based access control, and Excel file upload functionality.

## Features

- **Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (Super Admin, Admin, Sub Seizer)
  - Password hashing with bcrypt

- **User Management**
  - Create, read, update, delete users
  - Status management (Active, Inactive, Hold)
  - Profile image upload
  - Search and filtering

- **Vehicle Management**
  - Excel file upload and parsing
  - Bulk vehicle data insertion
  - CRUD operations for vehicles
  - Advanced search and filtering

- **Security**
  - Input validation with express-validator
  - File upload security with multer
  - CORS configuration
  - Error handling middleware

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `config.env` file in the root directory:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/admin_panel
   JWT_SECRET=your_jwt_secret_key_here_change_in_production
   NODE_ENV=development
   ```

4. **Create upload directories**
   ```bash
   mkdir -p uploads/profiles uploads/excel
   ```

5. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## Default Super Admin

On first run, a default Super Admin user is created:
- **Username**: `superadmin`
- **Password**: `admin123`

**⚠️ Important**: Change these credentials after first login!

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login (Super Admin only for web panel)
- `GET /api/auth/me` - Get current user profile

### Users
- `GET /api/users` - Get all users (with search/filter)
- `POST /api/users` - Create new user
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `PATCH /api/users/:id/status` - Update user status
- `DELETE /api/users/:id` - Delete user
- `POST /api/users/:id/profile-image` - Upload profile image

### Vehicles
- `GET /api/vehicles` - Get all vehicles (with search/filter)
- `POST /api/vehicles/upload` - Upload Excel file
- `GET /api/vehicles/:id` - Get vehicle by ID
- `PUT /api/vehicles/:id` - Update vehicle
- `DELETE /api/vehicles/:id` - Delete vehicle
- `GET /api/vehicles/stats/summary` - Get vehicle statistics

## Database Models

### User Model
```javascript
{
  fullName: String,
  username: String (unique),
  password: String (hashed),
  employeeId: String (unique),
  mobileNo: String,
  status: String (Active/Inactive/Hold),
  iCard: String (optional),
  profileImage: String,
  role: String (Super Admin/Admin/Sub Seizer),
  group: String (for Sub Seizer only),
  createdBy: ObjectId (ref: User)
}
```

### Vehicle Model
```javascript
{
  vehicleNo: String,
  chassisNo: String,
  engineNo: String,
  agNo: String,
  branch: String,
  customerName: String,
  bkt: String,
  area: String,
  vehicleMaker: String,
  lpp: String,
  bcc: String,
  companyName: String,
  companyBranch: String,
  companyContact: String,
  companyContactPerson: String,
  agencyName: String,
  agencyContact: String,
  uploadedBy: ObjectId (ref: User)
}
```

## Excel Upload Format

The Excel file should contain the following columns:
- Vehicle No
- Chassis No
- Engine No
- AG No
- Branch
- Customer Name
- BKT
- Area
- Vehicle Maker
- LPP
- BCC
- Company Name
- Company Branch
- Company Contact
- Company Contact Person
- Agency Name
- Agency Contact

## Security Features

- **Password Hashing**: All passwords are hashed using bcrypt
- **JWT Tokens**: Secure authentication with JSON Web Tokens
- **Input Validation**: All inputs are validated using express-validator
- **File Upload Security**: File type and size restrictions
- **CORS**: Configured for cross-origin requests
- **Error Handling**: Comprehensive error handling middleware

## Development

### Scripts
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm test` - Run tests (if configured)

### File Structure
```
backend/
├── models/          # Database models
├── routes/          # API routes
├── middleware/      # Custom middleware
├── utils/           # Utility functions
├── uploads/         # File uploads directory
├── server.js        # Main server file
├── package.json     # Dependencies
└── config.env       # Environment variables
```

## Production Deployment

1. **Set environment variables**
   - Use a strong JWT_SECRET
   - Configure MongoDB connection string
   - Set NODE_ENV=production

2. **Security considerations**
   - Use HTTPS
   - Configure proper CORS settings
   - Set up rate limiting
   - Use environment variables for sensitive data

3. **File uploads**
   - Configure proper file storage (consider cloud storage)
   - Set appropriate file size limits
   - Implement file cleanup

## License

MIT License 