export interface ServiceItem {
  sno: number;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface SalesBillData {
  // Invoice details
  invoiceNumber: string;
  invoiceDate: string;
  
  // Customer details
  customerName: string;
  customerAddress: string;
  customerMobile: string;
  customerState: string;
  
  // Vehicle details (Admin only)
  vehicleModel: string;
  vehicleColor: string;
  hsnSacCode: string;
  chassisNumber: string;
  motorNumber: string;
  
  // Pricing
  taxablePrice: number;
  sgstAmount: number;
  cgstAmount: number;
  exShowroomPrice: number;
  roundedOff: number;
  totalInvoiceAmount: number;
  
  // Battery details
  batteryChemistry: string;
  batteryCapacity: string;
  batteryMake: string;
  batteryManufacturingYear: string;
}

export interface ServiceBillData {
  // From Sales Bill
  customerName: string;
  customerMobile: string;
  vehicleModel: string;
  vehicleNumber: string;
  serviceDate: string;
  
  // Service items
  serviceItems: ServiceItem[];
  
  // Summary
  subTotal: number;
  gstAmount: number;
  applyGst: boolean;
  finalAmount: number;
  
  // Notes
  serviceNotes: string;
  nextServiceDate: string;
}

export interface CompleteBillData {
  salesBill: SalesBillData;
  serviceBill: ServiceBillData;
}

export const COMPANY_DETAILS = {
  name: 'PALANI ANDAVAR E MOTORS',
  address: '4/58E, Salem Attur Main Road, Kothampadi, Attur',
  city: 'Salem Dist, Tamil Nadu – 636109',
  phone: '9626176768',
  gstin: '33DZYPK8024G12Y',
  pan: 'DZYPK8024G',
};
