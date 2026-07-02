import { useState } from 'react'
import { ChevronLeft, Plus, Send } from 'lucide-react'
import { Button, Card, EmptyState, Input } from '@/components/ui'
import { cn, initials } from '@/lib/utils'
import { messageThreads } from '@/lib/mockData'
import type { Message, MessageThread } from '@/lib/types'

export default function Messages() {
  const [threads, setThreads] = useState<MessageThread[]>(messageThreads)
  const [openId, setOpenId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  const open = threads.find((t) => t.id === openId) ?? null

  const send = () => {
    if (!open || !draft.trim()) return
    const msg: Message = {
      id: `m-${Date.now()}`,
      threadId: open.id,
      from: 'You',
      fromRole: 'student',
      body: draft.trim(),
      sentAt: new Date().toISOString(),
      read: true,
    }
    setThreads((prev) =>
      prev.map((t) => (t.id === open.id ? { ...t, messages: [...t.messages, msg] } : t)),
    )
    setDraft('')
  }

  if (open) {
    return (
      <div className="flex h-[calc(100vh-7rem)] flex-col animate-fade-up">
        <header className="flex items-center gap-3 border-b border-border pb-3 pt-2">
          <Button variant="ghost" size="icon" onClick={() => setOpenId(null)} aria-label="Back">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft font-bold text-accent">
            {initials(open.participant)}
          </div>
          <div>
            <p className="font-bold leading-tight">{open.participant}</p>
            <p className="text-xs text-muted-foreground">{open.subjectLine}</p>
          </div>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto py-4">
          {open.messages.map((m) => {
            const mine = m.fromRole === 'student'
            return (
              <div key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm',
                    mine
                      ? 'rounded-br-md bg-accent text-accent-foreground'
                      : 'rounded-bl-md bg-muted',
                  )}
                >
                  <p>{m.body}</p>
                  <p className={cn('mt-1 text-[10px]', mine ? 'text-white/70' : 'text-muted-foreground')}>
                    {new Date(m.sentAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex gap-2 border-t border-border pt-3">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Write a message…"
          />
          <Button size="icon" onClick={send} aria-label="Send">
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="pt-2 text-center text-[10px] text-muted-foreground">
          Messages are monitored by your school for safeguarding
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fade-up">
      <header className="flex items-center justify-between pt-2">
        <h1 className="text-2xl font-black tracking-tight">Messages</h1>
        <Button size="icon" variant="soft" aria-label="New message">
          <Plus className="h-5 w-5" />
        </Button>
      </header>

      {threads.length === 0 ? (
        <EmptyState emoji="💬" title="No messages" subtitle="Start a conversation with a teacher" />
      ) : (
        <div className="space-y-2">
          {threads.map((t) => {
            const last = t.messages[t.messages.length - 1]
            const unread = t.messages.some((m) => !m.read)
            return (
              <button key={t.id} className="w-full text-left" onClick={() => setOpenId(t.id)}>
                <Card className="flex items-center gap-3 p-4 transition-transform hover:scale-[1.01]">
                  <div className="relative">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft font-bold text-accent">
                      {initials(t.participant)}
                    </div>
                    {unread && (
                      <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-red-500 ring-2 ring-card" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className={cn('truncate', unread ? 'font-black' : 'font-bold')}>{t.participant}</p>
                      <p className="shrink-0 text-xs text-muted-foreground">
                        {new Date(last.sentAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <p className={cn('truncate text-sm', unread ? 'font-semibold' : 'text-muted-foreground')}>
                      {last.body}
                    </p>
                  </div>
                </Card>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
