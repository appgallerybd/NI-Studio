import { ReactNode, useState } from 'react';
import Icon from './Icon';
import { canPreview, type PreviewData } from '../lib/preview';

const EXT: Record<string, string> = {
  javascript: 'js', js: 'js', typescript: 'ts', ts: 'ts', tsx: 'tsx', jsx: 'jsx',
  html: 'html', htm: 'html', css: 'css', json: 'json', python: 'py', py: 'py',
  bash: 'sh', sh: 'sh', shell: 'sh', sql: 'sql', java: 'java', kotlin: 'kt',
  dart: 'dart', yaml: 'yml', yml: 'yml', markdown: 'md', md: 'md', xml: 'xml', svg: 'svg',
  go: 'go', rust: 'rs', php: 'php', c: 'c', cpp: 'cpp',
};

interface Props {
  lang: string;
  filename: string;
  text: string;
  children: ReactNode;
  onPreview: (p: PreviewData) => void;
}

async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
}

export default function CodeBlock({ lang, filename, text, children, onPreview }: Props) {
  const [copied, setCopied] = useState(false);
  const kind = canPreview(lang);
  const label = filename || lang || 'কোড';

  async function copy() {
    await copyText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function download() {
    const ext = EXT[lang.toLowerCase()] ?? 'txt';
    const name = filename ? filename.split('/').pop() || filename : `code.${ext}`;
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="codeblock">
      <div className="code-head">
        <span className="code-label" title={label}>{label}</span>
        <div className="code-actions">
          {kind && (
            <button
              className="chip-btn accent"
              onClick={() => onPreview({ kind, code: text, title: filename || lang.toUpperCase() })}
            >
              <Icon name="play" size={14} /> Run
            </button>
          )}
          <button className="chip-btn" onClick={download}>
            <Icon name="download" size={14} /> ডাউনলোড
          </button>
          <button className="chip-btn" onClick={copy}>
            <Icon name={copied ? 'check' : 'copy'} size={14} /> {copied ? 'কপি হয়েছে' : 'Copy'}
          </button>
        </div>
      </div>
      <pre>{children}</pre>
    </div>
  );
}
