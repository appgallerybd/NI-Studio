export type PreviewKind = 'html' | 'svg' | 'js';

export interface PreviewData {
  kind: PreviewKind;
  code: string;
  title: string;
}

export function canPreview(lang: string): PreviewKind | null {
  const l = lang.toLowerCase();
  if (l === 'html' || l === 'htm') return 'html';
  if (l === 'svg') return 'svg';
  if (l === 'js' || l === 'javascript') return 'js';
  return null;
}

export function buildSrcDoc(p: PreviewData): string {
  if (p.kind === 'html') {
    if (/^\s*<!doctype/i.test(p.code)) return p.code;
    return `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1">${p.code}`;
  }

  if (p.kind === 'svg') {
    return `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0;display:grid;place-items:center;min-height:100vh;background:#fff">${p.code}</body>`;
  }

  const safe = p.code.replace(/<\/script/gi, '<\\/script');
  return `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1">
<body style="margin:0;padding:12px;font:14px/1.5 ui-monospace,Menlo,Consolas,monospace;color:#222">
<div id="o"></div>
<script>
(function(){
  var o=document.getElementById('o');
  function fmt(a){return Array.prototype.map.call(a,function(x){
    try{return typeof x==='object'?JSON.stringify(x,null,2):String(x)}catch(e){return String(x)}}).join(' ')}
  function w(t,c){var d=document.createElement('div');d.style.whiteSpace='pre-wrap';if(c)d.style.color=c;d.textContent=t;o.appendChild(d)}
  console.log=function(){w(fmt(arguments))};
  console.info=console.log;
  console.warn=function(){w(fmt(arguments),'#b45309')};
  console.error=function(){w(fmt(arguments),'#c0392b')};
  window.addEventListener('error',function(e){w('Error: '+e.message,'#c0392b')});
  window.addEventListener('unhandledrejection',function(e){w('Error: '+(e.reason&&e.reason.message||e.reason),'#c0392b')});
})();
</script>
<script>
try{
${safe}
}catch(e){console.error('Error: '+e.message)}
</script>
</body>`;
}
