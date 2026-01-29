import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Zap, 
  Plus, 
  FileText, 
  LogOut, 
  User,
  Receipt,
  Wrench,
  TrendingUp
} from 'lucide-react';

interface DashboardStats {
  totalSalesBills: number;
  totalServiceBills: number;
  totalRevenue: number;
}

export default function Dashboard() {
  const { user, isAdmin, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalSalesBills: 0,
    totalServiceBills: 0,
    totalRevenue: 0,
  });
  const [recentBills, setRecentBills] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchStats();
      fetchRecentBills();
    }
  }, [user, isAdmin]);

  const fetchStats = async () => {
    // Fetch sales bills count and total
    const { data: salesBills } = await supabase
      .from('sales_bills')
      .select('total_invoice_amount');
    
    // Fetch service bills count and total
    const { data: serviceBills } = await supabase
      .from('service_bills')
      .select('final_amount');
    
    if (salesBills) {
      const salesTotal = salesBills.reduce((sum, bill) => sum + Number(bill.total_invoice_amount), 0);
      const serviceTotal = serviceBills?.reduce((sum, bill) => sum + Number(bill.final_amount), 0) || 0;
      
      setStats({
        totalSalesBills: salesBills.length,
        totalServiceBills: serviceBills?.length || 0,
        totalRevenue: salesTotal + serviceTotal,
      });
    }
  };

  const fetchRecentBills = async () => {
    const { data } = await supabase
      .from('sales_bills')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (data) {
      setRecentBills(data);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mx-auto mb-4">
              <User className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle>Access Restricted</CardTitle>
            <CardDescription>
              You don't have admin access to this system. Please contact an administrator.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleSignOut} variant="outline" className="w-full">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-foreground">Palani Andavar E Motors</h1>
              <p className="text-sm text-muted-foreground">Billing Management</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {user?.email}
            </span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="animate-fade-in">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Sales Bills
              </CardTitle>
              <Receipt className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSalesBills}</div>
            </CardContent>
          </Card>
          
          <Card className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Service Bills
              </CardTitle>
              <Wrench className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalServiceBills}</div>
            </CardContent>
          </Card>
          
          <Card className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Revenue
              </CardTitle>
              <TrendingUp className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{stats.totalRevenue.toLocaleString('en-IN')}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer animate-slide-in" onClick={() => navigate('/create-sales-bill')}>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Receipt className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Create Sales Bill</CardTitle>
                  <CardDescription>Generate sales bill PDF</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer animate-slide-in" style={{ animationDelay: '0.1s' }} onClick={() => navigate('/create-service-bill')}>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Wrench className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Create Service Bill</CardTitle>
                  <CardDescription>Generate service bill PDF</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer animate-slide-in" style={{ animationDelay: '0.2s' }} onClick={() => navigate('/bills')}>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
                  <FileText className="w-6 h-6 text-secondary-foreground" />
                </div>
                <div>
                  <CardTitle>View All Bills</CardTitle>
                  <CardDescription>Browse and manage existing bills</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Recent Bills */}
        <Card className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <CardHeader>
            <CardTitle>Recent Bills</CardTitle>
            <CardDescription>Your latest sales bills</CardDescription>
          </CardHeader>
          <CardContent>
            {recentBills.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No bills created yet</p>
                <Button 
                  variant="link" 
                  onClick={() => navigate('/create-bill')}
                  className="mt-2"
                >
                  Create your first bill
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentBills.map((bill) => (
                  <div 
                    key={bill.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div>
                      <p className="font-medium">{bill.invoice_number}</p>
                      <p className="text-sm text-muted-foreground">{bill.customer_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">
                        ₹{Number(bill.total_invoice_amount).toLocaleString('en-IN')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(bill.invoice_date).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
