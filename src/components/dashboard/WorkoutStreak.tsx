import { useEffect, useState } from "react";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function WorkoutStreak() {
  const { user } = useAuth();
  const [weekDays] = useState(["M", "T", "W", "T", "F", "S", "S"]);
  const [completedDays, setCompletedDays] = useState<boolean[]>([false, false, false, false, false, false, false]);
  const [currentStreak, setCurrentStreak] = useState(0);

  useEffect(() => {
    if (user) {
      fetchWeekWorkouts();
    }
  }, [user]);

  const fetchWeekWorkouts = async () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday

    const workoutDays: boolean[] = [];
    let streak = 0;

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];

      const { data } = await supabase
        .from("workouts")
        .select("id")
        .eq("workout_date", dateStr)
        .limit(1);

      const hasWorkout = (data?.length || 0) > 0;
      workoutDays.push(hasWorkout);
    }

    setCompletedDays(workoutDays);

    // Calculate streak (consecutive days from today backwards)
    for (let i = today.getDay(); i >= 0; i--) {
      const idx = i === 0 ? 6 : i - 1; // Adjust for Monday start
      if (workoutDays[idx]) {
        streak++;
      } else {
        break;
      }
    }

    setCurrentStreak(streak);
  };

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display font-semibold text-lg text-foreground">Workout Streak</h3>
        <div className="flex items-center gap-2 text-warning">
          <Flame className="w-5 h-5" />
          <span className="font-bold">{currentStreak} days</span>
        </div>
      </div>

      <div className="flex justify-between gap-2">
        {weekDays.map((day, index) => (
          <div key={index} className="flex flex-col items-center gap-2">
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center font-semibold transition-all duration-300",
                completedDays[index]
                  ? "gradient-bg text-primary-foreground shadow-md"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {completedDays[index] ? "✓" : day}
            </div>
            <span className="text-xs text-muted-foreground">{day}</span>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 rounded-xl bg-muted/50">
        <p className="text-sm text-muted-foreground">
          {currentStreak > 0 
            ? `🔥 You're on fire! ${currentStreak} day streak!` 
            : "Start logging workouts to build your streak!"}
        </p>
      </div>
    </div>
  );
}
