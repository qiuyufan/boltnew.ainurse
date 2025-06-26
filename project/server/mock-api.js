import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, '../dist')));

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 16 * 1024 * 1024 } // 16MB limit
});

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Mock data and functions (same as before)
const mockTriageSymptoms = (symptoms) => {
  const urgencyKeywords = {
    emergency: ['chest pain', 'difficulty breathing', 'severe bleeding', 'unconscious', 'stroke', 'heart attack'],
    high: ['severe pain', 'high fever', 'vomiting blood', 'severe headache', 'difficulty swallowing'],
    medium: ['fever', 'persistent cough', 'moderate pain', 'rash', 'nausea'],
    low: ['mild headache', 'minor cut', 'cold symptoms', 'fatigue']
  };

  const lowerSymptoms = symptoms.toLowerCase();
  
  for (const [level, keywords] of Object.entries(urgencyKeywords)) {
    if (keywords.some(keyword => lowerSymptoms.includes(keyword))) {
      return {
        urgency_level: level,
        reasoning: `Based on the symptoms described, this appears to be ${level} urgency.`,
        recommendations: level === 'emergency' 
          ? ['Call 911 immediately', 'Go to nearest emergency room']
          : level === 'high'
          ? ['Seek immediate medical attention', 'Visit urgent care or emergency room']
          : level === 'medium'
          ? ['Schedule appointment with primary care', 'Consider urgent care if symptoms worsen']
          : ['Monitor symptoms', 'Rest and self-care', 'Contact doctor if symptoms persist']
      };
    }
  }

  return {
    urgency_level: 'low',
    reasoning: 'Symptoms appear to be minor and manageable.',
    recommendations: ['Monitor symptoms', 'Rest and self-care', 'Contact doctor if symptoms persist']
  };
};

const mockFindClinic = (location, urgency) => {
  const clinics = {
    emergency: [
      {
        name: 'City General Hospital Emergency Room',
        address: '123 Main St, ' + location,
        phone: '(555) 911-1234',
        type: 'Emergency Room',
        wait_time: '15-30 minutes',
        accepts_insurance: true
      }
    ],
    high: [
      {
        name: 'QuickCare Urgent Care',
        address: '456 Oak Ave, ' + location,
        phone: '(555) 555-0123',
        type: 'Urgent Care',
        wait_time: '30-45 minutes',
        accepts_insurance: true
      }
    ],
    medium: [
      {
        name: 'Family Health Center',
        address: '789 Pine St, ' + location,
        phone: '(555) 555-0456',
        type: 'Primary Care',
        wait_time: 'Same day appointments available',
        accepts_insurance: true
      }
    ],
    low: [
      {
        name: 'Community Health Clinic',
        address: '321 Elm St, ' + location,
        phone: '(555) 555-0789',
        type: 'Primary Care',
        wait_time: 'Next day appointments',
        accepts_insurance: true
      }
    ]
  };

  return {
    clinics: clinics[urgency] || clinics.low,
    location: location,
    urgency_level: urgency
  };
};

const mockInsuranceCheck = (filename) => {
  return {
    plan_name: 'Health Plus Premium Plan',
    provider: 'Blue Cross Blue Shield',
    member_id: 'ABC123456789',
    group_number: 'GRP001',
    coverage_details: {
      primary_care: '$25 copay',
      specialist: '$50 copay',
      urgent_care: '$75 copay',
      emergency_room: '$300 copay',
      prescription_drugs: '$10/$30/$60 copay'
    },
    key_benefits: [
      'Preventive care covered 100%',
      'Annual deductible: $1,500',
      'Out-of-pocket maximum: $6,000',
      'Network coverage nationwide'
    ],
    filename: filename
  };
};

// Store for conversation threads
const conversationStore = {};

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', service: 'Nurse Ally Backend' });
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message, profile = {}, user_id = 'default' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Initialize conversation history for user
    if (!conversationStore[user_id]) {
      conversationStore[user_id] = [];
    }

    // Add user message to history
    conversationStore[user_id].push({ role: 'user', content: message });

    // Simple response logic based on message content
    let reply = '';
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      reply = "Hello! I'm Nurse Ally, your virtual nursing assistant. I'm here to help you understand your symptoms and guide you to appropriate care. What symptoms are you experiencing today?";
    } else if (lowerMessage.includes('pain') || lowerMessage.includes('hurt') || lowerMessage.includes('ache')) {
      const triage = mockTriageSymptoms(message);
      const location = profile.location || 'your area';
      const clinics = mockFindClinic(location, triage.urgency_level);
      
      reply = `I understand you're experiencing pain. Based on your symptoms, I've assessed this as ${triage.urgency_level} urgency. ${triage.reasoning}

My recommendations:
${triage.recommendations.map(rec => `• ${rec}`).join('\n')}

Here are some nearby healthcare options in ${location}:
${clinics.clinics.map(clinic => `• ${clinic.name} - ${clinic.address} - ${clinic.phone} (${clinic.wait_time})`).join('\n')}

${triage.urgency_level === 'emergency' ? '⚠️ If this is a medical emergency, please call 911 immediately.' : 'Please remember that I\'m a virtual assistant and cannot replace professional medical evaluation.'}`;
    } else if (lowerMessage.includes('fever') || lowerMessage.includes('temperature')) {
      const triage = mockTriageSymptoms(message);
      reply = `I see you're experiencing a fever. This is concerning and I want to help you get the right care. Based on your symptoms, I've assessed this as ${triage.urgency_level} urgency.

${triage.reasoning}

My recommendations:
${triage.recommendations.map(rec => `• ${rec}`).join('\n')}

In the meantime, make sure to stay hydrated and rest. If your fever is very high (over 103°F) or you're experiencing difficulty breathing, please seek immediate medical attention.`;
    } else if (lowerMessage.includes('insurance') || lowerMessage.includes('coverage')) {
      reply = "I can help you understand your insurance coverage! If you have your insurance card or policy document, you can upload it and I'll help you understand your benefits. You can also tell me your insurance provider and I'll give you general guidance about finding in-network providers.";
    } else if (lowerMessage.includes('clinic') || lowerMessage.includes('doctor') || lowerMessage.includes('appointment')) {
      const location = profile.location || 'your area';
      const clinics = mockFindClinic(location, 'medium');
      
      reply = `I can help you find healthcare providers in ${location}. Here are some options:

${clinics.clinics.map(clinic => `• ${clinic.name}\n  ${clinic.address}\n  ${clinic.phone}\n  ${clinic.wait_time}`).join('\n\n')}

Would you like me to help you understand what type of care might be best for your specific symptoms?`;
    } else {
      reply = `Thank you for sharing that with me. I'm here to help assess your symptoms and guide you to appropriate care. 

Could you tell me more about:
• What specific symptoms you're experiencing?
• How long you've had these symptoms?
• How severe they are on a scale of 1-10?

This information will help me better understand your situation and provide appropriate guidance. Remember, if you're experiencing a medical emergency, please call 911 immediately.`;
    }

    // Add assistant reply to history
    conversationStore[user_id].push({ role: 'assistant', content: reply });

    res.json({
      reply: reply,
      status: 'success',
      thread_id: `thread_${user_id}_${Date.now()}`
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Only PDF files are allowed' });
    }

    const insurance_summary = mockInsuranceCheck(req.file.originalname);

    res.json({
      status: 'success',
      filename: req.file.originalname,
      insurance_summary: insurance_summary,
      message: 'Insurance document processed successfully'
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
});

app.post('/api/reset-conversation', (req, res) => {
  try {
    const { user_id = 'default' } = req.body;
    
    if (conversationStore[user_id]) {
      delete conversationStore[user_id];
    }

    res.json({
      status: 'success',
      message: 'Conversation reset successfully'
    });

  } catch (error) {
    console.error('Reset error:', error);
    res.status(500).json({ error: 'Reset failed' });
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Error handlers
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large. Maximum size is 16MB.' });
    }
  }
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Nurse Ally running on port ${PORT}`);
});