import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, LineChart, Line } from "recharts";
import { TrendingUp, Activity, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ActivityTracker } from "@/components/dashboard/ActivityTracker";
import { format, subDays, eachDayOfInterval } from "date-fns";

interface WorkoutData {
  date: string;
  duration: number;
  calories: number;
}

export default function Progress() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [totalCalories, setTotalCalories] = useState(0);
  const [avgDuration, setAvgDuration] = useState(0);
  const [monthlyData, setMonthlyData] = useState<WorkoutData[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchProgressData = async () => {
      setLoading(true);
      
      const { data: workouts, error } = await supabase
        .from("workouts")
        .select("*")
        .eq("user_id", user.id)
        .order("workout_date", { ascending: true });

      if (error) {
        console.error("Error fetching workouts:", error);
        setLoading(false);
        return;
      }

      const workoutList = workouts || [];
      
      const total = workoutList.length;
      const duration = workoutList.reduce((sum, w) => sum + (w.duration_minutes || 0), 0);
      const calories = workoutList.reduce((sum, w) => sum + (w.calories_burned || 0), 0);
      
      setTotalWorkouts(total);
      setTotalDuration(duration);
      setTotalCalories(calories);
      setAvgDuration(total > 0 ? Math.round(duration / total) : 0);

      const today = new Date();
      const thirtyDaysAgo = subDays(today, 30);
      const monthlyWorkouts = workoutList.filter(w => {
        const workoutDate = new Date(w.workout_date);
        return workoutDate >= thirtyDaysAgo && workoutDate <= today;
      });

      const dailyMap = new Map<string, { duration: number; calories: number }>();
      monthlyWorkouts.forEach(w => {
        const existing = dailyMap.get(w.workout_date) || { duration: 0, calories: 0 };
        dailyMap.set(w.workout_date, {
          duration: existing.duration + (w.duration_minutes || 0),
          calories: existing.calories + (w.calories_burned || 0)
        });
      });

      const last30Days = eachDayOfInterval({ start: thirtyDaysAgo, end: today });
      const monthlyStats: WorkoutData[] = last30Days.map(day => {
        const dayStr = format(day, "yyyy-MM-dd");
        const data = dailyMap.get(dayStr) || { duration: 0, calories: 0 };
        return {
          date: format(day, "MMM d"),
          duration: data.duration,
          calories: data.calories
        };
      });
      setMonthlyData(monthlyStats);

      setLoading(false);
    };

    fetchProgressData();
  }, [user]);

  const milestones = [
    { label: "Total Workouts", value: totalWorkouts.toString(), icon: Activity },
    { label: "Total Minutes", value: totalDuration.toString(), icon: TrendingUp },
    { label: "Calories Burned", value: totalCalories.toLocaleString(), icon: Flame },
    { label: "Avg Duration", value: `${avgDuration} min`, icon: Activity },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl lg:text-3xl text-foreground mb-2">
          Progress & Analytics
        </h1>
        <p className="text-muted-foreground">
          Track your fitness journey over time
        </p>
      </div>

      {/* Milestone Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {milestones.map((milestone, index) => {
          const IconComponent = milestone.icon;
          return (
            <div 
              key={index} 
              className="glass-card rounded-xl p-4 animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center gap-2 mb-2">
                <IconComponent className="w-4 h-4 text-primary" />
                <p className="text-sm text-muted-foreground">{milestone.label}</p>
              </div>
              <p className="font-display font-bold text-2xl text-foreground">{milestone.value}</p>
            </div>
          );
        })}
      </div>

      {/* Activity Tracker */}
      <div className="mb-8">
        <ActivityTracker />
      </div>

      {/* Charts - Side by Side */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* 30-Day Calories */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display font-semibold text-lg text-foreground">30-Day Calories</h2>
            <div className="flex items-center gap-2 text-primary">
              <Flame className="w-4 h-4" />
              <span className="text-sm font-medium">
                {monthlyData.reduce((sum, d) => sum + d.calories, 0).toLocaleString()} cal
              </span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="caloriesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                  }}
                  formatter={(value: number) => [`${value} cal`, 'Calories Burned']}
                />
                <Area
                  type="monotone"
                  dataKey="calories"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#caloriesGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 30-Day Duration */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display font-semibold text-lg text-foreground">30-Day Duration</h2>
            <div className="flex items-center gap-2 text-primary">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">
                {monthlyData.reduce((sum, d) => sum + d.duration, 0)} min
              </span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                  }}
                  formatter={(value: number) => [`${value} min`, 'Duration']}
                />
                <Line
                  type="monotone"
                  dataKey="duration"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5, strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
