import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, FileText, Shield, Download, ArrowRight } from 'lucide-react';

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10" />
        <div className="relative container mx-auto px-4 py-20">
          <div className="text-center max-w-3xl mx-auto animate-fade-in">
            {/* Logo */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
              <Zap className="w-10 h-10 text-primary" />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Palani Andavar E Motors
            </h1>
            <p className="text-xl text-muted-foreground mb-2">
              Billing Management System
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              4/58E, Salem Attur Main Road, Kothampadi, Attur, Salem Dist, Tamil Nadu – 636109
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" onClick={() => navigate('/auth')} className="gap-2">
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/auth')}>
                Admin Login
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center text-foreground mb-12">
            Features
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="animate-slide-in">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Professional Bills</CardTitle>
                <CardDescription>
                  Generate GST-compliant sales and service bills with automatic tax calculations
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="animate-slide-in" style={{ animationDelay: '0.1s' }}>
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Admin Control</CardTitle>
                <CardDescription>
                  Secure admin-only access for vehicle details and pricing management
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="animate-slide-in" style={{ animationDelay: '0.2s' }}>
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Download className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>PDF Export</CardTitle>
                <CardDescription>
                  Download professional 2-page PDF bills with complete sales and service details
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            &copy; {new Date().getFullYear()} Palani Andavar E Motors. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Phone: 9626176768
          </p>
        </div>
      </footer>
    </div>
  );
}
