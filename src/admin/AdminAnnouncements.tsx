import { useState, type FormEvent } from 'react'
import { Megaphone, Pin, Send } from 'lucide-react'
import { Badge, Button, Card, Input } from '@/components/ui'
import { announcements as seed } from '@/lib/mockData'
import type { Announcement } from '@/lib/types'

export default function AdminAnnouncements() {
  const [list, setList] = useState<Announcement[]>(seed)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState<Announcement['category']>('events')
  const [audience, setAudience] = useState('Whole school')
  const [pinned, setPinned] = useState(false)

  const publish = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !body.trim()) return
    const a: Announcement = {
      id: `a-${Date.now()}`,
      title: title.trim(),
      body: body.trim(),
      category,
      audience,
      pinned,
      createdAt: new Date().toISOString(),
      read: false,
    }
    setList([a, ...list])
    setTitle('')
    setBody('')
    setPinned(false)
  }

  return (
    <div className="grid gap-6 xl:grid-cols-5 animate-fade-up">
      <div className="xl:col-span-2">
        <h1 className="mb-4 text-2xl font-black tracking-tight">Announcements</h1>
        <Card className="p-5">
          <h2 className="mb-3 flex items-center gap-2 font-bold">
            <Megaphone className="h-4 w-4 text-accent" /> New announcement
          </h2>
          <form onSubmit={publish} className="space-y-3">
            <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <textarea
              placeholder="Write your announcement…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-border bg-card p-4 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
            <div className="flex gap-3">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Announcement['category'])}
                className="h-11 flex-1 rounded-xl border border-border bg-card px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <option value="events">Events</option>
                <option value="academic">Academic</option>
                <option value="important">Important</option>
                <option value="social">Social</option>
              </select>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="h-11 flex-1 rounded-xl border border-border bg-card px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <option>Whole school</option>
                <option>Year 7</option>
                <option>Year 8</option>
                <option>Year 9</option>
                <option>Year 10</option>
                <option>Year 11</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
                className="h-4 w-4 accent-[hsl(var(--accent))]"
              />
              <Pin className="h-3.5 w-3.5" /> Pin to top of student feed
            </label>
            <Button type="submit" className="w-full">
              <Send className="h-4 w-4" /> Publish now
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Students and parents in the audience get a push notification
            </p>
          </form>
        </Card>
      </div>

      <div className="xl:col-span-3">
        <h2 className="mb-4 text-lg font-bold">Live ({list.length})</h2>
        <div className="space-y-3">
          {list.map((a) => (
            <Card key={a.id} className="p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={
                    a.category === 'important' ? 'red' : a.category === 'events' ? 'green' : a.category === 'academic' ? 'blue' : 'amber'
                  }
                >
                  {a.category}
                </Badge>
                <Badge variant="neutral">{a.audience}</Badge>
                {a.pinned && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-accent">
                    <Pin className="h-3 w-3" /> Pinned
                  </span>
                )}
                <span className="ml-auto text-xs text-muted-foreground">
                  {new Date(a.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </span>
              </div>
              <p className="mt-2 font-bold">{a.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{a.body}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
