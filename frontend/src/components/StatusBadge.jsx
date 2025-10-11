import { useEffect, useState } from 'react';
import { API_BASE } from '../config';

export default function StatusBadge(){
  const [status, setStatus] = useState({service: 'unknown', db: 'unknown'});
  useEffect(()=>{
    let mounted = true;
    async function fetchStatus(){
      try{
        const res = await fetch(`${API_BASE}/api/health`);
        const data = await res.json();
        if(mounted) setStatus(data);
      }catch(e){
        if(mounted) setStatus({service:'down', db:'down'});
      }
    }
    fetchStatus();
    const id = setInterval(fetchStatus, 15000);
    return ()=>{ mounted=false; clearInterval(id); }
  },[]);

  const ok = status.service === 'ok' || status.db === 'ok' || status.db === 'ok';
  return (
    <div className={`px-2 py-1 rounded text-sm font-medium ${ok? 'bg-green-600 text-black':'bg-red-600 text-white'}`}>
      {ok ? 'API: OK' : 'API: DOWN'}
    </div>
  );
}
