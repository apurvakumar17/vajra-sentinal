import { useState } from 'react'
import { Bot, Send, User, Loader2 } from 'lucide-react'
import { api } from '../api/client'

export default function Copilot() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hello, I am your Sentinel AI Copilot. I can query our backend and help you analyze alerts, risks, and endpoints. What would you like to investigate today?' }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSend = async () => {
    if (!input.trim() || isLoading) return
    const prompt = input.trim()
    const userMessage = { role: 'user', text: prompt }
    
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    
    try {
      const { response } = await api.askCopilot(prompt)
      setMessages(prev => [...prev, { role: 'assistant', text: response }])
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Sorry, I encountered an error communicating with the backend.' }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="animate-in fade-in duration-500 h-[calc(100vh-8rem)] flex flex-col max-w-[1200px] mx-auto" data-testid="copilot-page">
      <div className="flex justify-between items-center mb-6 border-b border-border pb-4 shrink-0">
        <h1 className="text-3xl font-bold flex items-center gap-3 tracking-tight text-text-primary">
          <Bot className="text-primary" size={32} />
          AI Copilot
        </h1>
      </div>

      <div className="flex-1 bg-surface border border-border rounded-lg shadow-sm overflow-hidden flex flex-col relative" data-testid="chat-container">
        <div className="absolute inset-0 bg-gradient-to-b from-sidebar to-transparent pointer-events-none z-0 opacity-50"></div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6 z-10" data-testid="chat-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`} data-testid={`message-${i}`}>
              {msg.role === 'assistant' && (
                <div className="w-10 h-10 rounded-full bg-secondary/10 border border-secondary/20 text-secondary flex items-center justify-center shrink-0 shadow-sm">
                  <Bot size={20} />
                </div>
              )}
              
              <div className={`p-4 max-w-[80%] rounded-2xl shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-primary text-primary-text rounded-tr-sm' 
                  : 'bg-surface text-text-primary rounded-tl-sm border border-border leading-relaxed'
              }`}>
                {msg.text}
              </div>

              {msg.role === 'user' && (
                <div className="w-10 h-10 rounded-full bg-sidebar border border-border text-text-secondary flex items-center justify-center shrink-0 shadow-sm">
                  <User size={20} />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="p-4 bg-sidebar border-t border-border z-10 shrink-0">
          <div className="relative flex items-center w-full">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask Copilot (e.g. 'Why is Rahul flagged?')"
              className="w-full bg-surface border border-border text-text-primary rounded-lg px-4 py-4 pr-14 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors shadow-sm"
              data-testid="chat-input"
            />
            <button 
              onClick={handleSend}
              disabled={isLoading}
              className="absolute right-2 p-2 bg-primary hover:bg-primary-hover text-primary-text rounded-md transition-colors shadow-sm disabled:opacity-50"
              data-testid="chat-send-btn"
            >
              {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            </button>
          </div>
          <div className="text-center mt-3 text-xs text-text-disabled font-medium">
            Copilot can make mistakes. Consider verifying important information.
          </div>
        </div>
      </div>
    </div>
  )
}
