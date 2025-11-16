import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'

interface NotesSectionProps {
  note: string | undefined
  onUpdateNote: (value: string) => void
}

export function NotesSection({ note, onUpdateNote }: NotesSectionProps) {
  return (
    <Card className="bg-card p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Notes</h2>
          <p className="text-sm text-muted-foreground">Add any additional notes or instructions</p>
        </div>

        <div className="space-y-2">
          <Textarea
            id="note"
            value={note ?? ''}
            onChange={(e) => onUpdateNote(e.target.value)}
            className="bg-input min-h-[120px] resize-none"
            placeholder="Add notes for this ad account configuration..."
          />
        </div>
      </div>
    </Card>
  )
}
