import { useState, useEffect } from 'react';
import { getCountdown } from '../utils/countdown';
import { Clock } from 'lucide-react';

export default function CountdownTimer({ endTime, status }: { endTime: string; status: string }) {
  const [time, setTime] = useState(getCountdown(endTime));

  useEffect(() => {
    if (status !== 'active') return;
    const t = setInterval(() => setTime(getCountdown(endTime)), 1000);
    return () => clearInterval(t);
  }, [endTime, status]);

  if (status === 'closed') return (
    <span className="flex items-center gap-1 text-gray-400 text-sm"><Clock className="w-3.5 h-3.5" /> Closed</span>
  );
  if (status === 'upcoming') return (
    <span className="flex items-center gap-1 text-blue-600 text-sm font-medium"><Clock className="w-3.5 h-3.5" /> Starts soon</span>
  );
  return (
    <span className="flex items-center gap-1 text-orange-600 text-sm font-semibold">
      <Clock className="w-3.5 h-3.5" /> {time}
    </span>
  );
}
