import { useState } from 'react'
import { Pin } from 'lucide-react'
import { Badge, Card, SegmentedControl } from '@/components/ui'
import { announcements } from '@/lib/mockData'
import type { Announcement } from '@/lib/types'

type Filter = 'all' | Announcement['category']

const CATEGORY_BADGE: Record<Announcement['category'], 'blue' | 'red' | 'green' | 'amber'> = {
  academic: 'blue',
  important: 'red',
  events: 'green',
  social: 'amber',
}

export default function Announcements() {
  const [filter, setFilter] = useState<Filter>('all')

  const list = announcements
    .filter((a) => filter === 'all' || a.category === filter)
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt.localeCompare(a.createdAt))

  return (
    <div className="space-y-4 animate-fade-up">
      <header className="pt-2">
        <h1 className="text-2xl font-black tracking-tight">News</h1>
        <p className="text-sm text-muted-foreground">Announcements &amp; events</p>
      </header>

      <SegmentedControl
        options={[
          { label: 'All', value: 'all' },
          { label: 'Important', value: 'important' },
          { label: 'Events', value: 'events' },
          { label: 'Academic', value: 'academic' },
        ]}
        value={filter}
        onChange={setFilter}
      />

      <div className="space-y-3">
        {list.map((a) => (
          <Card key={a.id} className={`p-4 ${a.read ? '' : 'ring-2 ring-accent/30'}`}>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={CATEGORY_BADGE[a.category]}>{a.category}</Badge>
              <Badge variant="neutral">{a.audience}</Badge>
              {a.pinned && (
                <span className="ml-auto flex items-center gap-1 text-xs font-semibold text-accent">
                  <Pin className="h-3.5 w-3.5" /> Pinned
                </span>
              )}
            </div>
            <p className="mt-2 font-bold">{a.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{a.body}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              {new Date(a.createdAt).toLocaleDateString('en-GB', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </p>
          </Card>
        ))}
      </div>
    </div>
  )
}
