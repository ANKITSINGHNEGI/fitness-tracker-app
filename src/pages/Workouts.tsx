import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Plus, 
  Dumbbell, 
  Heart, 
  Sparkles, 
  Clock, 
  Flame,
  Filter,
  Search,
  Calendar,
  Loader2,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const workoutCategories = [
  { id: "cardio", name: "Cardio", icon: Heart, color: "text-destructive bg-destructive/10" },
  { id: "strength", name: "Strength", icon: Dumbbell, color: "text-secondary bg-secondary/10" },
  { id: "yoga", name: "Yoga", icon: Sparkles, color: "text-accent bg-accent/10" },
];

interface Workout {
  id: string;
  type: string;
  category: string;
  duration_minutes: number;
  calories_burned: number | null;
  workout_date: string;
  notes: string | null;
}

export default function Workouts() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  // Edit
const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);

  // Form state
  const [workoutName, setWorkoutName] = useState("");
  const [workoutCategory, setWorkoutCategory] = useState("");
  const [duration, setDuration] = useState("");
  const [calories, setCalories] = useState("");

  useEffect(() => {
    if (user) {
      fetchWorkouts();
    }
  }, [user]);

  const fetchWorkouts = async () => {
    try {
      const { data, error } = await supabase
        .from("workouts")
        .select("*")
        .order("workout_date", { ascending: false });

      if (error) throw error;
      setWorkouts(data || []);
    } catch (error: any) {
      toast.error("Failed to load workouts");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveWorkout = async () => {
    if (!workoutName || !workoutCategory || !duration) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.from("workouts").insert({
        user_id: user!.id,
        type: workoutName,
        category: workoutCategory,
        duration_minutes: parseInt(duration),
        calories_burned: calories ? parseInt(calories) : null,
      });

      if (error) throw error;

      toast.success("Workout logged successfully!");
      setShowForm(false);
      setWorkoutName("");
      setWorkoutCategory("");
      setDuration("");
      setCalories("");
      fetchWorkouts();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  //Edit
  const handleUpdateWorkout = async () => {
  if (!editingWorkout) return;

  setIsSaving(true);
  try {
    const { error } = await supabase
      .from("workouts")
      .update({
        type: workoutName,
        category: workoutCategory,
        duration_minutes: parseInt(duration),
        calories_burned: calories ? parseInt(calories) : null,
      })
      .eq("id", editingWorkout.id);

    if (error) throw error;

    toast.success("Workout updated successfully!");

    setEditingWorkout(null);
    setShowForm(false);
    setWorkoutName("");
    setWorkoutCategory("");
    setDuration("");
    setCalories("");

    fetchWorkouts();
  } catch (error: any) {
    toast.error(error.message);
  } finally {
    setIsSaving(false);
  }
};

  const handleDeleteWorkout = async (id: string) => {
    try {
      const { error } = await supabase.from("workouts").delete().eq("id", id);
      if (error) throw error;
      toast.success("Workout deleted");
      fetchWorkouts();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const filteredWorkouts = workouts.filter((workout) => {
    const matchesCategory = selectedCategory === "all" || workout.category === selectedCategory;
    const matchesSearch = workout.type.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryInfo = (category: string) => {
    return workoutCategories.find((cat) => cat.id === category) || workoutCategories[0];
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display font-bold text-2xl lg:text-3xl text-foreground mb-2">
            Workout Tracking
          </h1>
          <p className="text-muted-foreground">
            Log and track your workout sessions
          </p>
        </div>
        <Button variant="gradient" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-5 h-5" />
          Log Workout
        </Button>
      </div>

      {/* Add Workout Form */}
      {showForm && (
        <div className="glass-card rounded-2xl p-6 mb-8 animate-slide-up">
          <h2 className="font-display font-semibold text-lg text-foreground mb-6">
            Log New Workout
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Workout Name</Label>
              <Input 
                placeholder="e.g., Morning Run" 
                value={workoutName}
                onChange={(e) => setWorkoutName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={workoutCategory} onValueChange={setWorkoutCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {workoutCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Duration (minutes)</Label>
              <Input 
                type="number" 
                placeholder="45" 
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Calories Burned</Label>
              <Input 
                type="number" 
                placeholder="350" 
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button variant="gradient" onClick={editingWorkout ? handleUpdateWorkout : handleSaveWorkout} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {editingWorkout ? "Update Workout" : "Save Workout"}
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Category Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => setSelectedCategory("all")}
          className={cn(
            "px-4 py-2 rounded-xl font-medium transition-all duration-200",
            selectedCategory === "all"
              ? "gradient-bg text-primary-foreground shadow-md"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          All Workouts
        </button>
        {workoutCategories.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200",
                selectedCategory === cat.id
                  ? "gradient-bg text-primary-foreground shadow-md"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              <Icon className="w-4 h-4" />
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search workouts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Workout History */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="font-display font-semibold text-lg text-foreground">
            Workout History
          </h2>
        </div>
        <div className="divide-y divide-border">
          {isLoading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : filteredWorkouts.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No workouts logged yet. Start by logging your first workout!
            </div>
          ) : (
            filteredWorkouts.map((workout, index) => {
              const category = getCategoryInfo(workout.category);
              const Icon = category.icon;
              return (
                <div
                  key={workout.id}
                  className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", category.color)}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{workout.type}</h3>
                    <p className="text-sm text-muted-foreground">{category.name}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {workout.duration_minutes} min
                    </div>
                    <div className="flex items-center gap-2 text-warning">
                      <Flame className="w-4 h-4" />
                      {workout.calories_burned || 0} cal
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {workout.workout_date}
                    </div>
                  </div>
                  {/* Edit Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingWorkout(workout);
                      setWorkoutName(workout.type);
                      setWorkoutCategory(workout.category);
                      setDuration(workout.duration_minutes.toString());
                      setCalories(workout.calories_burned?.toString() || "");
                      setShowForm(true);
                    }}
                  >
                    ✏️
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleDeleteWorkout(workout.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
