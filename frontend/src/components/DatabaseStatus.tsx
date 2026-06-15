import { useState, useEffect } from 'react';
import { Database, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export function DatabaseStatus() {
  const [status, setStatus] = useState<'loading' | 'connected' | 'error'>('loading');
  const [info, setInfo] = useState<any>(null);

  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch('/api/db-status');
        const data = await res.json();
        if (data.status === 'connected') {
          setStatus('connected');
          setInfo(data);
        } else {
          setStatus('error');
          setInfo(data);
        }
      } catch (err) {
        setStatus('error');
      }
    }
    checkStatus();
  }, []);

  if (status === 'loading') {
    return (
      <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
        <Loader2 size={12} className="animate-spin" />
        Syncing with Nodes...
      </div>
    );
  }

  if (status === 'connected') {
    return (
      <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-bold uppercase tracking-wider" title={`v${info?.version} @ ${info?.database}`}>
        <CheckCircle2 size={12} />
        Database Online
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-red-500 text-[10px] font-bold uppercase tracking-wider" title={info?.message}>
      <XCircle size={12} />
      DB Offline
    </div>
  );
}
