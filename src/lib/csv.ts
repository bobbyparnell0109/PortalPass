// Minimal CSV parsing for admin imports: handles quoted fields, embedded
// commas/newlines, CRLF, and a header row. Returns rows as objects keyed
// by lowercased, trimmed header names.

export function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const records: string[][] = []
  let field = ''
  let record: string[] = []
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += c
      }
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      record.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      record.push(field)
      field = ''
      if (record.some((f) => f.trim() !== '')) records.push(record)
      record = []
    } else {
      field += c
    }
  }
  record.push(field)
  if (record.some((f) => f.trim() !== '')) records.push(record)

  if (records.length === 0) return { headers: [], rows: [] }
  const headers = records[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, '_'))
  const rows = records.slice(1).map((rec) => {
    const obj: Record<string, string> = {}
    headers.forEach((h, i) => {
      obj[h] = (rec[i] ?? '').trim()
    })
    return obj
  })
  return { headers, rows }
}
