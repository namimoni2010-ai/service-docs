import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { generateBillPDF } from '@/lib/pdfGenerator';
import { CompleteBillData, ServiceItem } from '@/types/bill';
import { 
  ArrowLeft, 
  Search, 
  Download, 
  FileText,
  Calendar,
  User
} from 'lucide-react';

interface SalesBill {
  id: string;
  invoice_number: string;
  invoice_date: string;
  customer_name: string;
  customer_address: string;
  customer_mobile: string;
  customer_state: string;
  vehicle_model: string;
  vehicle_color: string;
  hsn_sac_code: string;
  chassis_number: string;
  motor_number: string;
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

interface ServiceBill {
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
  const [bills, setBills] = useState<SalesBill[]>([]);
  const [serviceBillsMap, setServiceBillsMap] = useState<Record<string, ServiceBill>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingBills, setLoadingBills] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
    if (!loading && user && !isAdmin) {
      navigate('/dashboard');
    }
  }, [user, loading, isAdmin, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchBills();
    }
  }, [user, isAdmin]);

  const fetchBills = async () => {
    setLoadingBills(true);
    
    const { data: salesBills, error } = await supabase
      .from('sales_bills')
      .select('*')
      .order('created_at', { ascending: false });

    if (salesBills && !error) {
      setBills(salesBills);

      // Fetch associated service bills
      const { data: serviceBills } = await supabase
        .from('service_bills')
        .select('*');

      if (serviceBills) {
        const map: Record<string, ServiceBill> = {};
        serviceBills.forEach((sb) => {
          map[sb.sales_bill_id] = {
            ...sb,
            service_items: (sb.service_items as unknown as ServiceItem[]) || [],
          };
        });
        setServiceBillsMap(map);
      }
    }

    setLoadingBills(false);
  };

  const handleDownloadPDF = (bill: SalesBill) => {
    const serviceBill = serviceBillsMap[bill.id];

    const completeBillData: CompleteBillData = {
      salesBill: {
        invoiceNumber: bill.invoice_number,
        invoiceDate: bill.invoice_date,
        customerName: bill.customer_name,
        customerAddress: bill.customer_address,
        customerMobile: bill.customer_mobile,
        customerState: bill.customer_state,
        vehicleModel: bill.vehicle_model,
        vehicleColor: bill.vehicle_color,
        hsnSacCode: bill.hsn_sac_code,
        chassisNumber: bill.chassis_number,
        motorNumber: bill.motor_number,
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
      },
      serviceBill: {
        customerName: bill.customer_name,
        customerMobile: bill.customer_mobile,
        vehicleModel: bill.vehicle_model,
        vehicleNumber: serviceBill?.vehicle_number || '',
        serviceDate: serviceBill?.service_date || bill.invoice_date,
        serviceItems: serviceBill?.service_items || [],
        subTotal: serviceBill ? Number(serviceBill.sub_total) : 0,
        gstAmount: serviceBill ? Number(serviceBill.gst_amount) : 0,
        applyGst: serviceBill?.apply_gst || false,
        finalAmount: serviceBill ? Number(serviceBill.final_amount) : 0,
        serviceNotes: serviceBill?.service_notes || '',
        nextServiceDate: serviceBill?.next_service_date || '',
      },
    };

    const pdf = generateBillPDF(completeBillData);
    pdf.save(`${bill.invoice_number}_Bill.pdf`);
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

  if (loading || loadingBills) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="hidden sm:block">
              <h1 className="font-bold text-foreground">All Bills</h1>
              <p className="text-sm text-muted-foreground">{bills.length} total bills</p>
            </div>
          </div>
          <Button onClick={() => navigate('/create-bill')}>
            Create New Bill
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by invoice number, customer name, mobile, or vehicle model..."
            className="pl-10"
          />
        </div>

        {/* Bills List */}
        {filteredBills.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                {searchQuery ? 'No bills match your search' : 'No bills created yet'}
              </p>
              {!searchQuery && (
                <Button
                  variant="link"
                  onClick={() => navigate('/create-bill')}
                  className="mt-2"
                >
                  Create your first bill
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredBills.map((bill) => (
              <Card key={bill.id} className="hover:shadow-md transition-shadow animate-fade-in">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">{bill.invoice_number}</span>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                          {bill.vehicle_model}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {bill.customer_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(bill.invoice_date).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold text-lg text-primary">
                          ₹{Number(bill.total_invoice_amount).toLocaleString('en-IN')}
                        </p>
                        {serviceBillsMap[bill.id] && (
                          <p className="text-xs text-muted-foreground">
                            +₹{Number(serviceBillsMap[bill.id].final_amount).toLocaleString('en-IN')} service
                          </p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadPDF(bill)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
