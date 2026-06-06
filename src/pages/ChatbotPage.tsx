import { useEffect, useRef, useState } from 'react'
import { Send, Bot, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { apiCall } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { PageTransition } from '@/components/PageTransition'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { BloodDrop } from '@/components/BloodDrop'
import { cn } from '@/lib/utils'
import type { ChatMessage } from '@/types'

interface HistoryItem {
  question: string
  answer: string
  created_at: string
}

const GREETING: ChatMessage = {
  role: 'assistant',
  content: 'Hello! I\'m BloodBridge AI — your guide to thalassemia care, donor eligibility, and transfusion coordination. How can I help you today?',
}

export function ChatbotPage() {
  const { token } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [model, setModel] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!token) return
    apiCall<HistoryItem[]>('/chatbot/history', 'GET', null, token)
      .then((history) => {
        if (history.length > 0) {
          const restored: ChatMessage[] = [GREETING]
          history.forEach((h) => {
            restored.push({ role: 'user', content: h.question, timestamp: h.created_at })
            restored.push({ role: 'assistant', content: h.answer, timestamp: h.created_at })
          })
          setMessages(restored)
        }
      })
      .catch(() => {})
  }, [token])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async () => {
    if (!input.trim() || !token || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)
    try {
      const res = await apiCall<{ reply: string; chat_model?: string }>(
        '/chatbot/chat', 'POST', { message: userMsg, language: 'en' }, token,
      )
      if (res.chat_model) setModel(res.chat_model)
      setMessages((prev) => [...prev, { role: 'assistant', content: res.reply }])
    } catch (e) {
      setMessages((prev) => [...prev, { role: 'assistant', content: e instanceof Error ? e.message : 'Service unavailable' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageTransition>
      <Card glow className="flex flex-col h-[calc(100vh-180px)] max-w-4xl mx-auto">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border-dim">
          <div className="flex items-center gap-3">
            <BloodDrop size={24} animate />
            <div>
              <p className="font-display text-lg">BloodBridge AI</p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-blood" />
                <span className="font-data text-[9px] uppercase text-emerald-400">Online</span>
                {model && <span className="font-data text-[9px] text-ice-dim">· {model}</span>}
              </div>
            </div>
          </div>
          <Sparkles size={16} className="text-gold opacity-60" />
        </div>

        <ScrollArea className="flex-1 px-5 py-4">
          <div className="space-y-4 max-w-3xl mx-auto">
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                <div className={cn(
                  'max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed',
                  m.role === 'user'
                    ? 'bg-blood-400/15 border border-blood-400/25 text-ice rounded-br-sm'
                    : 'bg-bg-surface border border-border-dim text-ice-muted rounded-bl-sm',
                )}>
                  {m.role === 'assistant' && <Bot size={12} className="inline mr-1.5 text-blood-300 opacity-60" />}
                  {m.content}
                </div>
              </motion.div>
            ))}
            {loading && (
              <div className="flex gap-1 px-4">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    animate={{ y: [0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}
                    className="w-2 h-2 rounded-full bg-blood-400/60"
                  />
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border-dim">
          <form
            onSubmit={(e) => { e.preventDefault(); send() }}
            className="flex gap-2 max-w-3xl mx-auto"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about thalassemia, donations, transfusions…"
              className="flex-1"
              disabled={loading}
            />
            <Button type="submit" disabled={loading || !input.trim()}>
              <Send size={16} />
            </Button>
          </form>
        </div>
      </Card>
    </PageTransition>
  )
}
