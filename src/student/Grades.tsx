import { useState } from 'react'
import { Minus, TrendingDown, TrendingUp } from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Badge, Card, Progress } from '@/components/ui'
import { fetchGrades, useQuery } from '@/lib/api'
import { grades as mockGrades, progressOverTime, SUBJECT_COLORS } from '@/lib/mockData'

export default function Grades() {
  const [expanded, setExpanded] = useState<string | null>(null)
  const { data: grades } = useQuery(fetchGrades, mockGrades)
  const avg = Math.round(grades.reduce((s, g) => s + g.score, 0) / Math.max(1, grades.length))

  return (
    <div className="space-y-4 animate-fade-up">
      <header className="pt-2">
        <h1 className="text-2xl font-black tracking-tight">Grades</h1>
        <p className="text-sm text-muted-foreground">Summer 2026 · Year 10</p>
      </header>

      <Card className="border-0 bg-gradient-to-br from-accent to-fuchsia-500 p-5 text-white shadow-lg shadow-accent/25">
        <p className="text-sm text-white/80">Average across subjects</p>
        <p className="text-4xl font-black">{avg}%</p>
        <p className="mt-1 flex items-center gap-1 text-sm text-white/85">
          <TrendingUp className="h-4 w-4" /> Up 4% since last term
        </p>
      </Card>

      <Card className="p-4">
        <h2 className="mb-2 font-bold">Progress over time</h2>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={progressOverTime} margin={{ top: 5, right: 5, bottom: 0, left: -25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="term" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis domain={[50, 90]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
              <Line type="monotone" dataKey="Maths" stroke={`hsl(${SUBJECT_COLORS.Maths})`} strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="English" stroke={`hsl(${SUBJECT_COLORS.English})`} strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="Science" stroke={`hsl(${SUBJECT_COLORS.Science})`} strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="space-y-3">
        {grades.map((g) => {
          const color = SUBJECT_COLORS[g.subject] ?? '240 5% 50%'
          return (
            <button
              key={g.id}
              className="w-full text-left"
              onClick={() => setExpanded(expanded === g.id ? null : g.id)}
            >
              <Card className="p-4 transition-transform hover:scale-[1.01]">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-black text-white"
                    style={{ background: `hsl(${color})` }}
                  >
                    {g.grade}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-bold">{g.subject}</p>
                      {g.trend === 'up' && (
                        <Badge variant="green">
                          <TrendingUp className="h-3 w-3" /> Improving
                        </Badge>
                      )}
                      {g.trend === 'down' && (
                        <Badge variant="red">
                          <TrendingDown className="h-3 w-3" /> Dipping
                        </Badge>
                      )}
                      {g.trend === 'stable' && (
                        <Badge variant="neutral">
                          <Minus className="h-3 w-3" /> Steady
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{g.assessment}</p>
                    <Progress
                      value={g.score}
                      className="mt-2"
                      barClassName="transition-none"
                    />
                  </div>
                </div>
                {expanded === g.id && (
                  <div className="mt-3 animate-fade-up rounded-xl bg-muted/60 p-3 text-sm">
                    <p className="font-semibold">Teacher feedback</p>
                    <p className="mt-1 text-muted-foreground">{g.feedback}</p>
                  </div>
                )}
              </Card>
            </button>
          )
        })}
      </div>
    </div>
  )
}
