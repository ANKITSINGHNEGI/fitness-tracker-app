import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User, Mail, Ruler, Scale, Calendar, Loader2, Save, Target, Activity } from "lucide-react";

interface Profile {
  full_name: string | null;
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  gender: string | null;
  activity_level: string | null;
  calorie_goal: number | null;
}

const activityLevels = [
  { value: "sedentary", label: "Sedentary", description: "Little or no exercise", multiplier: 1.2 },
  { value: "light", label: "Lightly Active", description: "Light exercise 1-3 days/week", multiplier: 1.375 },
  { value: "moderate", label: "Moderately Active", description: "Moderate exercise 3-5 days/week", multiplier: 1.55 },
  { value: "active", label: "Active", description: "Hard exercise 6-7 days/week", multiplier: 1.725 },
  { value: "very_active", label: "Very Active", description: "Very hard exercise, physical job", multiplier: 1.9 },
];

export default function Profile() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<Profile>({
    full_name: "",
    age: null,
    height_cm: null,
    weight_kg: null,
    gender: null,
    activity_level: "moderate",
    calorie_goal: null
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching profile:", error);
    } else if (data) {
      setProfile({
        full_name: data.full_name,
        age: data.age,
        height_cm: data.height_cm,
        weight_kg: data.weight_kg ? Number(data.weight_kg) : null,
        gender: data.gender,
        activity_level: data.activity_level || "moderate",
        calorie_goal: data.calorie_goal
      });
    }
    setIsLoading(false);
  };

  const calculateTDEE = () => {
    if (!profile.weight_kg || !profile.height_cm || !profile.age || !profile.gender) {
      return null;
    }

    // Mifflin-St Jeor Equation
    let bmr: number;
    if (profile.gender === "male") {
      bmr = 10 * profile.weight_kg + 6.25 * profile.height_cm - 5 * profile.age + 5;
    } else {
      bmr = 10 * profile.weight_kg + 6.25 * profile.height_cm - 5 * profile.age - 161;
    }

    const activity = activityLevels.find(a => a.value === profile.activity_level) || activityLevels[2];
    return Math.round(bmr * activity.multiplier);
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        age: profile.age,
        height_cm: profile.height_cm,
        weight_kg: profile.weight_kg,
        gender: profile.gender,
        activity_level: profile.activity_level,
        calorie_goal: profile.calorie_goal
      })
      .eq("user_id", user.id);

    if (error) {
      toast.error("Failed to update profile");
      console.error(error);
    } else {
      toast.success("Profile updated successfully!");
    }
    
    setIsSaving(false);
  };

  const calculateBMI = () => {
    if (profile.height_cm && profile.weight_kg) {
      const heightM = profile.height_cm / 100;
      return (profile.weight_kg / (heightM * heightM)).toFixed(1);
    }
    return null;
  };

  const bmi = calculateBMI();
  const calculatedTDEE = calculateTDEE();
  const displayCalorieGoal = profile.calorie_goal || calculatedTDEE;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl lg:text-3xl text-foreground mb-2">
          Profile Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your personal information
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile Form */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6">
          <h2 className="font-display font-semibold text-lg text-foreground mb-6">
            Personal Information
          </h2>
          
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  className="pl-10"
                  disabled
                />
              </div>
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Your full name"
                  className="pl-10"
                  value={profile.full_name || ""}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={profile.gender || ""}
                  onValueChange={(value) => setProfile({ ...profile, gender: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="age"
                    type="number"
                    placeholder="25"
                    className="pl-10"
                    value={profile.age || ""}
                    onChange={(e) => setProfile({ ...profile, age: e.target.value ? parseInt(e.target.value) : null })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Height (cm)</Label>
                <div className="relative">
                  <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="height"
                    type="number"
                    placeholder="175"
                    className="pl-10"
                    value={profile.height_cm || ""}
                    onChange={(e) => setProfile({ ...profile, height_cm: e.target.value ? parseInt(e.target.value) : null })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <div className="relative">
                  <Scale className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    placeholder="70"
                    className="pl-10"
                    value={profile.weight_kg || ""}
                    onChange={(e) => setProfile({ ...profile, weight_kg: e.target.value ? parseFloat(e.target.value) : null })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="activity">Activity Level</Label>
              <Select
                value={profile.activity_level || "moderate"}
                onValueChange={(value) => setProfile({ ...profile, activity_level: value })}
              >
                <SelectTrigger>
                  <Activity className="w-5 h-5 text-muted-foreground mr-2" />
                  <SelectValue placeholder="Select activity level" />
                </SelectTrigger>
                <SelectContent>
                  {activityLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      <div className="flex flex-col">
                        <span>{level.label}</span>
                        <span className="text-xs text-muted-foreground">{level.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="calorieGoal">Daily Calorie Goal</Label>
              <div className="relative">
                <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="calorieGoal"
                  type="number"
                  placeholder={calculatedTDEE ? `Auto: ${calculatedTDEE}` : "Enter goal"}
                  className="pl-10"
                  value={profile.calorie_goal || ""}
                  onChange={(e) => setProfile({ ...profile, calorie_goal: e.target.value ? parseInt(e.target.value) : null })}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {calculatedTDEE 
                  ? `Leave empty to use calculated goal (${calculatedTDEE} cal)`
                  : "Fill in gender, age, height, and weight to auto-calculate"}
              </p>
            </div>

            <Button variant="gradient" onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Stats Card */}
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-6">
            <h2 className="font-display font-semibold text-lg text-foreground mb-4">
              Your Stats
            </h2>
            <div className="space-y-4">
              {displayCalorieGoal && (
                <div className="p-4 rounded-xl bg-primary/10">
                  <p className="text-sm text-muted-foreground mb-1">Daily Calorie Goal</p>
                  <p className="font-display font-bold text-2xl text-foreground">{displayCalorieGoal.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {profile.calorie_goal ? "Custom goal" : "Auto-calculated (TDEE)"}
                  </p>
                </div>
              )}

              {bmi && (
                <div className="p-4 rounded-xl bg-muted/30">
                  <p className="text-sm text-muted-foreground mb-1">BMI</p>
                  <p className="font-display font-bold text-2xl text-foreground">{bmi}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {parseFloat(bmi) < 18.5 ? "Underweight" : 
                     parseFloat(bmi) < 25 ? "Normal" : 
                     parseFloat(bmi) < 30 ? "Overweight" : "Obese"}
                  </p>
                </div>
              )}
              
              {profile.height_cm && (
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Height</span>
                  <span className="font-medium">{profile.height_cm} cm</span>
                </div>
              )}
              
              {profile.weight_kg && (
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Weight</span>
                  <span className="font-medium">{profile.weight_kg} kg</span>
                </div>
              )}
              
              {profile.age && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-muted-foreground">Age</span>
                  <span className="font-medium">{profile.age} years</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
