"use client";

import { useEffect, useState } from "react";
import { Clock, Calendar } from "lucide-react";

interface DaysLeftTrackerProps {
  seasonStartDate: string;
  seasonEndDate: string;
  seasonLengthDays: number;
}

export default function DaysLeftTracker({ seasonStartDate, seasonEndDate, seasonLengthDays }: DaysLeftTrackerProps) {
  const [daysLeft, setDaysLeft] = useState(0);
  const [daysPassed, setDaysPassed] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);
  const [isEndingSoon, setIsEndingSoon] = useState(false);

  useEffect(() => {
    const calculateDays = () => {
      const start = new Date(seasonStartDate);
      const end = new Date(seasonEndDate);
      const now = new Date();
      
      const totalDuration = end.getTime() - start.getTime();
      const timePassed = now.getTime() - start.getTime();
      const timeLeft = end.getTime() - now.getTime();
      
      const daysRemaining = Math.max(0, Math.ceil(timeLeft / (1000 * 60 * 60 * 24)));
      const daysElapsed = Math.max(0, Math.floor(timePassed / (1000 * 60 * 60 * 24)));
      const progress = Math.min(100, Math.max(0, (timePassed / totalDuration) * 100));
      
      setDaysLeft(daysRemaining);
      setDaysPassed(daysElapsed);
      setProgressPercent(progress);
      setIsEndingSoon(daysRemaining <= 7 && daysRemaining > 0);
    };

    calculateDays();
    
    // Update every hour
    const interval = setInterval(calculateDays, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [seasonEndDate, seasonLengthDays]);

  if (daysLeft <= 0) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-red-400" />
          <div>
            <p className="font-semibold text-red-400">Season Ended</p>
            <p className="text-sm text-red-400/70">This league season has concluded</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl p-4 border ${
      isEndingSoon 
        ? 'bg-amber-500/10 border-amber-500/30' 
        : 'bg-blue-500/10 border-blue-500/30'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            isEndingSoon ? 'bg-amber-500/20' : 'bg-blue-500/20'
          }`}>
            <Calendar className={`w-5 h-5 ${
              isEndingSoon ? 'text-amber-400' : 'text-blue-400'
            }`} />
          </div>
          <div>
            <p className={`font-semibold ${
              isEndingSoon ? 'text-amber-400' : 'text-blue-400'
            }`}>
              {daysLeft} {daysLeft === 1 ? 'Day' : 'Days'} Left
            </p>
            <p className="text-sm text-zinc-500">
              Day {daysPassed} of {seasonLengthDays}
            </p>
          </div>
        </div>
        
        {isEndingSoon && (
          <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-xs font-medium rounded-full">
            Ending Soon!
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              isEndingSoon 
                ? 'bg-amber-500' 
                : 'bg-blue-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-zinc-500">
          <span>Start</span>
          <span>{progressPercent.toFixed(0)}% Complete</span>
          <span>End</span>
        </div>
      </div>
    </div>
  );
}
