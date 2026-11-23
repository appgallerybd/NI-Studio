import { memo, useMemo } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import CodeBlock from './CodeBlock';
import type { PreviewData } from '../lib/preview';

function hastText(node: any): string {
  if (!node) return '';
  if (node.type === 'text') return node.value ?? '';
  if (Array.isArray(node.children)) return node.children.map(hastText).join('');
  return '';
}

function parseMeta(meta: string): string {
  if (!meta) return '';
  const kv = meta.match(/(?:title|filename|file|path)\s*=\s*"?([^"\s]+)"?/i);
  if (kv) return kv[1];
  const first = meta.trim().split(/\s+/)[0] ?? '';
  return first && !first.includes('=') ? first : '';
}

const hlOptions: any = { detect: false, ignoreMissing: true };

function MarkdownBase({ text, onPreview }: { text: string; onPreview: (p: PreviewData) => void }) {
  const components = useMemo<Components>(
    () => ({
      pre: ({ node, children }) => {
        const code: any = (node as any)?.children?.[0];
        const classes: string[] = Array.isArray(code?.properties?.className) ? code.properties.className : [];
        const langClass = classes.find((c) => String(c).startsWith('language-'));
        const lang = langClass ? String(langClass).replace('language-', '') : '';
        const meta: string = code?.data?.meta ?? '';
        const raw = hastText(code).replace(/\n$/, '');
        return (
          <CodeBlock lang={lang} filename={parseMeta(meta)} text={raw} onPreview={onPreview}>
            {children}
          </CodeBlock>
        );
      },
      a: ({ href, children }) => (
        <a href={href} target="_blank" rel="noreferrer noopener">
          {children}
        </a>
      ),
      table: ({ children }) => (
        <div className="table-wrap">
          <table>{children}</table>
        </div>
      ),
    }),
    [onPreview],
  );

  return (
    <div className="md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeHighlight, hlOptions]]}
        components={components}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

export default memo(MarkdownBase);
