export interface ServiceItem {
  sno: number;
  description: string;
  hsnCode: string;
  quantity: number;
  rate: number;
  gst: number;
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
  customerPan: string;
  customerGst: string;
  
  // Vehicle details
  vehicleModel: string;
  vehicleColor: string;
  hsnSacCode: string;
  chassisNumber: string;
  motorNumber: string;
  controllerNumber: string;
  batteryNumber: string;
  chargerNumber: string;
  
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
  customerName: string;
  customerMobile: string;
  customerAddress: string;
  vehicleModel: string;
  vehicleNumber: string;
  serviceDate: string;
  billNumber: string;
  
  // Service items
  serviceItems: ServiceItem[];
  
  // Summary
  subTotal: number;
  cgstAmount: number;
  sgstAmount: number;
  gstAmount: number;
  applyGst: boolean;
  roundedOff: number;
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
  city: 'SALEM DIST, TAMILNADU – 636109. TEL: 9626176768',
  phone: '9626176768',
  gstin: '33DZYPK8024G1ZY',
  pan: 'DZYPK8024G',
  tradeCertificateNo: 'TNS91A0009TC',
};
