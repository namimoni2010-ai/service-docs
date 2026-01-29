import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { generateSalesBillPDF } from '@/lib/pdfGeneratorSales';
import { SalesBillData } from '@/types/bill';
import { useToast } from '@/hooks/use-toast';
import gauraLogo from '@/assets/gaura-logo.jpg';
import { 
  ArrowLeft, 
  Download, 
  User, 
  Car, 
  Calculator, 
  Battery,
  FileText,
  Phone,
  MapPin
} from 'lucide-react';

export default function CreateSalesBill() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [logoBase64, setLogoBase64] = useState<string>('');

  // Generate invoice number
  const [invoiceNumber, setInvoiceNumber] = useState('');
  
  // Sales Bill State
  const [salesBill, setSalesBill] = useState<Omit<SalesBillData, 'sgstAmount' | 'cgstAmount' | 'exShowroomPrice' | 'totalInvoiceAmount'>>({
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    customerName: '',
    customerAddress: '',
    customerMobile: '',
    customerState: 'Tamil Nadu',
    vehicleModel: '',
    vehicleColor: '',
    hsnSacCode: '87119091',
    chassisNumber: '',
    motorNumber: '',
    taxablePrice: 0,
    roundedOff: 0,
    batteryChemistry: '',
    batteryCapacity: '',
    batteryMake: '',
    batteryManufacturingYear: '',
  });

  // Calculated values
  const calculations = useMemo(() => {
    const taxable = Number(salesBill.taxablePrice) || 0;
    const sgst = taxable * 0.025;
    const cgst = taxable * 0.025;
    const exShowroom = taxable + sgst + cgst;
    const rounded = Number(salesBill.roundedOff) || 0;
    const total = exShowroom + rounded;

    return {
      sgstAmount: sgst,
      cgstAmount: cgst,
      exShowroomPrice: exShowroom,
      totalInvoiceAmount: total,
    };
  }, [salesBill.taxablePrice, salesBill.roundedOff]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
    if (!loading && user && !isAdmin) {
      navigate('/dashboard');
    }
  }, [user, loading, isAdmin, navigate]);

  useEffect(() => {
    generateInvoiceNumber();
    loadLogo();
  }, []);

  const loadLogo = async () => {
    try {
      const response = await fetch(gauraLogo);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onload = () => {
        setLogoBase64(reader.result as string);
      };
      reader.readAsDataURL(blob);
    } catch (e) {
      console.error('Failed to load logo:', e);
    }
  };

  const generateInvoiceNumber = async () => {
    const year = new Date().getFullYear();
    const { data: lastBill } = await supabase
      .from('sales_bills')
      .select('invoice_number')
      .like('invoice_number', `INV-${year}-%`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let nextNum = 1;
    if (lastBill?.invoice_number) {
      const match = lastBill.invoice_number.match(/INV-\d{4}-(\d+)/);
      if (match) {
        nextNum = parseInt(match[1]) + 1;
      }
    }

    const newInvoiceNumber = `INV-${year}-${String(nextNum).padStart(4, '0')}`;
    setInvoiceNumber(newInvoiceNumber);
    setSalesBill(prev => ({ ...prev, invoiceNumber: newInvoiceNumber }));
  };

  const handleSalesBillChange = (field: string, value: string | number) => {
    setSalesBill(prev => ({ ...prev, [field]: value }));
  };

  const handleGeneratePDF = async () => {
    // Validate required fields
    if (!salesBill.customerName || !salesBill.customerAddress || !salesBill.customerMobile) {
      toast({
        title: 'Missing Customer Details',
        description: 'Please fill in all customer details.',
        variant: 'destructive',
      });
      return;
    }

    if (!salesBill.vehicleModel || !salesBill.chassisNumber || !salesBill.motorNumber) {
      toast({
        title: 'Missing Vehicle Details',
        description: 'Please fill in all vehicle details.',
        variant: 'destructive',
      });
      return;
    }

    if (!salesBill.taxablePrice || salesBill.taxablePrice <= 0) {
      toast({
        title: 'Invalid Price',
        description: 'Please enter a valid taxable price.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      // Save sales bill to database
      const { error: salesError } = await supabase
        .from('sales_bills')
        .insert({
          invoice_number: salesBill.invoiceNumber,
          invoice_date: salesBill.invoiceDate,
          customer_name: salesBill.customerName,
          customer_address: salesBill.customerAddress,
          customer_mobile: salesBill.customerMobile,
          customer_state: salesBill.customerState,
          vehicle_model: salesBill.vehicleModel,
          vehicle_color: salesBill.vehicleColor,
          hsn_sac_code: salesBill.hsnSacCode,
          chassis_number: salesBill.chassisNumber,
          motor_number: salesBill.motorNumber,
          taxable_price: salesBill.taxablePrice,
          sgst_amount: calculations.sgstAmount,
          cgst_amount: calculations.cgstAmount,
          ex_showroom_price: calculations.exShowroomPrice,
          rounded_off: salesBill.roundedOff,
          total_invoice_amount: calculations.totalInvoiceAmount,
          battery_chemistry: salesBill.batteryChemistry,
          battery_capacity: salesBill.batteryCapacity,
          battery_make: salesBill.batteryMake,
          battery_manufacturing_year: salesBill.batteryManufacturingYear,
          created_by: user!.id,
        });

      if (salesError) throw salesError;

      // Generate PDF
      const completeSalesBill: SalesBillData = {
        ...salesBill,
        ...calculations,
      };

      const pdf = generateSalesBillPDF(completeSalesBill, logoBase64);
      pdf.save(`${salesBill.invoiceNumber}_SalesBill.pdf`);

      toast({
        title: 'Sales Bill Generated!',
        description: 'Your PDF has been downloaded.',
      });

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error saving bill:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save bill. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="hidden sm:block">
              <h1 className="font-bold text-foreground">Create Sales Bill</h1>
              <p className="text-sm text-muted-foreground">{invoiceNumber}</p>
            </div>
          </div>
          <Button onClick={handleGeneratePDF} disabled={saving} className="gap-2">
            <Download className="w-4 h-4" />
            {saving ? 'Generating...' : 'Download PDF'}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Invoice Details */}
        <Card className="animate-fade-in">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5 text-primary" />
              Invoice Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Invoice Number</Label>
                <Input
                  value={salesBill.invoiceNumber}
                  onChange={(e) => handleSalesBillChange('invoiceNumber', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Invoice Date</Label>
                <Input
                  type="date"
                  value={salesBill.invoiceDate}
                  onChange={(e) => handleSalesBillChange('invoiceDate', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Details */}
        <Card className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="w-5 h-5 text-primary" />
              Customer Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Customer Name *</Label>
                <Input
                  value={salesBill.customerName}
                  onChange={(e) => handleSalesBillChange('customerName', e.target.value)}
                  placeholder="Enter customer name"
                />
              </div>
              <div className="space-y-2">
                <Label>Mobile Number *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={salesBill.customerMobile}
                    onChange={(e) => handleSalesBillChange('customerMobile', e.target.value)}
                    placeholder="Enter mobile number"
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Address *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Textarea
                    value={salesBill.customerAddress}
                    onChange={(e) => handleSalesBillChange('customerAddress', e.target.value)}
                    placeholder="Enter complete address"
                    className="pl-10 min-h-[80px]"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Input
                  value={salesBill.customerState}
                  onChange={(e) => handleSalesBillChange('customerState', e.target.value)}
                  placeholder="Enter state"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Details (Admin Only) */}
        <Card className="animate-fade-in border-2 border-primary/20" style={{ animationDelay: '0.2s' }}>
          <CardHeader className="pb-4 bg-primary/5">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Car className="w-5 h-5 text-primary" />
              Vehicle Details
              <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full ml-2">
                Admin Only
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Model *</Label>
                <Input
                  value={salesBill.vehicleModel}
                  onChange={(e) => handleSalesBillChange('vehicleModel', e.target.value)}
                  placeholder="e.g., Sniper 5G"
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <Input
                  value={salesBill.vehicleColor}
                  onChange={(e) => handleSalesBillChange('vehicleColor', e.target.value)}
                  placeholder="e.g., Green + Black"
                />
              </div>
              <div className="space-y-2">
                <Label>HSN/SAC Code</Label>
                <Input
                  value={salesBill.hsnSacCode}
                  onChange={(e) => handleSalesBillChange('hsnSacCode', e.target.value)}
                  placeholder="e.g., 87119091"
                />
              </div>
              <div className="space-y-2">
                <Label>Chassis Number *</Label>
                <Input
                  value={salesBill.chassisNumber}
                  onChange={(e) => handleSalesBillChange('chassisNumber', e.target.value)}
                  placeholder="Enter chassis number"
                />
              </div>
              <div className="space-y-2">
                <Label>Motor Number *</Label>
                <Input
                  value={salesBill.motorNumber}
                  onChange={(e) => handleSalesBillChange('motorNumber', e.target.value)}
                  placeholder="Enter motor number"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Section */}
        <Card className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calculator className="w-5 h-5 text-primary" />
              Pricing Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Taxable Price (₹) *</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={salesBill.taxablePrice || ''}
                    onChange={(e) => handleSalesBillChange('taxablePrice', Number(e.target.value))}
                    placeholder="Enter taxable price"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Rounded Off (₹)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={salesBill.roundedOff || ''}
                    onChange={(e) => handleSalesBillChange('roundedOff', Number(e.target.value))}
                    placeholder="Enter rounded off amount"
                  />
                </div>
              </div>
              
              <div className="bg-invoice-section rounded-lg p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Taxable Price:</span>
                  <span>₹{salesBill.taxablePrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>SGST @ 2.5%:</span>
                  <span>₹{calculations.sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>CGST @ 2.5%:</span>
                  <span>₹{calculations.cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Ex-Showroom Price:</span>
                  <span>₹{calculations.exShowroomPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Rounded Off:</span>
                  <span>₹{salesBill.roundedOff.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="border-t border-border pt-3 mt-3">
                  <div className="flex justify-between font-bold text-lg text-primary">
                    <span>Total Invoice Amount:</span>
                    <span>₹{calculations.totalInvoiceAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Battery Details */}
        <Card className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Battery className="w-5 h-5 text-primary" />
              Battery Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Battery Chemistry</Label>
                <Input
                  value={salesBill.batteryChemistry}
                  onChange={(e) => handleSalesBillChange('batteryChemistry', e.target.value)}
                  placeholder="e.g., Lithium-ion"
                />
              </div>
              <div className="space-y-2">
                <Label>Battery Capacity</Label>
                <Input
                  value={salesBill.batteryCapacity}
                  onChange={(e) => handleSalesBillChange('batteryCapacity', e.target.value)}
                  placeholder="e.g., 60V 30Ah"
                />
              </div>
              <div className="space-y-2">
                <Label>Battery Make</Label>
                <Input
                  value={salesBill.batteryMake}
                  onChange={(e) => handleSalesBillChange('batteryMake', e.target.value)}
                  placeholder="e.g., Samsung"
                />
              </div>
              <div className="space-y-2">
                <Label>Manufacturing Year</Label>
                <Input
                  value={salesBill.batteryManufacturingYear}
                  onChange={(e) => handleSalesBillChange('batteryManufacturingYear', e.target.value)}
                  placeholder="e.g., 2024"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Generate Button (Mobile Sticky) */}
        <div className="fixed bottom-4 left-4 right-4 md:relative md:bottom-auto md:left-auto md:right-auto">
          <Button 
            onClick={handleGeneratePDF} 
            disabled={saving} 
            className="w-full md:w-auto gap-2 h-12 text-lg shadow-lg md:shadow-none"
            size="lg"
          >
            <Download className="w-5 h-5" />
            {saving ? 'Generating PDF...' : 'Generate & Download PDF'}
          </Button>
        </div>
      </main>
    </div>
  );
}
