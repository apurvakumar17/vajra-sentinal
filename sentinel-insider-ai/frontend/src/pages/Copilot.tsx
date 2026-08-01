import { useState } from 'react'
import { Bot, Send, User } from 'lucide-react'

export default function Copilot() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hello, I am your Sentinel AI Copilot. I can query our MongoDB and help you analyze alerts, risks, and endpoints. What would you like to investigate today?' }
  ])
  const [input, setInput] = useState('')

  const handleSend = () => {
    if (!input.trim()) return
    const userMessage = { role: 'user', text: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    
    // Simulate API call for MVP
    setTimeout(() => {
      let botResponse = "I have analyzed the database logs. Everything appears nominal."
      if (input.toLowerCase().includes('rahul')) {
        botResponse = "Rahul Sharma was flagged for a High Risk score of 85 due to mass file exfiltration (T1052.001) using an unauthorized USB drive (KINGSTON_64GB). I recommend isolating his workstation."
      } else if (input.toLowerCase().includes('highest risk')) {
        botResponse = "The employee with the highest risk score right now is Rahul Sharma (85), followed by Priya Singh (42)."
      }
      setMessages(prev => [...prev, { role: 'assistant', text: botResponse }])
    }, 1500)
  }

  return (
    <div className="animate-in fade-in duration-500 h-[calc(100vh-6rem)] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Bot className="text-primary" size={32} />
          AI Copilot
        </h1>
      </div>

      <div className="flex-1 bg-dark border border-slate-800 rounded-xl overflow-hidden flex flex-col relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none z-0"></div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6 z-10">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
                  <Bot size={18} />
                </div>
              )}
              
              <div className={`p-4 max-w-[80%] rounded-2xl ${
                msg.role === 'user' 
                  ? 'bg-primary text-white rounded-tr-sm' 
                  : 'bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700'
              }`}>
                {msg.text}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center shrink-0">
                  <User size={18} />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="p-4 bg-slate-900 border-t border-slate-800 z-10">
          <div className="relative flex items-center max-w-4xl mx-auto">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask Copilot (e.g. 'Why is Rahul flagged?')"
              className="w-full bg-dark border border-slate-700 text-white rounded-xl px-4 py-4 pr-12 focus:outline-none focus:border-primary transition-colors"
            />
            <button 
              onClick={handleSend}
              className="absolute right-2 p-2 bg-primary hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              <Send size={20} />
            </button>
          </div>
          <div className="text-center mt-3 text-xs text-slate-500">
            Copilot can make mistakes. Consider verifying important information.
          </div>
        </div>
      </div>
    </div>
  )
}
