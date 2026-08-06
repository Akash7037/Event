const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  registerNumber: { type: String, trim: true, uppercase: true },
  department: { type: String, trim: true },
  year: { type: String, enum: ['2nd Year', '3rd Year', ''] }
}, { _id: false });

const teamSchema = new mongoose.Schema({
  teamName: {
    type: String,
    required: [true, 'Team Name is required'],
    trim: true
  },
  leader: {
    name: { type: String, required: [true, 'Leader Name is required'], trim: true },
    registerNumber: {
      type: String,
      required: [true, 'Leader Register Number is required'],
      unique: true,
      trim: true,
      uppercase: true
    },
    department: { type: String, required: [true, 'Department is required'], trim: true },
    year: {
      type: String,
      required: [true, 'Year is required'],
      enum: {
        values: ['2nd Year', '3rd Year'],
        message: 'Only 2nd Year and 3rd Year students are eligible'
      }
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
    phone: {
      type: String,
      required: [true, 'Phone Number is required'],
      trim: true
    }
  },
  members: [memberSchema],
  problemStatement: {
    type: String,
    required: [true, 'Problem Statement is required'],
    trim: true
  },
  abstract: {
    type: String,
    required: [true, 'Abstract is required'],
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return false;
        const wordCount = v.trim().split(/\s+/).filter(Boolean).length;
        return wordCount <= 300;
      },
      message: 'Abstract cannot exceed 300 words'
    }
  },
  innovationDomain: {
    type: String,
    required: [true, 'Innovation Domain is required'],
    enum: {
      values: ['AI', 'Healthcare', 'Agriculture', 'Cybersecurity', 'Education', 'IoT', 'Robotics', 'FinTech', 'Others'],
      message: 'Invalid Innovation Domain selection'
    }
  },
  pptFile: {
    type: String,
    required: [true, 'PPT file upload is required']
  },
  eurekaScreenshot: {
    type: String,
    required: [true, 'Eureka registration screenshot is required']
  },
  status: {
    type: String,
    enum: ['Pending Verification', 'Approved', 'Rejected'],
    default: 'Pending Verification'
  },
  rejectionReason: {
    type: String,
    default: ''
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

// Helper virtual for member count
teamSchema.virtual('totalMembers').get(function() {
  return 1 + (this.members ? this.members.length : 0);
});

module.exports = mongoose.model('Team', teamSchema);
