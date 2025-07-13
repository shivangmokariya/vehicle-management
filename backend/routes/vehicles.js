const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');
const { parse } = require('csv-parse/sync');
const fs = require('fs');
const Vehicle = require('../models/Vehicle');
const Batch = require('../models/Batch');
const { auth, requireSuperAdmin } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { uploadFileToDrive } = require('../utils/googleDrive');

const router = express.Router();

// Configure multer for Excel file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = 'uploads/excel/';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /xlsx|xls|csv/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || 
                    file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                    file.mimetype === 'application/vnd.ms-excel' ||
                    file.mimetype === 'text/csv';
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only Excel (.xlsx, .xls) and CSV (.csv) files are allowed!'));
    }
  }
});

// Helper function to parse Excel file
const parseExcelFile = (filePath) => {
  try {
    const workbook   = xlsx.readFile(filePath);
    const sheetName  = workbook.SheetNames[0];
    const worksheet  = workbook.Sheets[sheetName];
    const rows       = xlsx.utils.sheet_to_json(worksheet);

    return rows.map(row => ({
      state: row['State'] || '',
      branch: row['Branch'] || '',
      city: row['City'] || '',
      fileNo: row['File No'] || row['FileNo'] || '',
      loanAgreementNo: row['loan_agreement_no'] || row['Loan Agreement No'] || '',
      nameOfClient: row['Name Of Client'] || row['Name of Client'] || '',
      vehicleType: row['Vehicle Type'] || '',
      make: row['Make'] || '',
      model: row['Model'] || '',
      year: row['Year'] || '',
      regNo: row['Reg No'] || row['RegNo'] || '',
      engineNo: row['Engine No'] || row['EngineNo'] || '',
      chassisNo: row['Chasis No'] || row['Chassis No'] || row['ChassisNo'] || '',
      month: row['Month'] || '',
      bkt: row['Bkt'] || row['bkt'] || '',
      emi: row['EMI'] || '',
      pos: row['Pos'] || '',
      tos: row['Tos'] || '',
      fcAmt: row['FC Amt'] || '',
      loanAmount: row['loan_amount'] || row['Loan Amount'] || '',
      dpd: row['dpd'] || '',
      customerAddress: row['customer_address'] || '',
      customerMobileNumber: row['Customer Mobile Number'] || '',
      groupAccountCount: row['Group Account Count'] || '',
      contactPerson1: row['Cont. Person1'] || row['Contact Person1'] || '',
      mobileNumber1: row['Mobile number'] || row['Mobile Number'] || row['Mobile number1'] || '',
      contactPerson2: row['Cont. Person2'] || row['Contact Person2'] || '',
      mobileNumber2: row['Mobile number2'] || '',
      // legacy/required fields for compatibility
      vehicleNo: row['vehicleNo'] || row['Vehicle No'] || row['VehicleNo'] || row['Vehicle No.'] || row['Reg No'] || row['RegNo'] || '',
      customerName: row['customerName'] || row['Customer Name'] || row['Name Of Client'] || row['Name of Client'] || '',
      area: row['area'] || row['Area'] || row['City'] || '',
      vehicleMaker: row['vehicleMaker'] || row['Vehicle Maker'] || row['Make'] || '',
      companyName: row['companyName'] || row['Company Name'] || '',
      companyBranch: row['companyBranch'] || row['Company Branch'] || '',
      companyContact: row['companyContact'] || row['Company Contact'] || '',
      companyContactPerson: row['companyContactPerson'] || row['Company Contact Person'] || '',
      agencyName: row['agencyName'] || row['Agency Name'] || '',
      agencyContact: row['agencyContact'] || row['Agency Contact'] || '',
      group: row['group'] || row['Group'] ? String(row['group'] || row['Group']).split(',')[0].trim() : '',
    }));
  } catch (error) {
    throw new Error('Error parsing Excel file: ' + error.message);
  }
};


// Helper function to parse CSV file
const parseCSVFile = (filePath) => {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });
    return records.map(row => ({
      vehicleNo: row['Vehicle No'] || row['VehicleNo'] || row['Vehicle No.'] || '',
      chassisNo: row['Chassis No'] || row['ChassisNo'] || row['Chassis No.'] || '',
      engineNo: row['Engine No'] || row['EngineNo'] || row['Engine No.'] || '',
      agNo: row['AG No'] || row['AGNo'] || row['AG No.'] || '',
      branch: row['Branch'] || '',
      customerName: row['Customer Name'] || row['CustomerName'] || '',
      bkt: row['BKT'] || '',
      area: row['Area'] || '',
      vehicleMaker: row['Vehicle Maker'] || row['VehicleMaker'] || '',
      lpp: row['LPP'] || '',
      bcc: row['BCC'] || '',
      companyName: row['Company Name'] || row['CompanyName'] || '',
      companyBranch: row['Company Branch'] || row['CompanyBranch'] || '',
      companyContact: row['Company Contact'] || row['CompanyContact'] || '',
      companyContactPerson: row['Company Contact Person'] || row['CompanyContactPerson'] || '',
      agencyName: row['Agency Name'] || row['AgencyName'] || '',
      agencyContact: row['Agency Contact'] || row['AgencyContact'] || '',
      group: row['group'] || row['Group'] ? String(row['group'] || row['Group']).split(',')[0].trim() : '',
    }));
  } catch (error) {
    throw new Error('Error parsing CSV file: ' + error.message);
  }
};


// @route   GET /api/vehicles/app
// @desc    Get vehicles for app (role-based fields and group filtering)
// @access  Private (Admin, Sub Seizer)
router.get('/app', auth, async (req, res) => {
  try {
    const { page = 1, limit = 15, search, vehicleNo, chassisNo, customerName, companyName, branch, area, vehicleMaker } = req.query;
    const query = {};

    // Search across multiple fields
    if (search) {
      query.$or = [
        { vehicleNo: { $regex: search, $options: 'i' } },
        { chassisNo: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
        { branch: { $regex: search, $options: 'i' } }
      ];
    }
    if (vehicleNo) query.vehicleNo = { $regex: vehicleNo, $options: 'i' };
    if (chassisNo) query.chassisNo = { $regex: chassisNo, $options: 'i' };
    if (customerName) query.customerName = { $regex: customerName, $options: 'i' };
    if (companyName) query.companyName = { $regex: companyName, $options: 'i' };
    if (branch) query.branch = { $regex: branch, $options: 'i' };
    if (area) query.area = { $regex: area, $options: 'i' };
    if (vehicleMaker) query.vehicleMaker = { $regex: vehicleMaker, $options: 'i' };

    // Role-based filtering
    if (req.user.role === 'Admin') {
      // Admin: see all vehicles, all fields
      const vehicles = await Vehicle.find(query)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
      const total = await Vehicle.countDocuments(query);
      return res.json({
        success: true,
        vehicles,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total
      });
    } else if (req.user.role === 'Sub Seizer') {
      // Sub Seizer: only see vehicles in their group(s), only specific fields
      let userGroups = req.user.group || [];
      if (!Array.isArray(userGroups)) userGroups = [userGroups];
      query.vehicleType = { $in: userGroups };
      const vehicles = await Vehicle.find(query, {
        vehicleNo: 1,
        chassisNo: 1,
        engineNo: 1,
        customerName: 1,
        vehicleMaker: 1,
        agencyName: 1,
        agencyContact: 1,
        vehicleType: 1
      })
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
      const total = await Vehicle.countDocuments(query);
      return res.json({
        success: true,
        vehicles,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total
      });
    } else {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
  } catch (error) {
    console.error('Get vehicles (app) error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/vehicles/upload-data
// @desc    Upload vehicle data from frontend (no file upload)
// @access  Private (Super Admin only)
router.post('/upload-data', [auth, requireSuperAdmin], async (req, res) => {
  try {
    // console.log('Upload-data route called');
    // console.log('Request body size:', JSON.stringify(req.body).length, 'characters');
    
    const { fileName, vehicles, totalProcessed, isChunk, chunkIndex, totalChunks } = req.body;

    // console.log('Received data:', {
    //   fileName,
    //   vehiclesCount: vehicles?.length || 0,
    //   totalProcessed,
    //   isChunk,
    //   chunkIndex,
    //   totalChunks
    // });

    if (!vehicles || !Array.isArray(vehicles) || vehicles.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid vehicles data provided'
      });
    }

    // Add uploadedBy to each vehicle
    const vehiclesWithUser = vehicles.map(vehicle => ({
      ...vehicle,
      uploadedBy: req.user._id
    }));

    let batch;
    
    if (isChunk && chunkIndex === 0) {
      // Create a new batch for the first chunk
      batch = new Batch({
        fileName: fileName || 'Unknown File',
        companyName: vehiclesWithUser[0]?.companyName || 'Unknown',
        uploadDate: new Date(),
        // No Google Drive upload since we're not uploading files
      });
      await batch.save();
    } else if (isChunk) {
      // For subsequent chunks, find the existing batch by fileName and recent upload
      batch = await Batch.findOne({
        fileName: fileName,
        uploadDate: { $gte: new Date(Date.now() - 5 * 60 * 1000) } // Within last 5 minutes
      }).sort({ uploadDate: -1 });
      
      if (!batch) {
        return res.status(400).json({
          success: false,
          message: 'No active batch found for chunk upload'
        });
      }
    } else {
      // Create a new batch for non-chunked uploads
      batch = new Batch({
        fileName: fileName || 'Unknown File',
        companyName: vehiclesWithUser[0]?.companyName || 'Unknown',
        uploadDate: new Date(),
        // No Google Drive upload since we're not uploading files
      });
      await batch.save();
    }

    // Add batchId to each vehicle
    const vehiclesWithBatch = vehiclesWithUser.map(vehicle => ({
      ...vehicle,
      batchId: batch._id
    }));

    // Insert valid vehicles with batchId
    const insertedVehicles = await Vehicle.insertMany(vehiclesWithBatch);

    res.json({
      success: true,
      message: `Successfully uploaded ${insertedVehicles.length} vehicles`,
      uploaded: insertedVehicles.length,
      batchId: batch._id
    });

  } catch (error) {
    console.error('Upload vehicles data error:', error);
    
    // Check if it's a request entity too large error
    if (error.message && error.message.includes('entity too large')) {
      return res.status(413).json({
        success: false,
        message: 'Request payload too large. Please try with a smaller file or split the data into smaller chunks.'
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   POST /api/vehicles/upload
// @desc    Upload Excel file and bulk insert vehicle data (legacy route)
// @access  Private (Super Admin only)
router.post('/upload', [auth, requireSuperAdmin], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an Excel or CSV file'
      });
    }

    const filePath = req.file.path;
    let vehiclesData;
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.csv') {
      vehiclesData = parseCSVFile(filePath);
    } else {
      vehiclesData = parseExcelFile(filePath);
    }

    // Validate required fields
    const validVehicles = [];
    vehiclesData.forEach((vehicle, index) => {
      const requiredFields = ['vehicleNo', 'chassisNo', 'engineNo'];
      const missingFields = requiredFields.filter(field => !vehicle[field] || vehicle[field].toString().trim() === '');
      if (missingFields.length === 0) {
        validVehicles.push({
          ...vehicle,
          uploadedBy: req.user._id
        });
      }
      // Skip invalid vehicles silently
    });
    if (validVehicles.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid vehicles found in the Excel or CSV file'
      });
    }

    // Upload file to Google Drive
    let driveFile = null;
    try {
      driveFile = await uploadFileToDrive(filePath, req.file.originalname, req.file.mimetype);
    } catch (err) {
      console.error('Google Drive upload failed:', err);
    }

    // Create a new batch
    const batch = new Batch({
      fileName: req.file.originalname,
      companyName: validVehicles[0]?.companyName || 'Unknown',
      uploadDate: new Date(),
      driveFileId: driveFile?.id,
      driveFileLink: driveFile?.webViewLink,
    });
    await batch.save();

    // Add batchId to each vehicle
    const vehiclesWithBatch = validVehicles.map(vehicle => ({
      ...vehicle,
      batchId: batch._id
    }));

    // Insert valid vehicles with batchId
    const insertedVehicles = await Vehicle.insertMany(vehiclesWithBatch);

    // Optionally, remove the local file after upload
    try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }

    res.json({
      success: true,
      message: `Successfully uploaded ${insertedVehicles.length} vehicles`,
      uploaded: insertedVehicles.length,
      batchId: batch._id,
      driveFileLink: driveFile?.webViewLink
    });

  } catch (error) {
    console.error('Upload vehicles error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   GET /api/vehicles
// @desc    Get all vehicles with search and filter
// @access  Private (Super Admin only)
router.get('/', [auth, requireSuperAdmin], async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 15, 
      search, 
      vehicleNo, 
      chassisNo, 
      customerName, 
      companyName,
      branch,
      area,
      vehicleMaker
    } = req.query;
    
    const query = {};
    
    // Search across multiple fields
    if (search) {
      query.$or = [
        { vehicleNo: { $regex: search, $options: 'i' } },
        { chassisNo: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
        { branch: { $regex: search, $options: 'i' } }
      ];
    }

    // Individual field filters
    if (vehicleNo) query.vehicleNo = { $regex: vehicleNo, $options: 'i' };
    if (chassisNo) query.chassisNo = { $regex: chassisNo, $options: 'i' };
    if (customerName) query.customerName = { $regex: customerName, $options: 'i' };
    if (companyName) query.companyName = { $regex: companyName, $options: 'i' };
    if (branch) query.branch = { $regex: branch, $options: 'i' };
    if (area) query.area = { $regex: area, $options: 'i' };
    if (vehicleMaker) query.vehicleMaker = { $regex: vehicleMaker, $options: 'i' };

    const vehicles = await Vehicle.find(query)
      .populate('uploadedBy', 'fullName username')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Vehicle.countDocuments(query);

    res.json({
      success: true,
      vehicles,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });

  } catch (error) {
    console.error('Get vehicles error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get unique vehicle groups
router.get('/groups', async (req, res) => {
  try {
    const groups = await Vehicle.distinct('vehicleType');
    res.json({ groups });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch groups', error: err.message });
  }
});

// Get unique vehicle types
router.get('/vehicle-types', async (req, res) => {
  try {
    const vehicleTypes = await Vehicle.distinct('vehicleType');
    res.json({ vehicleTypes });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch vehicle types', error: err.message });
  }
});

// @route   GET /api/vehicles/stats/summary
// @desc    Get vehicle statistics
// @access  Private (Super Admin only)
router.get('/stats/summary', [auth, requireSuperAdmin], async (req, res) => {
  try {
    const totalVehicles = await Vehicle.countDocuments();
    const totalBranches = await Vehicle.distinct('branch').then(branches => branches.length);
    const totalCompanies = await Vehicle.distinct('companyName').then(companies => companies.length);
    const totalAreas = await Vehicle.distinct('area').then(areas => areas.length);

    res.json({
      success: true,
      stats: {
        totalVehicles,
        totalBranches,
        totalCompanies,
        totalAreas
      }
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// BATCH ROUTES MOVED UP
// @route   GET /api/vehicles/batches
// @desc    Get all batches with metadata
// @access  Private (Super Admin only)
router.get('/batches', [auth, requireSuperAdmin], async (req, res) => {
  try {
    const batches = await Batch.find().sort({ createdAt: -1 });
    res.json({ success: true, batches });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/vehicles/batches/:batchId/vehicles
// @desc    Get paginated vehicles for a batch
// @access  Private (Super Admin only)
router.get('/batches/:batchId/vehicles', [auth, requireSuperAdmin], async (req, res) => {
  try {
    const { page = 1, limit = 15, search, vehicleNo, customerName, branch, area, vehicleMaker } = req.query;
    const { batchId } = req.params;
    const query = { batchId };

    // Search across multiple fields
    if (search) {
      query.$or = [
        { vehicleNo: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { branch: { $regex: search, $options: 'i' } },
        { area: { $regex: search, $options: 'i' } },
        { vehicleMaker: { $regex: search, $options: 'i' } }
      ];
    }
    if (vehicleNo) query.vehicleNo = { $regex: vehicleNo, $options: 'i' };
    if (customerName) query.customerName = { $regex: customerName, $options: 'i' };
    if (branch) query.branch = { $regex: branch, $options: 'i' };
    if (area) query.area = { $regex: area, $options: 'i' };
    if (vehicleMaker) query.vehicleMaker = { $regex: vehicleMaker, $options: 'i' };

    const vehicles = await Vehicle.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    const total = await Vehicle.countDocuments(query);
    res.json({
      success: true,
      vehicles,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/vehicles/batches/:batchId/rename
// @desc    Rename a batch (update fileName)
// @access  Private (Super Admin only)
router.put('/batches/:batchId/rename', [auth, requireSuperAdmin], async (req, res) => {
  try {
    const { batchId } = req.params;
    const { fileName } = req.body;
    if (!fileName) return res.status(400).json({ success: false, message: 'fileName is required' });
    const batch = await Batch.findByIdAndUpdate(batchId, { fileName }, { new: true });
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });
    res.json({ success: true, batch });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/vehicles/batches/:batchId/company
// @desc    Update company name for a batch
// @access  Private (Super Admin only)
router.put('/batches/:batchId/company', [auth, requireSuperAdmin], async (req, res) => {
  try {
    const { batchId } = req.params;
    const { companyName } = req.body;
    if (!companyName) return res.status(400).json({ success: false, message: 'companyName is required' });
    const batch = await Batch.findByIdAndUpdate(batchId, { companyName }, { new: true });
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });
    res.json({ success: true, batch });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete a batch and all related vehicles
router.delete('/batches/:batchId', [auth, requireSuperAdmin], async (req, res) => {
  try {
    const { batchId } = req.params;
    // Delete all vehicles with this batchId
    await Vehicle.deleteMany({ batchId });
    // Delete the batch itself
    await Batch.findByIdAndDelete(batchId);
    res.json({ success: true, message: 'Batch and related vehicles deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to delete batch.' });
  }
});

// @route   GET /api/vehicles/:id
// @desc    Get vehicle by ID
// @access  Private (Super Admin only)
router.get('/:id', [auth, requireSuperAdmin], async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
      .populate('uploadedBy', 'fullName username');

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    res.json({
      success: true,
      vehicle
    });

  } catch (error) {
    console.error('Get vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/vehicles/:id
// @desc    Update vehicle
// @access  Private (Super Admin only)
router.put('/:id', [
  auth,
  requireSuperAdmin,
  body('vehicleNo').notEmpty().withMessage('Vehicle No is required'),
  body('chassisNo').notEmpty().withMessage('Chassis No is required'),
  body('engineNo').notEmpty().withMessage('Engine No is required'),
  body('branch').notEmpty().withMessage('Branch is required'),
  body('customerName').notEmpty().withMessage('Customer Name is required'),
  body('bkt').notEmpty().withMessage('BKT is required'),
  body('area').notEmpty().withMessage('Area is required'),
  body('vehicleMaker').notEmpty().withMessage('Vehicle Maker is required'),
  body('companyName').notEmpty().withMessage('Company Name is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Update all fields
    Object.keys(req.body).forEach(key => {
      if (vehicle.schema.paths[key]) {
        vehicle[key] = req.body[key];
      }
    });

    await vehicle.save();

    res.json({
      success: true,
      message: 'Vehicle updated successfully',
      vehicle
    });

  } catch (error) {
    console.error('Update vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/vehicles/:id
// @desc    Delete vehicle
// @access  Private (Super Admin only)
router.delete('/:id', [auth, requireSuperAdmin], async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    await Vehicle.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Vehicle deleted successfully'
    });

  } catch (error) {
    console.error('Delete vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router; 