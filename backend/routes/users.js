const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth, requireSuperAdmin } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const { google } = require('googleapis');
const fs = require('fs');
const Vehicle = require('../models/Vehicle');

const router = express.Router();

// Ensure uploads/profiles directory exists (temporary storage)
const uploadDir = path.join(__dirname, '..', 'uploads', 'profiles');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for temporary file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/profiles/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// ───────── Google Drive setup ─────────
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

/**
 * Build the service‑account credential object from environment variables.
 * Make sure every env var below is defined (see your .env template).
 */
const gdriveCredentials = {
  type: 'service_account',
  project_id: process.env.GOOGLE_CLOUD_PROJECT_ID,
  private_key_id: process.env.GOOGLE_CLOUD_PRIVATE_KEY_ID,
  private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
  client_id: process.env.GOOGLE_CLOUD_CLIENT_ID,
  auth_uri: process.env.GOOGLE_CLOUD_AUTH_URI,
  token_uri: process.env.GOOGLE_CLOUD_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.GOOGLE_CLOUD_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.GOOGLE_CLOUD_CLIENT_X509_CERT_URL,
  universe_domain: process.env.GOOGLE_CLOUD_UNIVERSE_DOMAIN,
};

// Fail fast if required vars are missing
if (!gdriveCredentials.private_key || !gdriveCredentials.client_email) {
  console.error(
    '❌  Google Drive env vars are missing. Check your .env file.'
  );
  process.exit(1);
}

const authGoogle = new google.auth.GoogleAuth({
  credentials: gdriveCredentials,
  scopes: SCOPES,
});

const drive = google.drive({ version: 'v3', auth: authGoogle });

console.log('✅  Google Drive setup completed with env credentials');

console.log('Google Drive setup completed successfully');

// Helper function to upload file to Google Drive
const uploadToGoogleDrive = async (filePath, originalName) => {
  try {
    // Verify file exists before attempting upload
    if (!fs.existsSync(filePath)) {
      throw new Error('File does not exist');
    }

    const fileMetadata = {
      name: originalName,
      // Don't specify parents - upload to root of Google Drive
    };
    
    // Determine MIME type based on file extension
    const ext = path.extname(originalName).toLowerCase();
    let mimeType = 'image/jpeg'; // default
    if (ext === '.png') mimeType = 'image/png';
    else if (ext === '.gif') mimeType = 'image/gif';
    else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
    
    const media = {
      mimeType: mimeType,
      body: fs.createReadStream(filePath),
    };
    
    console.log('Uploading to Google Drive:', { filePath, originalName, mimeType });
    
    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id',
    });
    
    console.log('Google Drive upload response:', response.data);
    
    // Make file public
    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: { role: 'reader', type: 'anyone' },
    });
    
    return `https://drive.google.com/uc?id=${response.data.id}`;
  } catch (error) {
    console.error('Google Drive upload error:', error);
    throw new Error(`Failed to upload to Google Drive: ${error.message}`);
  }
};

// Helper function to delete file from Google Drive
const deleteFromGoogleDrive = async (fileUrl) => {
  try {
    if (!fileUrl || !fileUrl.includes('drive.google.com')) {
      console.log('Invalid Google Drive URL for deletion:', fileUrl);
      return;
    }
    
    const fileId = fileUrl.match(/id=([^&]+)/)?.[1];
    if (fileId) {
      console.log('Deleting file from Google Drive:', fileId);
      await drive.files.delete({
        fileId: fileId,
      });
      console.log('File deleted successfully from Google Drive');
    } else {
      console.log('Could not extract file ID from URL:', fileUrl);
    }
  } catch (error) {
    console.error('Google Drive delete error:', error);
    // Don't throw error for delete operations
  }
};

// @route   POST /api/users
// @desc    Create new Admin or Sub Seizer
// @access  Private (Super Admin only)
router.post('/', [
  auth,
  requireSuperAdmin,
  body('fullName').notEmpty().withMessage('Full name is required'),
  body('username').notEmpty().withMessage('Username is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('mobileNo').notEmpty().withMessage('Mobile number is required'),
  body('role').isIn(['Admin', 'Sub Seizer']).withMessage('Role must be Admin or Sub Seizer'),
  // body('group').optional().isIn(['Two Wheeler', '3 Wheeler', '4 Wheeler', 'CV', 'CE'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const { fullName, username, password, mobileNo, role, group, iCard } = req.body;

    // Check if group is provided for Sub Seizer
    if (role === 'Sub Seizer' && !group) {
      return res.status(400).json({
        success: false,
        message: 'Group is required for Sub Seizer'
      });
    }

    // Generate a unique random 4-digit employeeId
    const generateEmployeeId = async () => {
      const MIN = 1000;
      const MAX = 9999;
      const MAX_ATTEMPTS = 20;

      for (let i = 0; i < MAX_ATTEMPTS; i++) {
        const randomId = Math.floor(Math.random() * (MAX - MIN + 1)) + MIN;
        const exists = await User.exists({ employeeId: String(randomId) });
        if (!exists) return String(randomId);
      }

      throw new Error('Unable to generate unique employee ID');
    };

    const nextEmployeeId = await generateEmployeeId();

    const userData = {
      fullName,
      username: username.toLowerCase(),
      password,
      employeeId: nextEmployeeId,
      mobileNo,
      role,
      iCard,
      createdBy: req.user._id
    };

    if (role === 'Sub Seizer') {
      userData.group = group;
    }

    const user = new User(userData);
    await user.save();

    res.status(201).json({
      success: true,
      message: `${role} created successfully`,
      user: user.toPublicJSON()
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// @route   GET /api/users
// @desc    Get all users (Admins and Sub Seizers)
// @access  Private (Super Admin only)
router.get('/', [auth, requireSuperAdmin], async (req, res) => {
  try {
    const { page = 1, limit = 10, role, status, search } = req.query;
    
    const query = { role: { $in: ['Admin', 'Sub Seizer'] } };
    
    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .populate('createdBy', 'fullName username')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private (Super Admin only)
router.get('/:id', [auth, requireSuperAdmin], async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('createdBy', 'fullName username');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private (Super Admin only)
router.put('/:id', [
  auth,
  requireSuperAdmin,
  body('fullName').optional().notEmpty().withMessage('Full name cannot be empty'),
  body('mobileNo').optional().notEmpty().withMessage('Mobile number cannot be empty'),
  body('role').optional().isIn(['Admin', 'Sub Seizer']).withMessage('Invalid role'),
  // body('group').optional().isIn(['Two Wheeler', '3 Wheeler', '4 Wheeler', 'CV', 'CE'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const { fullName, mobileNo, role, group, iCard } = req.body;

    // Update fields
    if (fullName) user.fullName = fullName;
    if (mobileNo) user.mobileNo = mobileNo;
    if (role) user.role = role;
    if (iCard !== undefined) user.iCard = iCard;

    // Handle group for Sub Seizer
    if (role === 'Sub Seizer' && !group) {
      return res.status(400).json({
        success: false,
        message: 'Group is required for Sub Seizer'
      });
    }
    if (group) user.group = group;

    await user.save();

    res.json({
      success: true,
      message: 'User updated successfully',
      user: user.toPublicJSON()
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// @route   PATCH /api/users/:id/status
// @desc    Update user status
// @access  Private (Super Admin only)
router.patch('/:id/status', [
  auth,
  requireSuperAdmin,
  body('status').isIn(['Active', 'Inactive', 'Hold']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.status = req.body.status;
    await user.save();

    res.json({
      success: true,
      message: 'User status updated successfully',
      user: user.toPublicJSON()
    });

  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Private (Super Admin only)
router.delete('/:id', [auth, requireSuperAdmin], async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete profile image from Google Drive if exists
    if (user.profileImage) {
      await deleteFromGoogleDrive(user.profileImage);
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// @route   POST /api/users/:id/profile-image
// @desc    Upload profile image to Google Drive
// @access  Private (Super Admin only)
router.post('/:id/profile-image', [auth, requireSuperAdmin, upload.single('profileImage')], async (req, res) => {
  let tempFilePath = null;
  
  try {
    console.log('Profile image upload request received');
    
    if (!req.file) {
      console.log('No file received in request');
      return res.status(400).json({
        success: false,
        message: 'Please upload an image file'
      });
    }

    tempFilePath = req.file.path;
    console.log('Temporary file path:', tempFilePath);

    const user = await User.findById(req.params.id);
    if (!user) {
      console.log('User not found:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('User found:', user.fullName);

    // Verify the temporary file exists
    if (!fs.existsSync(tempFilePath)) {
      console.log('Temporary file does not exist:', tempFilePath);
      return res.status(500).json({
        success: false,
        message: 'Uploaded file not found'
      });
    }

    console.log('Temporary file exists, size:', fs.statSync(tempFilePath).size);

    // Delete old profile image from Google Drive if exists
    if (user.profileImage) {
      console.log('Deleting old profile image:', user.profileImage);
      await deleteFromGoogleDrive(user.profileImage);
    }

    // Upload new image to Google Drive
    console.log('Starting Google Drive upload...');
    const googleDriveUrl = await uploadToGoogleDrive(tempFilePath, req.file.originalname);
    console.log('Google Drive upload successful, URL:', googleDriveUrl);
    
    // Clean up temporary file
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
      console.log('Temporary file cleaned up');
    }

    // Update user with new profile image URL
    user.profileImage = googleDriveUrl;
    await user.save();
    console.log('User profile image updated in database');

    res.json({
      success: true,
      message: 'Profile image uploaded successfully',
      profileImage: user.profileImage
    });

  } catch (error) {
    console.error('Upload profile image error:', error);
    
    // Clean up temporary file if upload failed
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
        console.log('Temporary file cleaned up after error');
      } catch (cleanupError) {
        console.error('Error cleaning up temp file:', cleanupError);
      }
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Failed to upload profile image' 
    });
  }
});

// @route   DELETE /api/users/:id/profile-image
// @desc    Delete profile image from Google Drive
// @access  Private (Super Admin only)
router.delete('/:id/profile-image', [auth, requireSuperAdmin], async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.profileImage) {
      return res.status(404).json({
        success: false,
        message: 'No profile image found'
      });
    }

    // Delete file from Google Drive
    await deleteFromGoogleDrive(user.profileImage);

    // Remove profile image reference from user
    user.profileImage = null;
    await user.save();

    res.json({
      success: true,
      message: 'Profile image deleted successfully'
    });

  } catch (error) {
    console.error('Delete profile image error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// @route   GET /api/dashboard/summary
// @desc    Get dashboard summary counts
// @access  Private (Super Admin only)
router.get('/dashboard/summary', [auth, requireSuperAdmin], async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalVehicles = await Vehicle.countDocuments();
    // Count unique companies and areas in vehicles
    const uniqueCompanies = await Vehicle.distinct('companyName');
    const totalCompanies = uniqueCompanies.length;
    const uniqueAreas = await Vehicle.distinct('area');
    const totalAreas = uniqueAreas.length;
    res.json({
      totalUsers,
      totalVehicles,
      totalCompanies,
      totalAreas
    });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router; 