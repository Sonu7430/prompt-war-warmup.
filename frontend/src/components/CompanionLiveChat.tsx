import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, AlertCircle } from 'lucide-react';
import { streamChatResponse } from '../api';
import { VoiceSpeakerButton, VoiceInputMicButton } from './VoiceController';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
}

interface CompanionLiveChatProps {
  speechRate: number;
}

export const CompanionLiveChat: React.FC<CompanionLiveChatProps> = ({ speechRate }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Hello! I am your 24/7 caring companion. You can speak to me with your voice or type below. How can I brighten or help your day today?",
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const scrollEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const handleSend = async (textToSend?: string) => {
    const prompt = textToSend || inputText;
    if (!prompt.trim() || isStreaming) return;

    setErrorMsg(null);
    setInputText('');

    // Add user message
    const userMsg: Message = { id: `u-${Date.now()}`, sender: 'user', text: prompt };
    setMessages((prev) => [...prev, userMsg]);

    // Add empty assistant message to stream into
    const assistantId = `a-${Date.now()}`;
    setMessages((prev) => [...prev, { id: assistantId, sender: 'assistant', text: '' }]);
    setIsStreaming(true);

    await streamChatResponse(
      prompt,
      (token: string) => {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === assistantId ? { ...msg, text: msg.text + token } : msg))
        );
      },
      () => {
        setIsStreaming(false);
      },
      (errText: string) => {
        setIsStreaming(false);
        setErrorMsg(errText);
      }
    );
  };

  return (
    <section className="bg-[var(--bg-card)] border-3 border-[var(--border-color)] rounded-3xl p-6 md:p-8 shadow-sm space-y-6" aria-label="Streaming Companion Assistant">
      <div className="flex items-center gap-3 pb-4 border-b-2 border-[var(--border-color)]">
        <div className="p-3 bg-blue-100 text-blue-900 rounded-2xl" aria-hidden="true">
          <Bot className="w-8 h-8 text-blue-700" />
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-[var(--text-primary)] m-0">
            Everyday Companion Chat
          </h2>
          <p className="text-base font-medium text-[var(--text-muted)] m-0">
            Real-time streaming • Gentle voice assistance • Always patient and safe
          </p>
        </div>
      </div>

      {/* Suggested Starters */}
      <div>
        <span className="text-sm font-bold text-[var(--text-secondary)] block mb-2" id="starter-label">
          Tap a quick question:
        </span>
        <div className="flex flex-wrap gap-2" role="group" aria-labelledby="starter-label">
          {[
            "Good morning! How should I start my routine today?",
            "I'm feeling a little tired after breakfast.",
            "I got an urgent call from someone claiming to be IRS.",
          ].map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(prompt)}
              disabled={isStreaming}
              className="px-4 py-2 bg-[var(--bg-secondary)] hover:bg-[var(--border-color)] border-2 border-[var(--border-color)] rounded-xl text-base font-bold text-[var(--text-primary)] min-h-[44px] transition text-left"
            >
              💬 {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Scroll Container */}
      <div
        className="max-h-[420px] overflow-y-auto space-y-4 p-4 rounded-2xl bg-[var(--bg-secondary)] border-2 border-[var(--border-color)]"
        role="log"
        aria-live="polite"
        aria-label="Conversation history"
      >
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${
              m.sender === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div
              className={`max-w-[85%] p-5 rounded-3xl space-y-2 ${
                m.sender === 'user'
                  ? 'bg-blue-700 text-white font-bold'
                  : 'bg-[var(--bg-card)] text-[var(--text-primary)] border-2 border-[var(--border-color)] shadow-xs'
              }`}
            >
              <div className="flex items-center gap-2 text-sm opacity-80 mb-1">
                {m.sender === 'user' ? (
                  <>
                    <User className="w-4 h-4" />
                    <span>You</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>Companion</span>
                  </>
                )}
              </div>

              <p className="text-lg md:text-xl font-medium leading-relaxed m-0 whitespace-pre-wrap">
                {m.text || (isStreaming ? 'Thinking calmly...' : '')}
              </p>

              {m.sender === 'assistant' && m.text && (
                <div className="pt-2">
                  <VoiceSpeakerButton
                    textToRead={m.text}
                    speechRate={speechRate}
                    label="Listen"
                  />
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={scrollEndRef} />
      </div>

      {errorMsg && (
        <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-xl text-amber-950 font-bold flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-amber-700" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Input controls */}
      <div className="space-y-3">
        <label htmlFor="companion-chat-input" className="sr-only">
          Ask your companion a question
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <input
            id="companion-chat-input"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type your question or thought here..."
            className="flex-1 p-4 rounded-2xl border-2 border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] font-bold text-lg min-h-[52px]"
          />

          <VoiceInputMicButton
            onTranscript={(spokenText) => {
              setInputText(spokenText);
              handleSend(spokenText);
            }}
            isListening={isListening}
            setIsListening={setIsListening}
          />

          <button
            type="button"
            onClick={() => handleSend()}
            disabled={isStreaming || !inputText.trim()}
            className="flex items-center gap-2 px-6 py-3.5 bg-blue-700 hover:bg-blue-800 disabled:bg-gray-400 text-white rounded-2xl font-black text-lg min-h-[52px] shadow-md transition"
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
            <span>Send</span>
          </button>
        </div>
      </div>
    </section>
  );
};
