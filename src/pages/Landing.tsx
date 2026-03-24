import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { 
  Activity, 
  Apple, 
  BarChart3, 
  Target, 
  Zap, 
  Shield, 
  ChevronRight,
  Dumbbell
} from "lucide-react";

const features = [
  {
    icon: Activity,
    title: "Workout Tracking",
    description: "Log and monitor your workouts with detailed metrics and progress tracking.",
  },
  {
    icon: Apple,
    title: "Calorie Monitoring",
    description: "Track your daily calorie intake and maintain a balanced diet effortlessly.",
  },
  {
    icon: BarChart3,
    title: "Progress Analytics",
    description: "Visualize your fitness journey with interactive charts and insights.",
  },
  {
    icon: Target,
    title: "Goal Setting",
    description: "Set personalized fitness goals and track your progress towards them.",
  },
  {
    icon: Zap,
    title: "Real-time Sync",
    description: "Your data syncs instantly across all your devices.",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description: "Your health data is encrypted and never shared with third parties.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 gradient-hero-bg" />
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-foreground/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />
        </div>

        <div className="container mx-auto px-4 pt-20 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 mb-8 animate-fade-in">
              <Zap className="w-4 h-4 text-primary-foreground" />
              <span className="text-sm font-medium text-primary-foreground">Transform your fitness journey today</span>
            </div>
            
            <h1 className="font-display font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-primary-foreground mb-6 leading-tight animate-slide-up">
              Track Your Fitness.
              <br />
              <span className="text-primary-foreground/80">Transform Your Life.</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-primary-foreground/70 max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: '100ms' }}>
              The all-in-one fitness companion that helps you track workouts, monitor calories, 
              and achieve your health goals with powerful analytics.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
              <Button variant="hero" size="xl" asChild>
                <Link to="/signup">
                  Get Started Free
                  <ChevronRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button variant="hero-outline" size="xl" asChild>
                <Link to="/login">Login</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="hsl(var(--background))"/>
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-foreground mb-4">
              Everything You Need to
              <span className="gradient-text"> Succeed</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Powerful features designed to help you reach your fitness goals faster and smarter.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group glass-card rounded-2xl p-6 lg:p-8 hover-lift animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center mb-6 shadow-md group-hover:shadow-glow transition-shadow duration-300">
                    <Icon className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <h3 className="font-display font-semibold text-xl text-foreground mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 gradient-bg" />
            <div className="relative z-10 px-8 py-16 lg:px-16 lg:py-24 text-center">
              <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-primary-foreground mb-6">
                Ready to Transform Your Life?
              </h2>
              <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto mb-10">
                Join thousands of users who have already achieved their fitness goals with FitTrack.
              </p>
              <Button variant="hero-outline" size="xl" asChild>
                <Link to="/signup">
                  Start Your Journey
                  <ChevronRight className="w-5 h-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-xl">FitTrack</span>
            </div>
            <p className="text-muted-foreground text-sm">
              © 2024 FitTrack. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
