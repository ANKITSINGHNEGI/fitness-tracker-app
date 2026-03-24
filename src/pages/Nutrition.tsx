import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Coffee, Sun, Moon, Cookie, Flame, Beef, Wheat, Droplet, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const mealTypes = [
  { id: "breakfast", name: "Breakfast", icon: Coffee, time: "7:00 AM" },
  { id: "lunch", name: "Lunch", icon: Sun, time: "12:30 PM" },
  { id: "dinner", name: "Dinner", icon: Moon, time: "7:00 PM" },
  { id: "snacks", name: "Snacks", icon: Cookie, time: "Anytime" },
];

interface Meal {
  id: string;
  name: string;
  meal_type: string;
  calories: number;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  meal_date: string;
}

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

export default function Nutrition() {
  const { user } = useAuth();
  const [selectedMeal, setSelectedMeal] = useState<string>("all");
  //const [selectedMeal, setSelectedMeal] = useState<string>("breakfast");
  const [showForm, setShowForm] = useState(false);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);

  // Form state
  const [foodName, setFoodName] = useState("");
  const [mealType, setMealType] = useState("breakfast");
  const [caloriesInput, setCaloriesInput] = useState("");
  const [proteinInput, setProteinInput] = useState("");
  const [carbsInput, setCarbsInput] = useState("");
  const [fatInput, setFatInput] = useState("");

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

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchMeals();
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

  const fetchMeals = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("meals")
        .select("*")
        .eq("meal_date", today)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMeals(data || []);
    } catch (error: any) {
      toast.error("Failed to load meals");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveMeal = async () => {
    if (!foodName || !caloriesInput) {
      toast.error("Please fill in food name and calories");
      return;
    }

    setIsSaving(true);
    try {
      if (editingMeal) {
        const { error } = await supabase
          .from("meals")
          .update({
            name: foodName,
            meal_type: mealType,
            calories: parseInt(caloriesInput),
            protein_g: proteinInput ? parseFloat(proteinInput) : null,
            carbs_g: carbsInput ? parseFloat(carbsInput) : null,
            fat_g: fatInput ? parseFloat(fatInput) : null,
          })
          .eq("id", editingMeal.id);

        if (error) throw error;

        setEditingMeal(null); // reset edit mode

      } else {
        const { error } = await supabase.from("meals").insert({
          user_id: user!.id,
          name: foodName,
          meal_type: mealType,
          calories: parseInt(caloriesInput),
          protein_g: proteinInput ? parseFloat(proteinInput) : null,
          carbs_g: carbsInput ? parseFloat(carbsInput) : null,
          fat_g: fatInput ? parseFloat(fatInput) : null,
        });

        if (error) throw error;
      }

      toast.success("Meal logged successfully!");
      setShowForm(false);
      setFoodName("");
      setCaloriesInput("");
      setProteinInput("");
      setCarbsInput("");
      setFatInput("");
      fetchMeals();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMeal = async (id: string) => {
    try {
      const { error } = await supabase.from("meals").delete().eq("id", id);
      if (error) throw error;
      toast.success("Meal deleted");
      fetchMeals();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const dailyCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);
  const calorieProgress = calorieGoal ? Math.min((dailyCalories / calorieGoal) * 100, 100) : 0;

  const totalProtein = meals.reduce((sum, meal) => sum + (meal.protein_g || 0), 0);
  const totalCarbs = meals.reduce((sum, meal) => sum + (meal.carbs_g || 0), 0);
  const totalFat = meals.reduce((sum, meal) => sum + (meal.fat_g || 0), 0);

  const macroData = [
    { name: "Protein", value: totalProtein || 1, color: "hsl(160, 84%, 39%)" },
    { name: "Carbs", value: totalCarbs || 1, color: "hsl(210, 100%, 50%)" },
    { name: "Fats", value: totalFat || 1, color: "hsl(38, 92%, 50%)" },
  ];

  const getMealCalories = (mealId: string) => {
    return meals
      .filter((meal) => meal.meal_type === mealId)
      .reduce((sum, meal) => sum + meal.calories, 0);
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display font-bold text-2xl lg:text-3xl text-foreground mb-2">
            Nutrition Tracker
          </h1>
          <p className="text-muted-foreground">
            Track your daily meals and macros
          </p>
        </div>
        <Button variant="gradient" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-5 h-5" />
          Log Meal
        </Button>
      </div>

      {/* Calorie Overview */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display font-semibold text-lg text-foreground">
              Daily Calories
            </h2>
            <div className="flex items-center gap-2 text-warning">
              <Flame className="w-5 h-5" />
              <span className="font-bold">
                {calorieGoal ? `${Math.max(calorieGoal - dailyCalories, 0)} remaining` : "No goal set"}
              </span>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Consumed</span>
              <span className="font-semibold text-foreground">
                {dailyCalories} {calorieGoal ? `/ ${calorieGoal}` : ""} cal
              </span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${calorieProgress}%` }}
              />
            </div>
          </div>

          {/* Meal Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
            
              {/* All Meals Button */}
              <button
                onClick={() => setSelectedMeal("all")}
                className={cn(
                  "p-4 rounded-xl text-left transition-all duration-200",
                  selectedMeal === "all"
                    ? "gradient-bg text-primary-foreground shadow-md"
                    : "bg-muted/50 hover:bg-muted"
                )}
              >
                <p className="font-semibold">All Meals</p>
                <p className="text-sm text-muted-foreground">
                  {meals.reduce((sum, m) => sum + m.calories, 0)} cal
                </p>
              </button>

              {mealTypes.map((meal) => {
              const Icon = meal.icon;
              const mealCalories = getMealCalories(meal.id);
              return (
                <button
                  key={meal.id}
                  onClick={() => setSelectedMeal(meal.id)}
                  className={cn(
                    "p-4 rounded-xl text-left transition-all duration-200",
                    selectedMeal === meal.id
                      ? "gradient-bg text-primary-foreground shadow-md"
                      : "bg-muted/50 hover:bg-muted"
                  )}
                >
                  <Icon className={cn(
                    "w-6 h-6 mb-2",
                    selectedMeal === meal.id ? "text-primary-foreground" : "text-primary"
                  )} />
                  <p className={cn(
                    "font-semibold",
                    selectedMeal === meal.id ? "text-primary-foreground" : "text-foreground"
                  )}>{meal.name}</p>
                  <p className={cn(
                    "text-sm",
                    selectedMeal === meal.id ? "text-primary-foreground/70" : "text-muted-foreground"
                  )}>{mealCalories} cal</p>
                </button>
              );
            })}
            
          </div>
        </div>

        {/* Macronutrient Breakdown */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="font-display font-semibold text-lg text-foreground mb-4">
            Macros Today
          </h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={macroData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {macroData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 mt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Beef className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">Protein</span>
              </div>
              <span className="font-semibold text-foreground">{totalProtein.toFixed(0)}g</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wheat className="w-4 h-4 text-secondary" />
                <span className="text-sm text-muted-foreground">Carbs</span>
              </div>
              <span className="font-semibold text-foreground">{totalCarbs.toFixed(0)}g</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplet className="w-4 h-4 text-warning" />
                <span className="text-sm text-muted-foreground">Fats</span>
              </div>
              <span className="font-semibold text-foreground">{totalFat.toFixed(0)}g</span>
            </div>
          </div>
        </div>
      </div>

      {/* Add Meal Form */}
      {showForm && (
        <div className="glass-card rounded-2xl p-6 mb-8 animate-slide-up">
          <h2 className="font-display font-semibold text-lg text-foreground mb-6">
            Log New Meal
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="space-y-2">
              <Label>Food Item</Label>
              <Input 
                placeholder="e.g., Grilled Chicken" 
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Meal</Label>
              <select 
                className="w-full h-10 px-3 rounded-lg border border-input bg-background"
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
              >
                {mealTypes.map((meal) => (
                  <option key={meal.id} value={meal.id}>{meal.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Calories</Label>
              <Input 
                type="number" 
                placeholder="350" 
                value={caloriesInput}
                onChange={(e) => setCaloriesInput(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Protein (g)</Label>
              <Input 
                type="number" 
                placeholder="25" 
                value={proteinInput}
                onChange={(e) => setProteinInput(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Carbs (g)</Label>
              <Input 
                type="number" 
                placeholder="30" 
                value={carbsInput}
                onChange={(e) => setCarbsInput(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Fat (g)</Label>
              <Input 
                type="number" 
                placeholder="10" 
                value={fatInput}
                onChange={(e) => setFatInput(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button variant="gradient" onClick={handleSaveMeal} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {editingMeal ? "Update Meal" : "Add Food"}
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Meal Log */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="font-display font-semibold text-lg text-foreground">
            {mealTypes.find((m) => m.id === selectedMeal)?.name} Log
          </h2>
        </div>
        <div className="divide-y divide-border">
          {isLoading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : (
            meals
              .filter((meal) => selectedMeal === "all" || meal.meal_type === selectedMeal)
              .map((meal, index) => (
                <div
                  key={meal.id}
                  className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div>
                    <h3 className="font-semibold text-foreground">{meal.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      P: {meal.protein_g || 0}g • C: {meal.carbs_g || 0}g • F: {meal.fat_g || 0}g
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold text-foreground">{meal.calories}</p>
                      <p className="text-sm text-muted-foreground">calories</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingMeal(meal);
                        setFoodName(meal.name);
                        setMealType(meal.meal_type);
                        setCaloriesInput(meal.calories.toString());
                        setProteinInput(meal.protein_g?.toString() || "");
                        setCarbsInput(meal.carbs_g?.toString() || "");
                        setFatInput(meal.fat_g?.toString() || "");
                        setShowForm(true);
                      }}
                    >
                      ✏️
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDeleteMeal(meal.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
          )}
          {!isLoading && meals.filter((meal) => selectedMeal === "all" || meal.meal_type === selectedMeal).length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              No foods logged for this meal yet
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
