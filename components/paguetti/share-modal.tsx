'use client'

import { useState } from 'react'
import { Copy, Check, MessageCircle, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface ShareModalProps {
  open: boolean
  onClose: () => void
  text: string
}

export function ShareModal({ open, onClose, text }: ShareModalProps) {
  const [copied, setCopied] = useState(false)

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        // Fallback for environments without clipboard API
        const el = document.createElement('textarea')
        el.value = text
        el.style.position = 'fixed'
        el.style.left = '-9999px'
        document.body.appendChild(el)
        el.select()
        document.execCommand('copy')
        document.body.removeChild(el)
      }
      setCopied(true)
      toast('Resumen copiado.')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast('No se pudo copiar. Intentá de nuevo.')
    }
  }

  const handleWhatsApp = () => {
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm w-[calc(100vw-2rem)] rounded-2xl bg-popover border-border p-0 overflow-hidden">
        <DialogHeader className="flex flex-row items-center justify-between px-4 pt-4 pb-0">
          <DialogTitle className="text-[15px] font-semibold text-foreground">
            Compartir resumen
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Cerrar"
            className="size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted -mr-1"
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        </DialogHeader>

        <div className="mx-4 my-3 rounded-xl border border-border/70 bg-card overflow-hidden">
          <div className="px-2.5 py-1.5 border-b border-border/60 bg-muted/30">
            <span className="text-[11px] text-muted-foreground font-medium">Vista previa</span>
          </div>
          <pre className="text-[11px] text-foreground/90 leading-relaxed px-2.5 py-2.5 overflow-x-auto whitespace-pre-wrap font-sans max-h-44 overflow-y-auto">
            {text}
          </pre>
        </div>

        <div className="flex flex-col gap-2 px-4 pb-4">
          <Button
            onClick={handleWhatsApp}
            className="h-11 w-full text-[15px] font-semibold bg-[#25D366] hover:bg-[#1ebe5b] text-white transition-colors"
          >
            <MessageCircle data-icon="inline-start" />
            Compartir por WhatsApp
          </Button>

          <Button
            variant="outline"
            onClick={handleCopy}
            className="h-11 w-full text-[15px] font-medium border-border text-foreground hover:bg-muted transition-colors"
          >
            {copied ? (
              <>
                <Check data-icon="inline-start" className="text-lime" />
                Copiado
              </>
            ) : (
              <>
                <Copy data-icon="inline-start" />
                Copiar texto
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
