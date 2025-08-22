import React from 'react';

interface FormattedInterventionContentProps {
  content: string;
}

export default function FormattedInterventionContent({ content }: FormattedInterventionContentProps) {
  const formatContent = (text: string) => {
    // Split content into lines for processing
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      if (!trimmedLine) {
        elements.push(<br key={`br-${index}`} />);
        return;
      }
      
      // Handle headers (### text)
      if (trimmedLine.startsWith('### ')) {
        const headerText = trimmedLine.replace(/^### /, '').replace(/\*\*/g, '');
        elements.push(
          <h3 key={`h3-${index}`} className="text-lg font-bold text-gray-900 mt-4 mb-2 border-b border-gray-200 pb-1">
            {headerText}
          </h3>
        );
        return;
      }
      
      // Handle subheaders (** text **)
      if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
        const subHeaderText = trimmedLine.replace(/^\*\*/, '').replace(/\*\*$/, '');
        elements.push(
          <h4 key={`h4-${index}`} className="text-base font-semibold text-gray-800 mt-3 mb-2">
            {subHeaderText}
          </h4>
        );
        return;
      }
      
      // Handle bullet points starting with *
      if (trimmedLine.startsWith('* ')) {
        const bulletText = trimmedLine.replace(/^\* /, '');
        const formattedBullet = formatInlineMarkdown(bulletText);
        elements.push(
          <div key={`bullet-${index}`} className="ml-4 mb-2">
            <span className="text-blue-600 mr-2">•</span>
            <span className="text-gray-700">{formattedBullet}</span>
          </div>
        );
        return;
      }
      
      // Handle regular paragraphs
      const formattedLine = formatInlineMarkdown(trimmedLine);
      elements.push(
        <p key={`p-${index}`} className="text-gray-700 mb-2 leading-relaxed">
          {formattedLine}
        </p>
      );
    });
    
    return elements;
  };
  
  const formatInlineMarkdown = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let currentText = text;
    let partIndex = 0;
    
    // Handle bold text (**text**)
    while (currentText.includes('**')) {
      const firstBold = currentText.indexOf('**');
      const secondBold = currentText.indexOf('**', firstBold + 2);
      
      if (firstBold !== -1 && secondBold !== -1) {
        // Add text before bold
        if (firstBold > 0) {
          parts.push(currentText.substring(0, firstBold));
        }
        
        // Add bold text
        const boldText = currentText.substring(firstBold + 2, secondBold);
        parts.push(
          <strong key={`bold-${partIndex++}`} className="font-semibold text-gray-900">
            {boldText}
          </strong>
        );
        
        // Continue with remaining text
        currentText = currentText.substring(secondBold + 2);
      } else {
        break;
      }
    }
    
    // Add remaining text
    if (currentText) {
      parts.push(currentText);
    }
    
    return parts.length > 0 ? parts : [text];
  };
  
  return (
    <div className="formatted-intervention-content">
      {formatContent(content)}
    </div>
  );
}