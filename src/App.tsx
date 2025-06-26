import React, { useState, useRef, useEffect } from 'react';
import { Send, Upload, Heart, MessageCircle, FileText, MapPin, Clock } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

interface UserProfile {
  location: string;
  insurance_summary?: any;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm Nurse Ally, your virtual nurse assistant. I'm here to help you with symptom assessment, finding nearby clinics, and understanding your healthcare options. How are you feeling today?",
      sender: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({ location: '' });
  const [showProfile, setShowProfile] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // For local testing, we'll simulate the API call
      // In production, this would call your Flask backend
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          profile: profile,
          user_id: 'demo_user'
        })
      });

      let assistantReply = '';
      
      if (response.ok) {
        const data = await response.json();
        assistantReply = data.reply;
      } else {
        // Fallback for local testing when backend isn't running
        assistantReply = generateMockResponse(inputMessage);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: assistantReply,
        sender: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      // Fallback for local testing
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: generateMockResponse(inputMessage),
        sender: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    if (input.includes('headache') || input.includes('fever')) {
      return "I understand you're experiencing a headache and fever. These symptoms could indicate various conditions. Let me assess the urgency:\n\n🔍 **Symptom Assessment**: Medium urgency\n\n📋 **Recommendation**: I recommend scheduling an appointment with your primary care physician within 24-48 hours. In the meantime, you can:\n\n• Rest and stay hydrated\n• Take over-the-counter pain relievers as directed\n• Monitor your temperature\n\nIf your fever rises above 103°F or you develop severe symptoms, please seek immediate medical attention. Would you like me to help you find nearby clinics?";
    }
    
    if (input.includes('chest pain')) {
      return "⚠️ **URGENT**: Chest pain can be a serious symptom that requires immediate medical attention.\n\n🚨 **Recommendation**: Please call 911 immediately or go to the nearest emergency room right away.\n\nDo not drive yourself - have someone drive you or call an ambulance. Chest pain could indicate a heart attack or other serious cardiac condition that needs immediate evaluation.\n\nIs someone available to help you get to the hospital right now?";
    }
    
    if (input.includes('clinic') || input.includes('doctor') || input.includes('appointment')) {
      return "I'd be happy to help you find nearby healthcare providers! Based on your location, here are some options:\n\n🏥 **Nearby Clinics**:\n\n**QuickCare Urgent Care**\n📍 789 Quick St\n📞 (555) 555-0123\n⏰ Wait time: 30-60 minutes\n🚶‍♀️ Walk-ins welcome\n\n**Family Health Center**\n📍 555 Health Dr\n📞 (555) 555-0200\n⏰ Same day appointments available\n📅 Appointment required\n\nWould you like me to provide more details about any of these options or help you with insurance coverage information?";
    }
    
    return "Thank you for sharing that with me. I'm here to help assess your symptoms and guide you to appropriate care. Could you tell me more about what you're experiencing? For example:\n\n• What symptoms are you having?\n• When did they start?\n• How severe are they on a scale of 1-10?\n• Have you tried any treatments?\n\nThe more details you can provide, the better I can assist you with finding the right level of care.";
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file');
      return;
    }

    setUploadedFile(file);
    
    // Simulate file upload processing
    const assistantMessage: Message = {
      id: Date.now().toString(),
      text: `📄 I've received your insurance document: "${file.name}"\n\n✅ **Processing Complete**\n\n**Insurance Summary**:\n• Plan: Health Plus Plan\n• Coverage: Emergency care, urgent care, primary care covered\n• Copay: $25 for primary care visits\n• Network: In-network providers recommended\n\nYour insurance information has been added to your profile. I can now provide more specific recommendations based on your coverage!`,
      sender: 'assistant',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, assistantMessage]);
    setProfile(prev => ({ 
      ...prev, 
      insurance_summary: { 
        plan_name: 'Health Plus Plan',
        copay: '$25',
        coverage: 'Comprehensive'
      }
    }));
  };

  const resetConversation = () => {
    setMessages([
      {
        id: '1',
        text: "Hello! I'm Nurse Ally, your virtual nurse assistant. I'm here to help you with symptom assessment, finding nearby clinics, and understanding your healthcare options. How are you feeling today?",
        sender: 'assistant',
        timestamp: new Date()
      }
    ]);
    setProfile({ location: '' });
    setUploadedFile(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-500 to-green-500 p-2 rounded-lg">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Nurse Ally</h1>
                <p className="text-sm text-gray-600">Virtual Nurse Assistant</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowProfile(!showProfile)}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <MapPin className="h-4 w-4" />
                <span className="text-sm">Profile</span>
              </button>
              <button
                onClick={resetConversation}
                className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors text-sm"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Profile Panel */}
          {showProfile && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Profile</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      value={profile.location}
                      onChange={(e) => setProfile(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Enter your city, state"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Insurance Document
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors"
                    >
                      <Upload className="h-4 w-4" />
                      <span className="text-sm">Upload PDF</span>
                    </button>
                    {uploadedFile && (
                      <p className="text-xs text-green-600 mt-1">
                        ✓ {uploadedFile.name}
                      </p>
                    )}
                  </div>

                  {profile.insurance_summary && (
                    <div className="bg-green-50 p-3 rounded-lg">
                      <h4 className="text-sm font-medium text-green-800">Insurance Active</h4>
                      <p className="text-xs text-green-600">{profile.insurance_summary.plan_name}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Chat Panel */}
          <div className={`${showProfile ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-[600px] flex flex-col">
              {/* Chat Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-100 p-2 rounded-full">
                    <MessageCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900">Chat with Nurse Ally</h2>
                    <p className="text-sm text-gray-600">Get personalized health guidance</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        message.sender === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {message.text}
                      </div>
                      <div className={`text-xs mt-2 ${
                        message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        <Clock className="inline h-3 w-3 mr-1" />
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-2xl px-4 py-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Describe your symptoms or ask a health question..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isLoading}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-xl transition-colors flex items-center space-x-2"
                  >
                    <Send className="h-4 w-4" />
                    <span>Send</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center text-sm text-gray-600">
            <p className="mb-2">
              <strong>Disclaimer:</strong> Nurse Ally is a virtual assistant for informational purposes only.
            </p>
            <p>
              This is not a substitute for professional medical advice. For emergencies, call 911 immediately.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;