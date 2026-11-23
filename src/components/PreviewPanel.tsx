import { useMemo, useState } from 'react';
import Icon from './Icon';
import { buildSrcDoc, type PreviewData } from '../lib/preview';

export default function PreviewPanel({ data, onClose }: { data: PreviewData; onClose: () => void }) {
  const [nonce, setNonce] = useState(0);
  const srcDoc = useMemo(() => buildSrcDoc(data), [data]);

  return (
    <aside className="preview">
      <div className="preview-head">
        <span className="preview-title">{data.title} — প্রিভিউ</span>
        <button className="icon-btn" onClick={() => setNonce((n) => n + 1)} title="আবার চালান">
          <Icon name="refresh" />
        </button>
        <button className="icon-btn" onClick={onClose} title="বন্ধ করুন">
          <Icon name="x" />
        </button>
      </div>
      <iframe
        key={nonce}
        title="preview"
        sandbox="allow-scripts allow-modals allow-forms allow-popups allow-pointer-lock"
        srcDoc={srcDoc}
      />
      <div className="preview-note">
        নিরাপদ স্যান্ডবক্সে চলছে। এখানে localStorage ও আপনার লগইন তথ্য পাওয়া যায় না।
      </div>
    </aside>
  );
}
