const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const WebSocket = require('ws');
const http = require('http');
require('dotenv').config();

const User = require('./models/User');
const Vitals = require('./models/Vitals');
const Chat = require('./models/Chat');
const DietPlan = require('./models/DietPlan');
const PregnancyTracker = require('./models/PregnancyTracker');
const ConnectionRequest = require('./models/ConnectionRequest');

// Import route files
const pregnancyTrackerRoutes = require('./routes/pregnancyTracker');
const dietPlanRoutes = require('./routes/dietPlan');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Use environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
// Disabled MongoDB connection temporarily - using in-memory store
// const MONGODB_URI = 'mongodb+srv://healthcareapp:healthcarepassword@sandbox.j23em.mongodb.net/healthcare?retryWrites=true&w=majority';
const PORT = 5001; // Fixed port for development

app.use(cors());
app.use(express.json());

// Register routes
app.use('/', pregnancyTrackerRoutes);
app.use('/api/diet-plan', dietPlanRoutes);

// WebSocket connection handling
const clients = new Map();

wss.on('connection', (ws, req) => {
  const userId = new URL(req.url, 'http://localhost').searchParams.get('userId');
  if (userId) {
    clients.set(userId, ws);
  }

  ws.on('close', () => {
    if (userId) {
      clients.delete(userId);
    }
  });
});

// Function to send message to a specific user
const sendMessageToUser = (userId, message) => {
  const userWs = clients.get(userId);
  if (userWs && userWs.readyState === WebSocket.OPEN) {
    userWs.send(JSON.stringify(message));
  }
};

// In-memory data store (temporary solution)
const tempDb = {
  users: [
    // Test doctors removed
  ],
  vitals: [],
  chats: [],
  dietPlans: [],
  pregnancyTrackers: [],
  connectionRequests: []
};

// Skip MongoDB connection for now
// mongoose.set('strictQuery', false);
// 
// const connectDB = async () => {
//   try {
//     await mongoose.connect(MONGODB_URI, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//       serverSelectionTimeoutMS: 5000 // 5 second timeout
//     });
//     console.log('Connected to MongoDB locally');
//   } catch (error) {
//     console.error('MongoDB connection error:', error);
//     // Try to reconnect
//     setTimeout(connectDB, 5000);
//   }
// };
// 
// // Handle MongoDB connection errors
// mongoose.connection.on('error', (error) => {
//   console.error('MongoDB connection error:', error);
// });
// 
// mongoose.connection.on('disconnected', () => {
//   console.log('MongoDB disconnected. Attempting to reconnect...');
//   setTimeout(connectDB, 5000);
// });
// 
// // Initial connection
// connectDB();

console.log('Using in-memory database for testing');

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Access denied' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Auth routes
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, name, role, specialization } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Check if user already exists
    const existingUser = tempDb.users.find(user => user.email === email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create a new user with a generated ID
    const newUser = {
      _id: Date.now().toString(),
      email,
      password: hashedPassword,
      name,
      role,
      specialization,
      connectedUsers: [],
      healthRecords: []
    };
    
    tempDb.users.push(newUser);
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = tempDb.users.find(user => user.email === email);
    if (!user) return res.status(400).json({ message: 'User not found' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ message: 'Invalid password' });

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET);
    res.json({ token, user: { id: user._id, name: user.name, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Vitals routes
app.post('/api/vitals', authenticateToken, async (req, res) => {
  try {
    const newVitals = {
      _id: Date.now().toString(),
      ...req.body,
      recordedBy: req.user.id,
      date: new Date()
    };
    tempDb.vitals.push(newVitals);
    res.status(201).json(newVitals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/vitals/:patientId', authenticateToken, async (req, res) => {
  try {
    const patientVitals = tempDb.vitals
      .filter(vital => vital.patientId === req.params.patientId)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);
    res.json(patientVitals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Chat routes
app.post('/api/chat', authenticateToken, async (req, res) => {
  try {
    const newMessage = {
      _id: Date.now().toString(),
      ...req.body,
      senderId: req.user.id,
      timestamp: new Date()
    };
    tempDb.chats.push(newMessage);
    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/messages/:userId/:recipientId', authenticateToken, async (req, res) => {
  try {
    const { userId, recipientId } = req.params;
    
    // Verify that the requesting user is part of the conversation
    if (userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view these messages' });
    }
    
    // Verify that users are connected
    const user = tempDb.users.find(user => user._id === userId);
    if (!user || !user.connectedUsers.includes(recipientId)) {
      return res.status(403).json({ message: 'Not connected with this user' });
    }
    
    const messages = tempDb.chats
      .filter(msg => 
        (msg.senderId === userId && msg.receiverId === recipientId) || 
        (msg.senderId === recipientId && msg.receiverId === userId)
      )
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .slice(-50);
    
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/messages', authenticateToken, async (req, res) => {
  try {
    const { recipientId, content } = req.body;
    const senderId = req.user.id;
    
    // Verify that users are connected
    const sender = tempDb.users.find(user => user._id === senderId);
    if (!sender || !sender.connectedUsers.includes(recipientId)) {
      return res.status(403).json({ message: 'Not connected with this user' });
    }
    
    const message = {
      _id: Date.now().toString(),
      senderId,
      receiverId: recipientId,
      content,
      timestamp: new Date()
    };
    
    tempDb.chats.push(message);
    
    // Update active chat status for both users
    tempDb.users.forEach(user => {
      if (user._id === senderId || user._id === recipientId) {
        user.hasActiveChat = true;
      }
    });
    
    // Send message to recipient via WebSocket if they're online
    sendMessageToUser(recipientId, message);
    
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Use route files
// app.use('/api/pregnancy-tracker', pregnancyTrackerRoutes);
// app.use('/api/diet-plan', dietPlanRoutes);

// Doctor-Patient Connection routes
app.post('/api/connect', authenticateToken, async (req, res) => {
  try {
    const { doctorId, patientId } = req.body;
    
    // Find doctor and patient users
    const doctor = tempDb.users.find(user => user._id === doctorId);
    const patient = tempDb.users.find(user => user._id === patientId);
    
    if (!doctor || !patient) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Add to connected users if not already connected
    if (!doctor.connectedUsers.includes(patientId)) {
      doctor.connectedUsers.push(patientId);
    }
    
    if (!patient.connectedUsers.includes(doctorId)) {
      patient.connectedUsers.push(doctorId);
    }
    
    res.json({ message: 'Connection established' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get connected users
app.get('/api/connected-users/:userId', authenticateToken, async (req, res) => {
  try {
    const user = tempDb.users.find(user => user._id === req.params.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get the connected users
    const connectedUsers = tempDb.users
      .filter(u => user.connectedUsers.includes(u._id))
      .map(({ _id, name, role, specialization }) => ({ _id, name, role, specialization }));
    
    res.json(connectedUsers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// User Profile routes
app.get('/api/users/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Only allow users to access their own profile
    if (userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to access this profile' });
    }
    
    // Find the user
    const user = tempDb.users.find(user => user._id === userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Create a copy of the user without the password
    const userResponse = { ...user };
    delete userResponse.password;
    
    res.json(userResponse);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/users/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Only allow users to update their own profile
    if (userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this profile' });
    }
    
    const {
      name,
      email,
      phone,
      address,
      specialization,
      experience,
      education,
      languages,
      bio
    } = req.body;
    
    // Find the user to update
    const userIndex = tempDb.users.findIndex(user => user._id === userId);
    
    if (userIndex === -1) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = tempDb.users[userIndex];
    
    // Update the fields that were provided
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (bio !== undefined) user.bio = bio;
    
    // Only update doctor-specific fields if user is a doctor
    if (user.role === 'doctor') {
      if (specialization) user.specialization = specialization;
      if (experience !== undefined) user.experience = experience;
      if (education !== undefined) user.education = education;
      if (languages) user.languages = languages.split(',').map(lang => lang.trim());
    }
    
    // Create a copy of the user without the password
    const userResponse = { ...user };
    delete userResponse.password;
    
    res.json(userResponse);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Health Records routes
app.get('/api/health-records/:patientId?', authenticateToken, async (req, res) => {
  try {
    const patientId = req.params.patientId || req.user.id;
    const patient = tempDb.users.find(user => user._id === patientId);
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    // Check if the requesting user has permission to view these records
    if (req.user.role === 'doctor') {
      const hasPermission = patient.connectedUsers.includes(req.user.id);
      if (!hasPermission) {
        return res.status(403).json({ message: 'Not authorized to view these records' });
      }
    } else if (req.user.id !== patientId) {
      return res.status(403).json({ message: 'Not authorized to view these records' });
    }
    
    res.json(patient.healthRecords || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Allow doctors to add health records for patients
app.post('/api/health-records/:patientId', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors can add health records' });
    }
    
    const { condition, diagnosis, title, description, date } = req.body;
    const patientId = req.params.patientId;
    
    const patient = tempDb.users.find(user => user._id === patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    // Check if doctor is connected to patient
    if (!patient.connectedUsers.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized to add records for this patient' });
    }
    
    const newRecord = {
      _id: Date.now().toString(),
      title,
      condition,
      diagnosis,
      description,
      date: date || new Date(),
      doctor: req.user.id
    };
    
    if (!patient.healthRecords) {
      patient.healthRecords = [];
    }
    
    patient.healthRecords.push(newRecord);
    
    res.status(201).json(newRecord);
  } catch (error) {
    console.error('Error adding health record:', error);
    res.status(500).json({ message: error.message });
  }
});

// Allow patients to add their own health records
app.post('/api/patient-health-records', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Only patients can add their own health records' });
    }
    
    const { title, condition, description, date } = req.body;
    const patientId = req.user.id;
    
    const patient = tempDb.users.find(user => user._id === patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    const newRecord = {
      _id: Date.now().toString(),
      title,
      condition,
      description,
      date: date || new Date(),
      addedBy: 'patient'
    };
    
    if (!patient.healthRecords) {
      patient.healthRecords = [];
    }
    
    patient.healthRecords.push(newRecord);
    
    res.status(201).json(newRecord);
  } catch (error) {
    console.error('Error adding patient health record:', error);
    res.status(500).json({ message: error.message });
  }
});

// Doctor Search routes
app.get('/api/doctors', async (req, res) => {
  try {
    console.log('Doctors API request received');
    const { specialization, name } = req.query;
    
    // Filter doctors
    let doctors = tempDb.users.filter(user => user.role === 'doctor');
    console.log(`Found ${doctors.length} doctors in database`);
    
    if (specialization) {
      doctors = doctors.filter(doc => 
        doc.specialization && doc.specialization.toLowerCase().includes(specialization.toLowerCase())
      );
      console.log(`After specialization filter: ${doctors.length} doctors`);
    }
    
    if (name) {
      doctors = doctors.filter(doc => 
        doc.name && doc.name.toLowerCase().includes(name.toLowerCase())
      );
      console.log(`After name filter: ${doctors.length} doctors`);
    }
    
    // Sort by name
    doctors.sort((a, b) => a.name.localeCompare(b.name));
    
    // If authenticated, remove doctors that are already connected to the patient
    if (req.user && req.user.id) {
      const patient = tempDb.users.find(user => user._id === req.user.id);
      if (patient) {
        doctors = doctors.filter(doc => !patient.connectedUsers.includes(doc._id));
        console.log(`After connected filter: ${doctors.length} doctors`);
      }
    }
    
    // Return only necessary fields
    const doctorsList = doctors.map(doc => {
      const { _id, name, specialization, experience, education, languages } = doc;
      return { _id, name, specialization, experience, education, languages };
    });
    
    console.log(`Returning ${doctorsList.length} doctors`);
    res.json(doctorsList);
  } catch (error) {
    console.error('Error in doctors API:', error);
    res.status(500).json({ message: error.message });
  }
});

// Connection Request routes
app.post('/api/connection-requests', authenticateToken, async (req, res) => {
  try {
    const { doctorId, reason } = req.body;
    const patientId = req.user.id;
    
    // Check if users are already connected
    const patient = tempDb.users.find(user => user._id === patientId);
    if (patient && patient.connectedUsers.includes(doctorId)) {
      return res.status(400).json({ message: 'Already connected with this doctor' });
    }
    
    // Check if request already exists
    const existingRequest = tempDb.connectionRequests.find(
      req => req.doctor === doctorId && req.patient === patientId && ['pending', 'accepted'].includes(req.status)
    );
    
    if (existingRequest) {
      if (existingRequest.status === 'accepted') {
        return res.status(400).json({ message: 'Already connected with this doctor' });
      }
      return res.status(400).json({ message: 'Connection request already exists' });
    }
    
    const request = {
      _id: Date.now().toString(),
      doctor: doctorId,
      patient: patientId,
      reason,
      status: 'pending',
      createdAt: new Date()
    };
    
    tempDb.connectionRequests.push(request);
    res.status(201).json(request);
  } catch (error) {
    console.error('Connection request error:', error);
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/connection-requests/:doctorId', authenticateToken, async (req, res) => {
  try {
    // Find all pending requests for this doctor
    const requests = tempDb.connectionRequests
      .filter(req => req.doctor === req.params.doctorId && req.status === 'pending');
    
    // Add patient info to each request
    const requestsWithPatientInfo = requests.map(req => {
      const patient = tempDb.users.find(user => user._id === req.patient);
      return {
        ...req,
        patient: patient ? { name: patient.name, age: patient.age } : { name: 'Unknown' }
      };
    });
    
    res.json(requestsWithPatientInfo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/connection-requests/:requestId', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const requestIndex = tempDb.connectionRequests.findIndex(req => req._id === req.params.requestId);
    
    if (requestIndex === -1) {
      return res.status(404).json({ message: 'Connection request not found' });
    }
    
    const request = tempDb.connectionRequests[requestIndex];
    
    if (request.doctor !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this request' });
    }
    
    request.status = status;
    
    if (status === 'approved') {
      // Connect doctor and patient
      const doctor = tempDb.users.find(user => user._id === request.doctor);
      const patient = tempDb.users.find(user => user._id === request.patient);
      
      if (doctor && patient) {
        if (!doctor.connectedUsers.includes(request.patient)) {
          doctor.connectedUsers.push(request.patient);
        }
        
        if (!patient.connectedUsers.includes(request.doctor)) {
          patient.connectedUsers.push(request.doctor);
        }
      }
    }
    
    res.json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add a test route to verify server is working
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Add a test route that returns the doctors directly
app.get('/test-doctors', (req, res) => {
  const doctors = tempDb.users.filter(user => user.role === 'doctor');
  res.json(doctors);
});

// Add routes for doctor-specific API endpoints
app.get('/api/doctors/:doctorId/requests/pending', authenticateToken, async (req, res) => {
  try {
    const doctorId = req.params.doctorId;
    
    // Verify the requesting user is the doctor
    if (req.user.id !== doctorId) {
      return res.status(403).json({ message: 'Not authorized to view these requests' });
    }
    
    // Find all pending requests for this doctor
    const requests = tempDb.connectionRequests
      .filter(req => req.doctor === doctorId && req.status === 'pending');
    
    // Add patient info to each request
    const requestsWithPatientInfo = requests.map(req => {
      const patient = tempDb.users.find(user => user._id === req.patient);
      return {
        ...req,
        patient: patient ? { name: patient.name, age: patient.age || 'N/A' } : { name: 'Unknown' }
      };
    });
    
    // Log the requests for debugging
    console.log(`Found ${requests.length} pending requests for doctor ${doctorId}`);
    
    res.json(requestsWithPatientInfo);
  } catch (error) {
    console.error('Error fetching doctor requests:', error);
    res.status(500).json({ message: error.message });
  }
});

// Add an endpoint to get doctor's patients
app.get('/api/doctors/:doctorId/patients', authenticateToken, async (req, res) => {
  try {
    const doctorId = req.params.doctorId;
    
    // Verify the requesting user is the doctor
    if (req.user.id !== doctorId) {
      return res.status(403).json({ message: 'Not authorized to view these patients' });
    }
    
    // Find the doctor
    const doctor = tempDb.users.find(user => user._id === doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    // Get patients connected to this doctor
    const patients = tempDb.users
      .filter(user => user.role === 'patient' && doctor.connectedUsers.includes(user._id))
      .map(({ _id, name, age }) => ({ _id, name, age: age || 'N/A' }));
    
    res.json(patients);
  } catch (error) {
    console.error('Error fetching doctor patients:', error);
    res.status(500).json({ message: error.message });
  }
});

// Add endpoint to update connection requests
app.put('/api/doctors/requests/:requestId', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const { requestId } = req.params;
    
    console.log(`Updating request ${requestId} to status: ${status}`);
    
    // Find the request
    const requestIndex = tempDb.connectionRequests.findIndex(req => req._id === requestId);
    
    if (requestIndex === -1) {
      return res.status(404).json({ message: 'Connection request not found' });
    }
    
    const request = tempDb.connectionRequests[requestIndex];
    
    // Verify the doctor is authorized to update this request
    if (request.doctor !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this request' });
    }
    
    // Update the request status
    request.status = status;
    
    // If approved, connect the doctor and patient
    if (status === 'approved') {
      // Find doctor and patient
      const doctor = tempDb.users.find(user => user._id === request.doctor);
      const patient = tempDb.users.find(user => user._id === request.patient);
      
      if (doctor && patient) {
        // Add each to the other's connectedUsers array if not already there
        if (!doctor.connectedUsers.includes(request.patient)) {
          doctor.connectedUsers.push(request.patient);
        }
        
        if (!patient.connectedUsers.includes(request.doctor)) {
          patient.connectedUsers.push(request.doctor);
        }
      }
    }
    
    res.json(request);
  } catch (error) {
    console.error('Error updating connection request:', error);
    res.status(500).json({ message: error.message });
  }
});

// Add an endpoint for patients to fetch their connected doctors
app.get('/api/users/:userId/connected-doctors', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Verify the requesting user is authorized
    if (req.user.id !== userId) {
      return res.status(403).json({ message: 'Not authorized to view these doctors' });
    }
    
    // Find the patient
    const patient = tempDb.users.find(user => user._id === userId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    // Get doctors connected to this patient
    const doctors = tempDb.users
      .filter(user => user.role === 'doctor' && patient.connectedUsers.includes(user._id))
      .map(({ _id, name, specialization }) => ({ _id, name, specialization }));
    
    console.log(`Found ${doctors.length} doctors connected to patient ${userId}`);
    
    res.json(doctors);
  } catch (error) {
    console.error('Error fetching connected doctors:', error);
    res.status(500).json({ message: error.message });
  }
});

// Add Diet Plan routes
app.post('/api/diet-plan/generate', authenticateToken, async (req, res) => {
  try {
    const { userId, dietType, goals } = req.body;
    
    // Verify user exists
    const user = tempDb.users.find(user => user._id === userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check authorization
    if (req.user.id !== userId) {
      return res.status(403).json({ message: 'Not authorized to generate diet plan for this user' });
    }
    
    // Generate diet plan based on preferences
    const isVegetarian = dietType === 'veg';
    const hasCondition = (conditionId) => goals.includes(conditionId);
    
    // Basic diet plan structure
    const dietPlan = {
      _id: Date.now().toString(),
      userId,
      dietType,
      goals,
      meals: [
        {
          name: 'Breakfast',
          items: []
        },
        {
          name: 'Lunch',
          items: []
        },
        {
          name: 'Dinner',
          items: []
        },
        {
          name: 'Snacks',
          items: []
        }
      ],
      exercises: [],
      recommendations: []
    };
    
    // Add breakfast items based on diet type
    if (isVegetarian) {
      dietPlan.meals[0].items.push(
        { name: 'Oatmeal with berries', portion: '1 cup' },
        { name: 'Greek yogurt', portion: '1/2 cup' },
        { name: 'Flaxseeds', portion: '1 tablespoon' }
      );
    } else {
      dietPlan.meals[0].items.push(
        { name: 'Eggs', portion: '2 whole' },
        { name: 'Whole grain toast', portion: '1 slice' },
        { name: 'Avocado', portion: '1/2 medium' }
      );
    }
    
    // Add lunch items
    if (isVegetarian) {
      dietPlan.meals[1].items.push(
        { name: 'Quinoa bowl', portion: '1 cup' },
        { name: 'Mixed vegetables', portion: '2 cups' },
        { name: 'Chickpeas', portion: '1/2 cup' }
      );
    } else {
      dietPlan.meals[1].items.push(
        { name: 'Grilled chicken breast', portion: '4 oz' },
        { name: 'Brown rice', portion: '1/2 cup' },
        { name: 'Steamed broccoli', portion: '1 cup' }
      );
    }
    
    // Add dinner items
    if (isVegetarian) {
      dietPlan.meals[2].items.push(
        { name: 'Lentil soup', portion: '1 cup' },
        { name: 'Whole grain bread', portion: '1 slice' },
        { name: 'Mixed green salad', portion: '2 cups' }
      );
    } else {
      dietPlan.meals[2].items.push(
        { name: 'Baked salmon', portion: '4 oz' },
        { name: 'Roasted sweet potato', portion: '1 medium' },
        { name: 'Asparagus', portion: '1 cup' }
      );
    }
    
    // Add snack items
    dietPlan.meals[3].items.push(
      { name: 'Almonds', portion: '1/4 cup' },
      { name: 'Apple', portion: '1 medium' },
      { name: 'Carrot sticks', portion: '1 cup' }
    );
    
    // Add condition-specific items
    if (hasCondition('diabetes')) {
      // Replace high glycemic foods
      dietPlan.meals[0].items = [
        { name: 'Steel-cut oats', portion: '1/2 cup' },
        { name: 'Cinnamon', portion: '1 teaspoon' },
        { name: 'Chia seeds', portion: '1 tablespoon' }
      ];
      
      dietPlan.recommendations.push(
        'Monitor blood glucose levels regularly',
        'Eat smaller meals throughout the day to maintain steady glucose levels',
        'Prioritize low glycemic index foods',
        'Limit refined carbohydrates and added sugars'
      );
    }
    
    if (hasCondition('hypertension')) {
      dietPlan.recommendations.push(
        'Limit sodium intake to less than 2,300mg per day',
        'Increase potassium-rich foods like bananas and leafy greens',
        'Consider the DASH diet approach',
        'Limit alcohol consumption'
      );
    }
    
    if (hasCondition('heart_disease')) {
      dietPlan.recommendations.push(
        'Focus on heart-healthy omega-3 fatty acids',
        'Reduce saturated and trans fats',
        'Increase fiber intake to help lower cholesterol',
        'Consider adding soluble fiber from oats and barley'
      );
    }
    
    if (hasCondition('weight_management')) {
      dietPlan.recommendations.push(
        'Create a moderate calorie deficit of 500 calories per day',
        'Prioritize protein to maintain muscle mass',
        'Drink water before meals to increase fullness',
        'Track food intake with a journal or app'
      );
      
      // Add more intensive exercise routine
      dietPlan.exercises.push(
        { name: 'High-intensity interval training', duration: '20 minutes', frequency: '3 times per week' },
        { name: 'Strength training', duration: '30 minutes', frequency: '2-3 times per week' }
      );
    }
    
    // Add default exercise recommendations
    if (dietPlan.exercises.length === 0) {
      dietPlan.exercises.push(
        { name: 'Walking', duration: '30 minutes', frequency: 'Daily' },
        { name: 'Light stretching', duration: '15 minutes', frequency: 'Daily' }
      );
    }
    
    // Add general recommendations
    if (hasCondition('daily_fitness')) {
      dietPlan.recommendations.push(
        'Stay hydrated by drinking at least 8 glasses of water daily',
        'Aim for 7-9 hours of quality sleep each night',
        'Practice mindful eating - focus on your food and eat slowly',
        'Include a variety of colorful fruits and vegetables for different nutrients'
      );
    }
    
    // Save the diet plan to our in-memory DB
    tempDb.dietPlans = tempDb.dietPlans.filter(plan => plan.userId !== userId);
    tempDb.dietPlans.push(dietPlan);
    
    res.json(dietPlan);
  } catch (error) {
    console.error('Error generating diet plan:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get user's diet plan
app.get('/api/diet-plan/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check authorization
    if (req.user.id !== userId) {
      return res.status(403).json({ message: 'Not authorized to access this diet plan' });
    }
    
    // Find user's diet plan
    const dietPlan = tempDb.dietPlans.find(plan => plan.userId === userId);
    
    if (!dietPlan) {
      return res.status(404).json({ message: 'Diet plan not found' });
    }
    
    res.json(dietPlan);
  } catch (error) {
    console.error('Error fetching diet plan:', error);
    res.status(500).json({ message: error.message });
  }
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));