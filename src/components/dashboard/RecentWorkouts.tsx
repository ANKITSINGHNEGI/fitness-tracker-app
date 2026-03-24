import { useEffect, useState } from "react";
import { Dumbbell, Heart, Sparkles, Clock, Flame, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

const categoryConfig: Record<string, { icon: typeof Heart; color: string }> = {
  cardio: { icon: Heart, color: "bg-destructive/10 text-destructive" },
  strength: { icon: Dumbbell, color: "bg-secondary/10 text-secondary" },
  yoga: { icon: Sparkles, color: "bg-accent/10 text-accent" },
};

interface Workout {
  id: string;
  type: string;
  category: string;
  duration_minutes: number;
  calories_burned: number | null;
}

export function RecentWorkouts() {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRecentWorkouts();
    }
  }, [user]);

  const fetchRecentWorkouts = async () => {
    const { data } = await supabase
      .from("workouts")
      .select("id, type, category, duration_minutes, calories_burned")
      .order("created_at", { ascending: false })
      .limit(3);

    setWorkouts(data || []);
    setIsLoading(false);
  };

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display font-semibold text-lg text-foreground">Recent Workouts</h3>
        <Link to="/workouts" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
          View All
        </Link>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : workouts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No workouts logged yet
          </div>
        ) : (
          workouts.map((workout, index) => {
            const config = categoryConfig[workout.category] || categoryConfig.cardio;
            const Icon = config.icon;
            return (
              <div
                key={workout.id}
                className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all duration-200 cursor-pointer group animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", config.color)}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {workout.type}
                  </h4>
                  <p className="text-sm text-muted-foreground capitalize">{workout.category}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">{workout.duration_minutes} min</span>
                  </div>
                  <div className="flex items-center gap-1 text-warning">
                    <Flame className="w-4 h-4" />
                    <span className="text-sm font-medium">{workout.calories_burned || 0} cal</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
