import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format, eachDayOfInterval, startOfWeek, subYears, getDay } from "date-fns";

export function ActivityTracker() {
  const { user } = useAuth();
  const [workoutDays, setWorkoutDays] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchWorkouts = async () => {
      const yearAgo = subYears(new Date(), 1);
      const { data, error } = await supabase
        .from("workouts")
        .select("workout_date")
        .eq("user_id", user.id)
        .gte("workout_date", format(yearAgo, "yyyy-MM-dd"));

      if (!error && data) {
        const countMap = new Map<string, number>();
        data.forEach((workout) => {
          const date = workout.workout_date;
          countMap.set(date, (countMap.get(date) || 0) + 1);
        });
        setWorkoutDays(countMap);
      }
      setLoading(false);
    };

    fetchWorkouts();
  }, [user]);

  const today = new Date();
  const yearAgo = subYears(today, 1);
  const startDate = startOfWeek(yearAgo, { weekStartsOn: 0 });
  const allDays = eachDayOfInterval({ start: startDate, end: today });

  // Group days into weeks (columns)
  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];
  
  allDays.forEach((day) => {
    const dayOfWeek = getDay(day);
    if (dayOfWeek === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(day);
  });
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  const getIntensityClass = (count: number) => {
    if (count === 0) return "bg-[#ebedf0] dark:bg-[#161b22]";
    if (count === 1) return "bg-[#9be9a8] dark:bg-[#0e4429]";
    if (count === 2) return "bg-[#40c463] dark:bg-[#006d32]";
    if (count === 3) return "bg-[#30a14e] dark:bg-[#26a641]";
    return "bg-[#216e39] dark:bg-[#39d353]";
  };

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Calculate month labels positions
  const monthLabels: { month: string; weekIndex: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, weekIndex) => {
    const firstDayOfWeek = week[0];
    const month = firstDayOfWeek.getMonth();
    if (month !== lastMonth) {
      monthLabels.push({ month: months[month], weekIndex });
      lastMonth = month;
    }
  });

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-6">
        <div className="h-32 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="overflow-x-auto">
        <div className="min-w-[750px]">
          {/* Month labels */}
          <div className="flex mb-2 relative" style={{ marginLeft: '36px' }}>
            {monthLabels.map((label, index) => (
              <span
                key={index}
                className="text-xs text-muted-foreground absolute"
                style={{ left: `${label.weekIndex * 14}px` }}
              >
                {label.month}
              </span>
            ))}
          </div>

          <div className="flex gap-[3px] mt-6">
            {/* Day labels */}
            <div className="flex flex-col gap-[3px] mr-2 text-xs text-muted-foreground w-8">
              <div className="h-[11px]"></div>
              <div className="h-[11px] flex items-center">Mon</div>
              <div className="h-[11px]"></div>
              <div className="h-[11px] flex items-center">Wed</div>
              <div className="h-[11px]"></div>
              <div className="h-[11px] flex items-center">Fri</div>
              <div className="h-[11px]"></div>
            </div>

            {/* Grid */}
            <TooltipProvider>
              <div className="flex gap-[3px]">
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-[3px]">
                    {/* Fill empty days at the start of first week */}
                    {weekIndex === 0 && getDay(week[0]) !== 0 && (
                      Array.from({ length: getDay(week[0]) }).map((_, i) => (
                        <div key={`empty-${i}`} className="w-[11px] h-[11px]" />
                      ))
                    )}
                    {week.map((day) => {
                      const dateStr = format(day, "yyyy-MM-dd");
                      const count = workoutDays.get(dateStr) || 0;
                      const isToday = format(day, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");
                      
                      return (
                        <Tooltip key={dateStr}>
                          <TooltipTrigger asChild>
                            <div
                              className={`w-[11px] h-[11px] rounded-[2px] cursor-pointer ${getIntensityClass(count)} ${isToday ? "ring-1 ring-foreground/50" : ""}`}
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-sm font-medium">
                              {count === 0 ? "No workouts" : `${count} workout${count > 1 ? "s" : ""}`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(day, "EEEE, MMMM d, yyyy")}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                ))}
              </div>
            </TooltipProvider>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-1 mt-4 text-xs text-muted-foreground">
            <span>Less</span>
            <div className="w-[11px] h-[11px] rounded-[2px] bg-[#ebedf0] dark:bg-[#161b22]" />
            <div className="w-[11px] h-[11px] rounded-[2px] bg-[#9be9a8] dark:bg-[#0e4429]" />
            <div className="w-[11px] h-[11px] rounded-[2px] bg-[#40c463] dark:bg-[#006d32]" />
            <div className="w-[11px] h-[11px] rounded-[2px] bg-[#30a14e] dark:bg-[#26a641]" />
            <div className="w-[11px] h-[11px] rounded-[2px] bg-[#216e39] dark:bg-[#39d353]" />
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  );
}
