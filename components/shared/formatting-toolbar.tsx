'use client'

import React from 'react'
import { Bold, Italic, List } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FormattingToolbarProps {
  onFormat: (formatType: 'bold' | 'italic' | 'unordered-list' | 'ordered-list') => void
  className?: string
}

const FormattingToolbar: React.FC<FormattingToolbarProps> = ({ onFormat, className }) => {
  return (
    <div className={cn('flex items-center gap-2 py-2', className)}>
      <button
        type="button"
        onClick={() => onFormat('bold')}
        className="p-1 rounded hover:bg-neutral-800 transition"
        title="Bold"
        aria-label="Format text as bold"
      >
        <Bold size={16} className="text-neutral-400" />
      </button>
      <button
        type="button"
        onClick={() => onFormat('italic')}
        className="p-1 rounded hover:bg-neutral-800 transition"
        title="Italic"
        aria-label="Format text as italic"
      >
        <Italic size={16} className="text-neutral-400" />
      </button>
      <button
        type="button"
        onClick={() => onFormat('unordered-list')}
        className="p-1 rounded hover:bg-neutral-800 transition"
        title="Bullet List"
        aria-label="Insert bullet list"
      >
        <List size={16} className="text-neutral-400" />
      </button>
      <button
        type="button"
        onClick={() => onFormat('ordered-list')}
        className="p-1 rounded hover:bg-neutral-800 transition"
        title="Numbered List"
        aria-label="Insert numbered list"
      >
        <span className="text-neutral-400 text-xs font-bold px-1">1.</span>
      </button>
    </div>
  )
}

export default FormattingToolbar