const User = require('../models/User');

const seedSuperAdmin = async () => {
  try {
    // Check if Super Admin already exists
    const existingSuperAdmin = await User.findOne({ role: 'Super Admin' });
    
    if (existingSuperAdmin) {
      console.log('Super Admin already exists');
      return;
    }

    // Create default Super Admin
    const superAdmin = new User({
      fullName: 'Super Administrator',
      username: 'superadmin',
      password: 'admin123', // This will be hashed by the pre-save hook
      employeeId: 'SA001',
      mobileNo: '9876543210',
      status: 'Active',
      role: 'Super Admin'
    });

    await superAdmin.save();
    console.log('Super Admin created successfully');
    console.log('Default credentials:');
    console.log('Username: superadmin');
    console.log('Password: admin123');
    console.log('Please change these credentials after first login!');

  } catch (error) {
    console.error('Error seeding Super Admin:', error);
  }
};

module.exports = {
  seedSuperAdmin
}; 