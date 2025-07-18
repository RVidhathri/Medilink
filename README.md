# Medilink
# 🏥 MEDILINK – Smart Healthcare Management System

A role-based full-stack healthcare management platform developed using the MERN stack. MEDILINK enables doctors and patients to manage health records, monitor vitals, engage in real-time chat, and access personalized medical features through secure and scalable web technologies.

## 🌟 Key Features

- 🔐 **Secure Login** with JWT Authentication & Role-Based Access (Doctor/Patient)
- 📊 **Vitals Monitoring** and record updates for each patient
- 📁 **Health Record Management** – Add, edit, and track medical data
- 💬 **Real-Time Chat** between doctors and patients using Socket.io
- 🧠 **Diet & Pregnancy Tracking** modules
- 📱 **Responsive Dashboards** for doctors and patients using Tailwind CSS
- 🛡️ **Data Security** with encrypted sessions and secure API handling

## 🛠️ Tech Stack

- **Frontend:** React.js, Tailwind CSS  
- **Backend:** Node.js, Express.js  
- **Database:** MongoDB  
- **Real-Time Communication:** Socket.io  
- **Authentication:** JSON Web Tokens (JWT)  
- **Version Control:** Git & GitHub  

## 📦 Installation Guide

1. **Clone the Repository**  
   ```bash
   git clone https://github.com/your-username/medilink.git
   cd medilink
2.Install Backend Dependencies
cd backend
npm install

3.Install Frontend Dependencies

cd ../frontend
npm install

4.Configure Environment Variables

*Create .env files in both frontend and backend folders.

*Set MongoDB URI, JWT secrets, and server/client URLs as needed.

5.Run the App
In two terminals, run:

# Terminal 1 (backend)
cd backend
npm start

# Terminal 2 (frontend)
cd frontend
npm start
Open your browser and navigate to http://localhost:3000

🔮 Future Enhancements
*Wearable device integration for real-time health monitoring

*ML-based predictions for diagnosis & health analytics

*Video consultation and telemedicine support

*Admin panel for appointment & user management
