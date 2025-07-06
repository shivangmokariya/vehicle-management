const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  employeeId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  mobileNo: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Hold'],
    default: 'Active'
  },
  iCard: {
    type: String,
    trim: true
  },
  profileImage: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: ['Super Admin', 'Admin', 'Sub Seizer'],
    required: true
  },
  group: {
    type: [String],
    default: [],
    required: function() {
      return this.role === 'Sub Seizer';
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return this.role !== 'Super Admin';
    }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to get public profile (without password)
userSchema.methods.toPublicJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema); 