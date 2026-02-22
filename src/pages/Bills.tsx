import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { generateSalesBillPDF } from '@/lib/pdfGeneratorSales';
import { generateServiceBillPDF } from '@/lib/pdfGeneratorService';
import { SalesBillData, ServiceBillData, ServiceItem } from '@/types/bill';
import { useToast } from '@/hooks/use-toast';
import gauraLogo from '@/assets/gaura-logo.jpg';
import { 
  ArrowLeft, Search, Download, FileText, Calendar, User, Trash2, Eye
} from 'lucide-react';

interface SalesBill {
  id: string;
  invoice_number: string;
  invoice_date: string;
  customer_name: string;
  customer_address: string;
  customer_mobile: string;
  customer_state: string;
  customer_pan: string | null;
  customer_gst: string | null;
  vehicle_model: string;
  vehicle_color: string;
  hsn_sac_code: string;
  chassis_number: string;
  motor_number: string;
  controller_number: string | null;
  battery_number: string | null;
  charger_number: string | null;
  taxable_price: number;
  sgst_amount: number;
  cgst_amount: number;
  ex_showroom_price: number;
  rounded_off: number;
  total_invoice_amount: number;
  battery_chemistry: string | null;
  battery_capacity: string | null;
  battery_make: string | null;
  battery_manufacturing_year: string | null;
  created_at: string;
}

interface ServiceBillRow {
  id: string;
  sales_bill_id: string;
  service_date: string;
  vehicle_number: string | null;
  service_items: ServiceItem[];
  sub_total: number;
  gst_amount: number;
  apply_gst: boolean;
  final_amount: number;
  service_notes: string | null;
  next_service_date: string | null;
}

export default function Bills() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bills, setBills] = useState<SalesBill[]>([]);
  const [serviceBillsMap, setServiceBillsMap] = useState<Record<string, ServiceBillRow>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingBills, setLoadingBills] = useState(true);
  const [logoBase64, setLogoBase64] = useState<string>('');
  const [selectedBill, setSelectedBill] = useState<SalesBill | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
    if (!loading && user && !isAdmin) navigate('/dashboard');
  }, [user, loading, isAdmin, navigate]);

  useEffect(() => {
    if (user && isAdmin) fetchBills();
    loadLogo();
  }, [user, isAdmin]);

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

  const fetchBills = async () => {
    setLoadingBills(true);
    const { data: salesBills, error } = await supabase
      .from('sales_bills')
      .select('*')
      .order('created_at', { ascending: false });

    if (salesBills && !error) {
      setBills(salesBills as unknown as SalesBill[]);
      const { data: serviceBills } = await supabase.from('service_bills').select('*');
      if (serviceBills) {
        const map: Record<string, ServiceBillRow> = {};
        serviceBills.forEach((sb) => {
          map[sb.sales_bill_id] = { ...sb, service_items: (sb.service_items as unknown as ServiceItem[]) || [] };
        });
        setServiceBillsMap(map);
      }
    }
    setLoadingBills(false);
  };

  const handleDeleteBill = async (bill: SalesBill) => {
    try {
      // Delete service bill first if exists
      if (serviceBillsMap[bill.id]) {
        await supabase.from('service_bills').delete().eq('sales_bill_id', bill.id);
      }
      const { error } = await supabase.from('sales_bills').delete().eq('id', bill.id);
      if (error) throw error;
      toast({ title: 'Bill Deleted', description: `Bill ${bill.invoice_number} has been deleted.` });
      setBills(prev => prev.filter(b => b.id !== bill.id));
      const newMap = { ...serviceBillsMap };
      delete newMap[bill.id];
      setServiceBillsMap(newMap);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to delete bill.', variant: 'destructive' });
    }
  };

  const handleDownloadSalesPDF = (bill: SalesBill) => {
    const salesBillData: SalesBillData = {
      invoiceNumber: bill.invoice_number,
      invoiceDate: bill.invoice_date,
      customerName: bill.customer_name,
      customerAddress: bill.customer_address,
      customerMobile: bill.customer_mobile,
      customerState: bill.customer_state,
      customerPan: bill.customer_pan || '',
      customerGst: bill.customer_gst || '',
      vehicleModel: bill.vehicle_model,
      vehicleColor: bill.vehicle_color,
      hsnSacCode: bill.hsn_sac_code,
      chassisNumber: bill.chassis_number,
      motorNumber: bill.motor_number,
      controllerNumber: bill.controller_number || '',
      batteryNumber: bill.battery_number || '',
      chargerNumber: bill.charger_number || '',
      taxablePrice: Number(bill.taxable_price),
      sgstAmount: Number(bill.sgst_amount),
      cgstAmount: Number(bill.cgst_amount),
      exShowroomPrice: Number(bill.ex_showroom_price),
      roundedOff: Number(bill.rounded_off),
      totalInvoiceAmount: Number(bill.total_invoice_amount),
      batteryChemistry: bill.battery_chemistry || '',
      batteryCapacity: bill.battery_capacity || '',
      batteryMake: bill.battery_make || '',
      batteryManufacturingYear: bill.battery_manufacturing_year || '',
    };
    const pdf = generateSalesBillPDF(salesBillData, logoBase64);
    pdf.save(`${bill.invoice_number}_SalesBill.pdf`);
  };

  const handleDownloadServicePDF = (bill: SalesBill) => {
    const serviceBill = serviceBillsMap[bill.id];
    if (!serviceBill) return;
    const gstAmount = Number(serviceBill.gst_amount);
    const serviceBillData: ServiceBillData = {
      customerName: bill.customer_name,
      customerMobile: bill.customer_mobile,
      customerAddress: bill.customer_address,
      vehicleModel: bill.vehicle_model,
      vehicleNumber: serviceBill.vehicle_number || '',
      serviceDate: serviceBill.service_date,
      billNumber: '',
      serviceItems: serviceBill.service_items,
      subTotal: Number(serviceBill.sub_total),
      cgstAmount: gstAmount / 2,
      sgstAmount: gstAmount / 2,
      gstAmount: gstAmount,
      applyGst: serviceBill.apply_gst,
      roundedOff: 0,
      finalAmount: Number(serviceBill.final_amount),
      serviceNotes: serviceBill.service_notes || '',
      nextServiceDate: serviceBill.next_service_date || '',
    };
    const pdf = generateServiceBillPDF(serviceBillData, logoBase64);
    pdf.save(`${bill.invoice_number}_ServiceBill.pdf`);
  };

  const filteredBills = bills.filter((bill) => {
    const query = searchQuery.toLowerCase();
    return (
      bill.invoice_number.toLowerCase().includes(query) ||
      bill.customer_name.toLowerCase().includes(query) ||
      bill.customer_mobile.includes(query) ||
      bill.vehicle_model.toLowerCase().includes(query)
    );
  });

  const openDetail = (bill: SalesBill) => {
    setSelectedBill(bill);
    setDetailOpen(true);
  };

  if (loading || loadingBills) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-pulse text-muted-foreground">Loading...</div></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />Back
            </Button>
            <div className="hidden sm:block">
              <h1 className="font-bold text-foreground">All Bills</h1>
              <p className="text-sm text-muted-foreground">{bills.length} total bills</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by invoice number, customer name, mobile, or vehicle model..." className="pl-10" />
        </div>

        {filteredBills.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">{searchQuery ? 'No bills match your search' : 'No bills created yet'}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredBills.map((bill) => (
              <Card key={bill.id} className="hover:shadow-md transition-shadow animate-fade-in">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1 cursor-pointer flex-1" onClick={() => openDetail(bill)}>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">{bill.invoice_number}</span>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">{bill.vehicle_model}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><User className="w-3 h-3" />{bill.customer_name}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(bill.invoice_date).toLocaleDateString('en-IN')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-lg text-primary mr-2">₹{Number(bill.total_invoice_amount).toLocaleString('en-IN')}</p>
                      <Button variant="outline" size="sm" onClick={() => openDetail(bill)} title="View Details">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDownloadSalesPDF(bill)} title="Download Sales PDF">
                        <Download className="w-4 h-4 mr-1" />Sales
                      </Button>
                      {serviceBillsMap[bill.id] && (
                        <Button variant="outline" size="sm" onClick={() => handleDownloadServicePDF(bill)} title="Download Service PDF">
                          <Download className="w-4 h-4 mr-1" />Service
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10" title="Delete Bill">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Bill?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete bill <strong>{bill.invoice_number}</strong> for <strong>{bill.customer_name}</strong>. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteBill(bill)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Bill Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Bill Details — {selectedBill?.invoice_number}
            </DialogTitle>
          </DialogHeader>
          {selectedBill && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/50">
                <div><span className="text-muted-foreground">Invoice No:</span><span className="ml-2 font-medium">{selectedBill.invoice_number}</span></div>
                <div><span className="text-muted-foreground">Date:</span><span className="ml-2 font-medium">{new Date(selectedBill.invoice_date).toLocaleDateString('en-IN')}</span></div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Customer Details</h4>
                <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-muted/50">
                  <div><span className="text-muted-foreground">Name:</span><span className="ml-2 font-medium">{selectedBill.customer_name}</span></div>
                  <div><span className="text-muted-foreground">Mobile:</span><span className="ml-2 font-medium">{selectedBill.customer_mobile}</span></div>
                  <div className="col-span-2"><span className="text-muted-foreground">Address:</span><span className="ml-2 font-medium">{selectedBill.customer_address}</span></div>
                  <div><span className="text-muted-foreground">State:</span><span className="ml-2 font-medium">{selectedBill.customer_state}</span></div>
                  {selectedBill.customer_pan && <div><span className="text-muted-foreground">PAN:</span><span className="ml-2 font-medium">{selectedBill.customer_pan}</span></div>}
                  {selectedBill.customer_gst && <div><span className="text-muted-foreground">GST:</span><span className="ml-2 font-medium">{selectedBill.customer_gst}</span></div>}
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Vehicle Details</h4>
                <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-muted/50">
                  <div><span className="text-muted-foreground">Model:</span><span className="ml-2 font-medium">{selectedBill.vehicle_model}</span></div>
                  <div><span className="text-muted-foreground">Color:</span><span className="ml-2 font-medium">{selectedBill.vehicle_color}</span></div>
                  <div><span className="text-muted-foreground">Chassis No:</span><span className="ml-2 font-medium">{selectedBill.chassis_number}</span></div>
                  <div><span className="text-muted-foreground">Motor No:</span><span className="ml-2 font-medium">{selectedBill.motor_number}</span></div>
                  {selectedBill.controller_number && <div><span className="text-muted-foreground">Controller No:</span><span className="ml-2 font-medium">{selectedBill.controller_number}</span></div>}
                  {selectedBill.battery_number && <div><span className="text-muted-foreground">Battery No:</span><span className="ml-2 font-medium">{selectedBill.battery_number}</span></div>}
                  {selectedBill.charger_number && <div><span className="text-muted-foreground">Charger No:</span><span className="ml-2 font-medium">{selectedBill.charger_number}</span></div>}
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Pricing</h4>
                <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                  <div className="flex justify-between"><span className="text-muted-foreground">Taxable Price:</span><span>₹{Number(selectedBill.taxable_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">SGST:</span><span>₹{Number(selectedBill.sgst_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">CGST:</span><span>₹{Number(selectedBill.cgst_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Ex-Showroom:</span><span>₹{Number(selectedBill.ex_showroom_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                  <div className="flex justify-between border-t border-border pt-2 font-bold text-primary"><span>Total:</span><span>₹{Number(selectedBill.total_invoice_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                </div>
              </div>
              {(selectedBill.battery_chemistry || selectedBill.battery_capacity) && (
                <div>
                  <h4 className="font-semibold mb-2">Battery Details</h4>
                  <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-muted/50">
                    {selectedBill.battery_chemistry && <div><span className="text-muted-foreground">Chemistry:</span><span className="ml-2 font-medium">{selectedBill.battery_chemistry}</span></div>}
                    {selectedBill.battery_capacity && <div><span className="text-muted-foreground">Capacity:</span><span className="ml-2 font-medium">{selectedBill.battery_capacity}</span></div>}
                    {selectedBill.battery_make && <div><span className="text-muted-foreground">Make:</span><span className="ml-2 font-medium">{selectedBill.battery_make}</span></div>}
                    {selectedBill.battery_manufacturing_year && <div><span className="text-muted-foreground">Mfg Year:</span><span className="ml-2 font-medium">{selectedBill.battery_manufacturing_year}</span></div>}
                  </div>
                </div>
              )}
              {serviceBillsMap[selectedBill.id] && (
                <div>
                  <h4 className="font-semibold mb-2">Service Bill</h4>
                  <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                    <div className="flex justify-between"><span className="text-muted-foreground">Service Date:</span><span>{new Date(serviceBillsMap[selectedBill.id].service_date).toLocaleDateString('en-IN')}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Items:</span><span>{serviceBillsMap[selectedBill.id].service_items.length} items</span></div>
                    <div className="flex justify-between font-bold"><span>Service Total:</span><span>₹{Number(serviceBillsMap[selectedBill.id].final_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                  </div>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <Button onClick={() => handleDownloadSalesPDF(selectedBill)} className="flex-1 gap-2">
                  <Download className="w-4 h-4" />Sales PDF
                </Button>
                {serviceBillsMap[selectedBill.id] && (
                  <Button onClick={() => handleDownloadServicePDF(selectedBill)} variant="outline" className="flex-1 gap-2">
                    <Download className="w-4 h-4" />Service PDF
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
