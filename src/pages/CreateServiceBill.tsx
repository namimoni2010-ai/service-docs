import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ServiceItemsTable } from '@/components/ServiceItemsTable';
import { generateServiceBillPDF } from '@/lib/pdfGeneratorService';
import { ServiceBillData, ServiceItem } from '@/types/bill';
import { useToast } from '@/hooks/use-toast';
import gauraLogo from '@/assets/gaura-logo.jpg';
import { ArrowLeft, Download, Wrench, FileText } from 'lucide-react';

interface SalesBillOption {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_mobile: string;
  customer_address: string;
  vehicle_model: string;
}

export default function CreateServiceBill() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [logoBase64, setLogoBase64] = useState<string>('');
  const [salesBills, setSalesBills] = useState<SalesBillOption[]>([]);
  const [selectedSalesBill, setSelectedSalesBill] = useState<SalesBillOption | null>(null);

  const [serviceBill, setServiceBill] = useState({
    vehicleNumber: '',
    serviceDate: new Date().toISOString().split('T')[0],
    billNumber: '',
    serviceItems: [] as ServiceItem[],
    applyGst: false,
    roundedOff: 0,
    serviceNotes: '',
    nextServiceDate: '',
  });

  const serviceCalculations = useMemo(() => {
    const subTotal = serviceBill.serviceItems.reduce((sum, item) => sum + item.amount, 0);
    const cgstAmount = serviceBill.applyGst ? subTotal * 0.09 : 0;
    const sgstAmount = serviceBill.applyGst ? subTotal * 0.09 : 0;
    const gstAmount = cgstAmount + sgstAmount;
    const rounded = Number(serviceBill.roundedOff) || 0;
    const finalAmount = subTotal + gstAmount + rounded;
    return { subTotal, cgstAmount, sgstAmount, gstAmount, finalAmount };
  }, [serviceBill.serviceItems, serviceBill.applyGst, serviceBill.roundedOff]);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
    if (!loading && user && !isAdmin) navigate('/dashboard');
  }, [user, loading, isAdmin, navigate]);

  useEffect(() => {
    loadSalesBills();
    loadLogo();
  }, []);

  const loadLogo = async () => {
    try {
      const response = await fetch(gauraLogo);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onload = () => setLogoBase64(reader.result as string);
      reader.readAsDataURL(blob);
    } catch (e) {
      console.error('Failed to load logo:', e);
    }
  };

  const loadSalesBills = async () => {
    const { data, error } = await supabase
      .from('sales_bills')
      .select('id, invoice_number, customer_name, customer_mobile, customer_address, vehicle_model')
      .order('created_at', { ascending: false });
    if (!error && data) setSalesBills(data);
  };

  const handleSalesBillSelect = (billId: string) => {
    const bill = salesBills.find(b => b.id === billId);
    setSelectedSalesBill(bill || null);
  };

  const handleChange = (field: string, value: string | boolean | number | ServiceItem[]) => {
    setServiceBill(prev => ({ ...prev, [field]: value }));
  };

  const handleGeneratePDF = async () => {
    if (!selectedSalesBill) {
      toast({ title: 'Select Sales Bill', description: 'Please select a sales bill.', variant: 'destructive' });
      return;
    }
    if (serviceBill.serviceItems.length === 0) {
      toast({ title: 'Add Items', description: 'Please add at least one item.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const serviceData = {
        sales_bill_id: selectedSalesBill.id,
        service_date: serviceBill.serviceDate,
        vehicle_number: serviceBill.vehicleNumber,
        service_items: JSON.parse(JSON.stringify(serviceBill.serviceItems)),
        sub_total: serviceCalculations.subTotal,
        gst_amount: serviceCalculations.gstAmount,
        apply_gst: serviceBill.applyGst,
        final_amount: serviceCalculations.finalAmount,
        service_notes: serviceBill.serviceNotes,
        next_service_date: serviceBill.nextServiceDate || null,
        created_by: user!.id,
      };
      
      const { error: serviceError } = await supabase.from('service_bills').insert(serviceData);
      if (serviceError) throw serviceError;

      const completeServiceBill: ServiceBillData = {
        customerName: selectedSalesBill.customer_name,
        customerMobile: selectedSalesBill.customer_mobile,
        customerAddress: selectedSalesBill.customer_address || '',
        vehicleModel: selectedSalesBill.vehicle_model,
        vehicleNumber: serviceBill.vehicleNumber,
        serviceDate: serviceBill.serviceDate,
        billNumber: serviceBill.billNumber,
        serviceItems: serviceBill.serviceItems,
        ...serviceCalculations,
        applyGst: serviceBill.applyGst,
        roundedOff: serviceBill.roundedOff,
        serviceNotes: serviceBill.serviceNotes,
        nextServiceDate: serviceBill.nextServiceDate,
      };

      const pdf = generateServiceBillPDF(completeServiceBill, logoBase64);
      pdf.save(`ServiceBill_${selectedSalesBill.invoice_number}.pdf`);

      toast({ title: 'Service Bill Generated!', description: 'Your PDF has been downloaded.' });
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error saving bill:', error);
      toast({ title: 'Error', description: error.message || 'Failed to save bill.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-pulse text-muted-foreground">Loading...</div></div>;
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />Back
            </Button>
            <div className="hidden sm:block">
              <h1 className="font-bold text-foreground">Create Service Bill (Spares)</h1>
              <p className="text-sm text-muted-foreground">
                {selectedSalesBill ? `For: ${selectedSalesBill.customer_name}` : 'Select a customer'}
              </p>
            </div>
          </div>
          <Button onClick={handleGeneratePDF} disabled={saving} className="gap-2">
            <Download className="w-4 h-4" />
            {saving ? 'Generating...' : 'Download PDF'}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Select Sales Bill */}
        <Card className="animate-fade-in">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg"><FileText className="w-5 h-5 text-primary" />Select Customer / Sales Bill</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Sales Bill *</Label>
                <Select onValueChange={handleSalesBillSelect}>
                  <SelectTrigger><SelectValue placeholder="Select a sales bill" /></SelectTrigger>
                  <SelectContent>
                    {salesBills.map((bill) => (
                      <SelectItem key={bill.id} value={bill.id}>
                        {bill.invoice_number} - {bill.customer_name} ({bill.vehicle_model})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedSalesBill && (
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">Customer:</span><span className="ml-2 font-medium">{selectedSalesBill.customer_name}</span></div>
                    <div><span className="text-muted-foreground">Mobile:</span><span className="ml-2 font-medium">{selectedSalesBill.customer_mobile}</span></div>
                    <div><span className="text-muted-foreground">Vehicle:</span><span className="ml-2 font-medium">{selectedSalesBill.vehicle_model}</span></div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Service Details */}
        <Card className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg"><Wrench className="w-5 h-5 text-primary" />Service Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Bill Number</Label>
                <Input value={serviceBill.billNumber} onChange={(e) => handleChange('billNumber', e.target.value)} placeholder="e.g., 60" />
              </div>
              <div className="space-y-2">
                <Label>Service Date</Label>
                <Input type="date" value={serviceBill.serviceDate} onChange={(e) => handleChange('serviceDate', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Vehicle Number</Label>
                <Input value={serviceBill.vehicleNumber} onChange={(e) => handleChange('vehicleNumber', e.target.value)} placeholder="e.g., TN 30 AB 1234" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Service Items</Label>
              <ServiceItemsTable items={serviceBill.serviceItems} onChange={(items) => handleChange('serviceItems', items)} />
            </div>

            {serviceBill.serviceItems.length > 0 && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-3 max-w-md ml-auto">
                <div className="flex justify-between"><span>Sub Total:</span><span>₹{serviceCalculations.subTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch checked={serviceBill.applyGst} onCheckedChange={(checked) => handleChange('applyGst', checked)} />
                    <span>Apply GST (C.GST 9% + S.GST 9%)</span>
                  </div>
                </div>
                {serviceBill.applyGst && (
                  <>
                    <div className="flex justify-between text-sm"><span>C.GST 9%:</span><span>₹{serviceCalculations.cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                    <div className="flex justify-between text-sm"><span>S.GST 9%:</span><span>₹{serviceCalculations.sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                  </>
                )}
                <div className="space-y-2">
                  <Label className="text-sm">Round Off (₹)</Label>
                  <Input type="number" step="0.01" value={serviceBill.roundedOff || ''} onChange={(e) => handleChange('roundedOff', Number(e.target.value))} placeholder="0.00" />
                </div>
                <div className="border-t border-border pt-3">
                  <div className="flex justify-between font-bold text-lg text-primary"><span>Total:</span><span>₹{serviceCalculations.finalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Service Notes / Remarks</Label>
              <Textarea value={serviceBill.serviceNotes} onChange={(e) => handleChange('serviceNotes', e.target.value)} placeholder="Enter any service notes..." className="min-h-[100px]" />
            </div>
          </CardContent>
        </Card>

        <div className="sticky bottom-4 z-10">
          <Button onClick={handleGeneratePDF} disabled={saving || !selectedSalesBill} className="w-full gap-2 h-12 text-lg shadow-lg" size="lg">
            <FileText className="w-5 h-5" />
            {saving ? 'Creating Bill...' : 'Create Service Bill & Download PDF'}
          </Button>
        </div>
      </main>
    </div>
  );
}
