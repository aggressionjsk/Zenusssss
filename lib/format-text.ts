/**
 * Utility functions for text formatting
 */

/**
 * Formats text with markdown-like syntax
 * Supports:
 * - **bold** for bold text
 * - *italic* for italic text
 * - - item for unordered lists
 * - 1. item for ordered lists
 */
export const formatText = (text: string): string => {
  if (!text) return '';
  
  // Process text line by line for lists
  const lines = text.split('\n');
  let inOrderedList = false;
  let inUnorderedList = false;
  
  const formattedLines = lines.map(line => {
    // Check for ordered list (starts with number followed by period and space)
    if (line.match(/^\d+\.\s+.+/)) {
      if (!inOrderedList) {
        inOrderedList = true;
        inUnorderedList = false;
      }
      return line.replace(/^(\d+\.\s+)(.+)/, '<li>$2</li>');
    } 
    // Check for unordered list (starts with dash or asterisk followed by space)
    else if (line.match(/^[-*]\s+.+/)) {
      if (!inUnorderedList) {
        inUnorderedList = true;
        inOrderedList = false;
      }
      return line.replace(/^[-*]\s+(.+)/, '<li>$1</li>');
    } 
    else {
      inOrderedList = false;
      inUnorderedList = false;
      
      // Process inline formatting
      let formattedLine = line;
      
      // Bold: **text** or __text__
      formattedLine = formattedLine.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      formattedLine = formattedLine.replace(/__([^_]+)__/g, '<strong>$1</strong>');
      
      // Italic: *text* or _text_
      formattedLine = formattedLine.replace(/\*([^*]+)\*/g, '<em>$1</em>');
      formattedLine = formattedLine.replace(/_([^_]+)_/g, '<em>$1</em>');
      
      return formattedLine;
    }
  });
  
  // Wrap list items in appropriate list tags
  let result = '';
  let currentList = '';
  let inList = false;
  let listType = '';
  
  formattedLines.forEach(line => {
    if (line.startsWith('<li>')) {
      if (!inList) {
        inList = true;
        listType = line.match(/^<li>\d+/) ? 'ol' : 'ul';
        currentList = `<${listType}>${line}`;
      } else {
        currentList += line;
      }
    } else {
      if (inList) {
        inList = false;
        result += `${currentList}</${listType}>${line}`;
        currentList = '';
      } else {
        result += line;
      }
      
      if (line !== '') {
        result += '<br/>';
      }
    }
  });
  
  // Add any remaining list
  if (inList) {
    result += `${currentList}</${listType}>`;
  }
  
  return result;
};

/**
 * Safely renders HTML content
 */
export const createMarkup = (content: string) => {
  return { __html: content };
};