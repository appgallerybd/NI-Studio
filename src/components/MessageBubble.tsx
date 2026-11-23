import { useState } from 'react';
import Markdown from './Markdown';
import Icon from './Icon';
import type { PreviewData } from '../lib/preview';

interface Props {
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
  isLast?: boolean;
  onPreview: (p: PreviewData) => void;
  onRegenerate?: () => void;
}

export default function MessageBubble({ role, content, streaming, isLast, onPreview, onRegenerate }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  if (role === 'user') {
    const long = content.length > 700 || content.split('\n').length > 14;
    return (
      <div className="msg user">
        <div className={'user-bubble' + (long && !expanded ? ' clamped' : '')}>{content}</div>
        {long && (
          <button className="link-btn" onClick={() => setExpanded((v) => !v)}>
            {expanded ? 'সংক্ষেপ করুন' : 'পুরোটা দেখুন'}
          </button>
        )}
      </div>
    );
  }

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* এড়িয়ে যাবে */
    }
  }

  return (
    <div className="msg assistant">
      {content ? (
        <Markdown text={content} onPreview={onPreview} />
      ) : (
        <div className="typing"><span /><span /><span /></div>
      )}
      {!streaming && content && (
        <div className="msg-actions">
          <button className="icon-btn small" onClick={copyAll} title="পুরো উত্তর কপি">
            <Icon name={copied ? 'check' : 'copy'} size={15} />
          </button>
          {isLast && onRegenerate && (
            <button className="icon-btn small" onClick={onRegenerate} title="আবার তৈরি করো">
              <Icon name="refresh" size={15} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
