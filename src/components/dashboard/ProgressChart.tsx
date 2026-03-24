import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ProgressChartProps {
  title: string;
  dataKey: "calories" | "minutes";
}

export function ProgressChart({ title, dataKey }: ProgressChartProps) {
  const { user } = useAuth();
  const [data, setData] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    if (user) {
      fetchWeekData();
    }
  }, [user, dataKey]);

  const fetchWeekData = async () => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const today = new Date();
    const weekData: { name: string; value: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const dayName = days[date.getDay()];

      if (dataKey === "calories") {
        const { data: meals } = await supabase
          .from("meals")
          .select("calories")
          .eq("meal_date", dateStr);
        const total = meals?.reduce((sum, m) => sum + m.calories, 0) || 0;
        weekData.push({ name: dayName, value: total });
      } else {
        const { data: workouts } = await supabase
          .from("workouts")
          .select("duration_minutes")
          .eq("workout_date", dateStr);
        const total = workouts?.reduce((sum, w) => sum + w.duration_minutes, 0) || 0;
        weekData.push({ name: dayName, value: total });
      }
    }

    setData(weekData);
  };

  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="font-display font-semibold text-lg text-foreground mb-6">{title}</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
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
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
              itemStyle={{ color: 'hsl(var(--primary))' }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="hsl(160, 84%, 39%)"
              strokeWidth={3}
              fill="url(#colorGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
