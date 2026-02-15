import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { Card, Button } from './Shared';
import { ChatMessage } from '../types';
import { sendMessageToGemini, generateMarketBrief } from '../services/geminiService';

export const AIAssistant: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'model',
      text: 'Hello! I am LogiNexus AI, your supply chain assistant. How can I help you today? I can track trends, explain terms, or optimize routes.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [marketBrief, setMarketBrief] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initial load of market brief
    const fetchBrief = async () => {
        const brief = await generateMarketBrief();
        setMarketBrief(brief);
    };
    fetchBrief();
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, text: m.text }));
      const responseText = await sendMessageToGemini(userMsg.text, history);
      
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
       console.error(error);
       // Error handled inside service, but safe fallback
       setMessages(prev => [...prev, {
         id: Date.now().toString(),
         role: 'model',
         text: "I encountered an error. Please try again.",
         timestamp: new Date(),
         isError: true
       }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-2rem)] flex gap-6">
      {/* Main Chat Interface */}
      <Card className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2 rounded-lg text-white">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Smart Logistics Assistant</h3>
              <p className="text-xs text-slate-500">Powered by Gemini AI</p>
            </div>
          </div>
          <Button variant="outline" className="text-xs py-1 h-8" onClick={() => setMessages([])}>Clear Chat</Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-slate-700 text-white' : 'bg-blue-600 text-white'}`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-slate-800 text-white rounded-tr-none' 
                  : 'bg-white text-slate-800 shadow-sm border border-slate-100 rounded-tl-none'
              }`}>
                {/* Basic Markdown-like rendering for bullet points */}
                {msg.text.split('\n').map((line, i) => (
                   <p key={i} className={`min-h-[1.2em] ${line.trim().startsWith('-') || line.trim().startsWith('*') ? 'pl-2' : ''}`}>
                     {line}
                   </p>
                ))}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
               <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">
                 <Bot size={16} />
               </div>
               <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-slate-100">
                 <Loader2 className="animate-spin text-blue-600" size={20} />
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-slate-200 bg-white">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about rates, HS codes, or market trends..."
              className="flex-1 p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
            />
            <Button onClick={handleSend} disabled={isLoading} className="w-12 h-12 rounded-lg !p-0 flex items-center justify-center">
              <Send size={20} />
            </Button>
          </div>
        </div>
      </Card>

      {/* Side Panel: Quick Insights */}
      <div className="w-80 hidden lg:flex flex-col gap-6">
         <Card className="p-5 bg-gradient-to-br from-indigo-900 to-slate-900 text-white border-none">
             <div className="flex items-center gap-2 mb-4 text-indigo-200">
                <Sparkles size={18} />
                <span className="font-bold text-sm uppercase tracking-wider">Live Market Brief</span>
             </div>
             <div className="space-y-4 text-sm text-indigo-100 leading-relaxed">
                {marketBrief ? (
                     marketBrief.split('\n').filter(l => l.trim()).map((l, i) => <p key={i}>{l}</p>)
                ) : (
                    <div className="flex items-center gap-2">
                        <Loader2 className="animate-spin" size={16} />
                        Generating analysis...
                    </div>
                )}
             </div>
             <Button variant="outline" className="w-full mt-6 border-indigo-500 text-indigo-100 hover:bg-indigo-800 hover:text-white" onClick={async () => {
                 setMarketBrief(null);
                 const brief = await generateMarketBrief();
                 setMarketBrief(brief);
             }}>
                 <RefreshCw size={14} className="mr-2" /> Refresh
             </Button>
         </Card>

         <Card className="p-5 flex-1 overflow-y-auto">
             <h4 className="font-bold text-slate-900 mb-4">Suggested Prompts</h4>
             <div className="space-y-2">
                {[
                    "What are the current trends for Asia-Europe rates?",
                    "Explain Incoterms 2020: FOB vs CIF",
                    "List potential risks for Red Sea transit",
                    "How do I calculate chargeable weight for air freight?"
                ].map((prompt, idx) => (
                    <button 
                        key={idx} 
                        onClick={() => setInput(prompt)}
                        className="w-full text-left p-3 text-sm bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg transition-colors border border-slate-100"
                    >
                        {prompt}
                    </button>
                ))}
             </div>
         </Card>
      </div>
    </div>
  );
};
