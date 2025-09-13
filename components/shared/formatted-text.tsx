'use client'

import React from 'react'
import { formatText, createMarkup } from '@/lib/format-text'

interface FormattedTextProps {
  content: string
  className?: string
}

const FormattedText: React.FC<FormattedTextProps> = ({ content, className }) => {
  if (!content) return null
  
  const formattedContent = formatText(content)
  
  return (
    <div 
      className={className} 
      dangerouslySetInnerHTML={createMarkup(formattedContent)} 
    />
  )
}

export default FormattedText