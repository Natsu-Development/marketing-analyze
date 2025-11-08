import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Save, Loader2 } from 'lucide-react'

interface FormActionsProps {
  onSave: () => void
  saving: boolean
}

export function FormActions({ onSave, saving }: FormActionsProps) {
  return (
    <div className="flex justify-end gap-3">
      <Link to="/account">
        <Button variant="outline">Cancel</Button>
      </Link>
      <Button
        onClick={onSave}
        disabled={saving}
        className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
      >
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="h-4 w-4" />
            Save Settings
          </>
        )}
      </Button>
    </div>
  )
}
