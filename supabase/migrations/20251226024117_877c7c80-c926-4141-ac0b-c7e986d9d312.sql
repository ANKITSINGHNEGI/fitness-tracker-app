-- Add activity_level and calorie_goal fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS activity_level text DEFAULT 'moderate',
ADD COLUMN IF NOT EXISTS calorie_goal integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS gender text DEFAULT NULL;

-- Add constraint for activity_level values
ALTER TABLE public.profiles 
ADD CONSTRAINT valid_activity_level 
CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active'));

-- Add constraint for gender values
ALTER TABLE public.profiles 
ADD CONSTRAINT valid_gender 
CHECK (gender IN ('male', 'female'));