import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { ProgressChart } from "@/components/dashboard/ProgressChart";
import { WorkoutStreak } from "@/components/dashboard/WorkoutStreak";
import { RecentWorkouts } from "@/components/dashboard/RecentWorkouts";
import { Flame, Footprints, Clock, Scale } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Profile {
  weight_kg: number | null;
  height_cm: number | null;
  age: number | null;
  gender: string | null;
  activity_level: string | null;
  calorie_goal: number | null;
}

const activityMultipliers: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [todayStats, setTodayStats] = useState({
    caloriesBurned: 0,
    workoutMinutes: 0,
    caloriesConsumed: 0,
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchTodayStats();
    }
  }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("weight_kg, height_cm, age, gender, activity_level, calorie_goal")
      .eq("user_id", user!.id)
      .maybeSingle();
    setProfile(data);
  };

  const fetchTodayStats = async () => {
    const today = new Date().toISOString().split("T")[0];

    const { data: workouts } = await supabase
      .from("workouts")
      .select("duration_minutes, calories_burned")
      .eq("workout_date", today);

    const { data: meals } = await supabase
      .from("meals")
      .select("calories")
      .eq("meal_date", today);

    const caloriesBurned = workouts?.reduce((sum, w) => sum + (w.calories_burned || 0), 0) || 0;
    const workoutMinutes = workouts?.reduce((sum, w) => sum + w.duration_minutes, 0) || 0;
    const caloriesConsumed = meals?.reduce((sum, m) => sum + m.calories, 0) || 0;

    setTodayStats({ caloriesBurned, workoutMinutes, caloriesConsumed });
  };

  const calculateTDEE = (p: Profile): number | null => {
    if (!p.weight_kg || !p.height_cm || !p.age || !p.gender) {
      return null;
    }

    let bmr: number;
    if (p.gender === "male") {
      bmr = 10 * Number(p.weight_kg) + 6.25 * p.height_cm - 5 * p.age + 5;
    } else {
      bmr = 10 * Number(p.weight_kg) + 6.25 * p.height_cm - 5 * p.age - 161;
    }

    const multiplier = activityMultipliers[p.activity_level || "moderate"] || 1.55;
    return Math.round(bmr * multiplier);
  };

  const getCalorieGoal = (): number | null => {
    if (!profile) return null;
    if (profile.calorie_goal) return profile.calorie_goal;
    return calculateTDEE(profile);
  };

  const calorieGoal = getCalorieGoal();

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl lg:text-3xl text-foreground mb-2">
          Welcome back! 👋
        </h1>
        <p className="text-muted-foreground">
          Here's your fitness summary for today
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
        <StatCard
          title="Calories Burned"
          value={todayStats.caloriesBurned.toLocaleString()}
          subtitle="today"
          icon={<Flame className="w-6 h-6" />}
        />
        <StatCard
          title="Calories Consumed"
          value={todayStats.caloriesConsumed.toLocaleString()}
          subtitle={calorieGoal ? `of ${calorieGoal.toLocaleString()} goal` : "no goal set"}
          icon={<Footprints className="w-6 h-6" />}
          iconBgClass="bg-secondary"
        />
        <StatCard
          title="Workout Time"
          value={`${todayStats.workoutMinutes} min`}
          subtitle="today's session"
          icon={<Clock className="w-6 h-6" />}
          iconBgClass="bg-accent"
        />
        <StatCard
          title="Current Weight"
          value={profile?.weight_kg ? `${profile.weight_kg} kg` : "-- kg"}
          subtitle="update in profile"
          icon={<Scale className="w-6 h-6" />}
          iconBgClass="bg-warning"
        />
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <ProgressChart title="Calories This Week" dataKey="calories" />
        <ProgressChart title="Workout Minutes This Week" dataKey="minutes" />
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        <WorkoutStreak />
        <RecentWorkouts />
      </div>
    </DashboardLayout>
  );
}
