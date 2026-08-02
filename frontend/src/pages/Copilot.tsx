import { useState } from 'react'
import { Bot, Send, User, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github-dark.css' // Or whatever theme we want, let's just pick one
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
    } catch (error: any) {
      const errorMessage = error?.response?.data?.detail || error?.response?.data?.response || error.message || 'Sorry, I encountered an error communicating with the backend.'
      setMessages(prev => [...prev, { role: 'assistant', text: errorMessage }])
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
                  : 'bg-surface text-text-primary rounded-tl-sm border border-border leading-relaxed overflow-x-auto markdown-body'
              }`}>
                {msg.role === 'user' ? (
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                ) : (
                  <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:p-0">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]} 
                      rehypePlugins={[rehypeHighlight]}
                      components={{
                        a: ({ node, ...props }) => <a {...props} className="text-primary hover:underline font-medium" target="_blank" rel="noopener noreferrer" />,
                        p: ({ node, ...props }) => <p {...props} className="mb-4 last:mb-0" />,
                        ul: ({ node, ...props }) => <ul {...props} className="list-disc pl-6 mb-4 last:mb-0 space-y-1" />,
                        ol: ({ node, ...props }) => <ol {...props} className="list-decimal pl-6 mb-4 last:mb-0 space-y-1" />,
                        li: ({ node, ...props }) => <li {...props} className="text-text-primary" />,
                        h1: ({ node, ...props }) => <h1 {...props} className="text-2xl font-bold mb-4 mt-6 text-text-primary border-b border-border pb-2" />,
                        h2: ({ node, ...props }) => <h2 {...props} className="text-xl font-bold mb-3 mt-5 text-text-primary" />,
                        h3: ({ node, ...props }) => <h3 {...props} className="text-lg font-bold mb-2 mt-4 text-text-primary" />,
                        hr: ({ node, ...props }) => <hr {...props} className="my-6 border-border" />,
                        code: ({ node, inline, className, children, ...props }: any) => {
                          const match = /language-(\w+)/.exec(className || '');
                          return !inline ? (
                            <div className="rounded-md overflow-hidden my-4 border border-border">
                              <div className="bg-sidebar px-4 py-2 text-xs font-mono text-text-secondary flex justify-between items-center border-b border-border">
                                {match ? match[1] : 'code'}
                              </div>
                              <pre className="p-4 bg-background overflow-x-auto text-sm">
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              </pre>
                            </div>
                          ) : (
                            <code className="bg-background text-primary border border-border rounded px-1.5 py-0.5 text-sm font-mono" {...props}>
                              {children}
                            </code>
                          );
                        },
                        blockquote: ({ node, ...props }) => <blockquote {...props} className="border-l-4 border-primary pl-4 italic text-text-secondary my-4" />,
                        table: ({ node, ...props }) => (
                          <div className="overflow-x-auto my-4 border border-border rounded-lg">
                            <table {...props} className="w-full text-left border-collapse text-sm" />
                          </div>
                        ),
                        thead: ({ node, ...props }) => <thead {...props} className="bg-sidebar border-b border-border" />,
                        th: ({ node, ...props }) => <th {...props} className="p-3 font-semibold text-text-secondary uppercase tracking-wider text-xs" />,
                        td: ({ node, ...props }) => <td {...props} className="p-3 border-b border-border/50 text-text-primary" />,
                        tr: ({ node, ...props }) => <tr {...props} className="hover:bg-background/50 transition-colors" />
                      }}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-10 h-10 rounded-full bg-sidebar border border-border text-text-secondary flex items-center justify-center shrink-0 shadow-sm">
                  <User size={20} />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-4" data-testid="message-loading">
              <div className="w-10 h-10 rounded-full bg-secondary/10 border border-secondary/20 text-secondary flex items-center justify-center shrink-0 shadow-sm">
                <Bot size={20} />
              </div>
              <div className="p-4 max-w-[80%] rounded-2xl shadow-sm bg-surface text-text-primary rounded-tl-sm border border-border flex items-center justify-center gap-2">
                <span className="w-2 h-2 bg-text-secondary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-2 h-2 bg-text-secondary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-2 h-2 bg-text-secondary rounded-full animate-bounce"></span>
              </div>
            </div>
          )}
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
