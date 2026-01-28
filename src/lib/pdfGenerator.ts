import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CompleteBillData, COMPANY_DETAILS, ServiceItem } from '@/types/bill';

const PRIMARY_COLOR: [number, number, number] = [20, 100, 60]; // Emerald
const HIGHLIGHT_COLOR: [number, number, number] = [245, 158, 11]; // Amber
const TEXT_COLOR: [number, number, number] = [30, 30, 30];
const LIGHT_BG: [number, number, number] = [248, 250, 252];

export function generateBillPDF(data: CompleteBillData): jsPDF {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  
  // ============ PAGE 1: SALES BILL ============
  generateSalesBillPage(doc, data.salesBill, pageWidth, margin);
  
  // Add second page for Service Bill
  doc.addPage();
  
  // ============ PAGE 2: SERVICE BILL ============
  generateServiceBillPage(doc, data.serviceBill, data.salesBill, pageWidth, margin);
  
  return doc;
}

function generateSalesBillPage(
  doc: jsPDF, 
  salesBill: CompleteBillData['salesBill'],
  pageWidth: number, 
  margin: number
) {
  let yPos = margin;
  
  // Header
  doc.setFillColor(...PRIMARY_COLOR);
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(COMPANY_DETAILS.name, pageWidth / 2, 15, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(COMPANY_DETAILS.address, pageWidth / 2, 23, { align: 'center' });
  doc.text(COMPANY_DETAILS.city, pageWidth / 2, 29, { align: 'center' });
  doc.text(`Phone: ${COMPANY_DETAILS.phone}`, pageWidth / 2, 35, { align: 'center' });
  
  if (COMPANY_DETAILS.gstin) {
    doc.text(`GSTIN: ${COMPANY_DETAILS.gstin}`, pageWidth / 2, 41, { align: 'center' });
  }
  
  yPos = 55;
  
  // Sales Bill Title
  doc.setTextColor(...TEXT_COLOR);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('SALES BILL', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;
  
  // Invoice Details Box
  doc.setFillColor(...LIGHT_BG);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 20, 2, 2, 'F');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Invoice No: ${salesBill.invoiceNumber}`, margin + 5, yPos + 8);
  doc.text(`Invoice Date: ${formatDate(salesBill.invoiceDate)}`, pageWidth - margin - 60, yPos + 8);
  
  yPos += 30;
  
  // Customer Details Section
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('CUSTOMER DETAILS', margin, yPos);
  yPos += 6;
  
  doc.setDrawColor(...PRIMARY_COLOR);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;
  
  doc.setTextColor(...TEXT_COLOR);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const customerDetails = [
    ['Customer Name:', salesBill.customerName],
    ['Address:', salesBill.customerAddress],
    ['Mobile:', salesBill.customerMobile],
    ['State:', salesBill.customerState],
  ];
  
  customerDetails.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(value, margin + 35, yPos);
    yPos += 6;
  });
  
  yPos += 8;
  
  // Vehicle Details Table
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('VEHICLE DETAILS', margin, yPos);
  yPos += 8;
  
  autoTable(doc, {
    startY: yPos,
    head: [['Field', 'Value']],
    body: [
      ['Model', salesBill.vehicleModel],
      ['Color', salesBill.vehicleColor],
      ['HSN/SAC Code', salesBill.hsnSacCode],
      ['Chassis Number', salesBill.chassisNumber],
      ['Motor Number', salesBill.motorNumber],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: PRIMARY_COLOR,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 9,
      cellPadding: 4,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { cellWidth: 'auto' },
    },
    margin: { left: margin, right: margin },
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 10;
  
  // Pricing Section
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('PRICING DETAILS', margin, yPos);
  yPos += 8;
  
  autoTable(doc, {
    startY: yPos,
    head: [['Description', 'Amount (₹)']],
    body: [
      ['Taxable Price', formatCurrency(salesBill.taxablePrice)],
      ['SGST @ 2.5%', formatCurrency(salesBill.sgstAmount)],
      ['CGST @ 2.5%', formatCurrency(salesBill.cgstAmount)],
      ['Ex-Showroom Price', formatCurrency(salesBill.exShowroomPrice)],
      ['Rounded Off', formatCurrency(salesBill.roundedOff)],
    ],
    foot: [['TOTAL INVOICE AMOUNT', formatCurrency(salesBill.totalInvoiceAmount)]],
    theme: 'grid',
    headStyles: {
      fillColor: PRIMARY_COLOR,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    footStyles: {
      fillColor: HIGHLIGHT_COLOR,
      textColor: [30, 30, 30],
      fontStyle: 'bold',
      fontSize: 11,
    },
    styles: {
      fontSize: 9,
      cellPadding: 4,
    },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { halign: 'right' },
    },
    margin: { left: margin, right: margin },
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 10;
  
  // Battery Details
  if (salesBill.batteryChemistry || salesBill.batteryCapacity) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text('BATTERY DETAILS', margin, yPos);
    yPos += 8;
    
    autoTable(doc, {
      startY: yPos,
      head: [['Specification', 'Value']],
      body: [
        ['Battery Chemistry', salesBill.batteryChemistry || '-'],
        ['Battery Capacity', salesBill.batteryCapacity || '-'],
        ['Battery Make', salesBill.batteryMake || '-'],
        ['Manufacturing Year', salesBill.batteryManufacturingYear || '-'],
      ],
      theme: 'grid',
      headStyles: {
        fillColor: PRIMARY_COLOR,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 9,
        cellPadding: 4,
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50 },
      },
      margin: { left: margin, right: margin },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 10;
  }
  
  // Warranty Note
  doc.setFillColor(...LIGHT_BG);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 15, 2, 2, 'F');
  doc.setTextColor(...TEXT_COLOR);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('WARRANTY:', margin + 5, yPos + 6);
  doc.setFont('helvetica', 'normal');
  doc.text('Controller, Motor, Charger & Battery – 1 Year Warranty', margin + 30, yPos + 6);
  
  yPos += 25;
  
  // Signatures
  const signatureY = 270;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.line(margin, signatureY, margin + 50, signatureY);
  doc.text('Customer Signature', margin, signatureY + 5);
  
  doc.line(pageWidth - margin - 50, signatureY, pageWidth - margin, signatureY);
  doc.text('Authorized Signature', pageWidth - margin - 50, signatureY + 5);
}

function generateServiceBillPage(
  doc: jsPDF,
  serviceBill: CompleteBillData['serviceBill'],
  salesBill: CompleteBillData['salesBill'],
  pageWidth: number,
  margin: number
) {
  let yPos = margin;
  
  // Header
  doc.setFillColor(...PRIMARY_COLOR);
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(COMPANY_DETAILS.name, pageWidth / 2, 15, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(COMPANY_DETAILS.address, pageWidth / 2, 23, { align: 'center' });
  doc.text(COMPANY_DETAILS.city, pageWidth / 2, 29, { align: 'center' });
  doc.text(`Phone: ${COMPANY_DETAILS.phone}`, pageWidth / 2, 35, { align: 'center' });
  
  yPos = 55;
  
  // Service Bill Title
  doc.setTextColor(...TEXT_COLOR);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('SERVICE BILL', pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;
  
  // Customer & Vehicle Summary
  doc.setFillColor(...LIGHT_BG);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 35, 2, 2, 'F');
  
  doc.setTextColor(...TEXT_COLOR);
  doc.setFontSize(10);
  
  const summaryLeft = [
    ['Customer Name:', serviceBill.customerName],
    ['Mobile:', serviceBill.customerMobile],
    ['Vehicle Model:', serviceBill.vehicleModel],
  ];
  
  const summaryRight = [
    ['Vehicle Number:', serviceBill.vehicleNumber || '-'],
    ['Service Date:', formatDate(serviceBill.serviceDate)],
  ];
  
  let summaryY = yPos + 8;
  summaryLeft.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, margin + 5, summaryY);
    doc.setFont('helvetica', 'normal');
    doc.text(value, margin + 40, summaryY);
    summaryY += 7;
  });
  
  summaryY = yPos + 8;
  summaryRight.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, pageWidth / 2 + 10, summaryY);
    doc.setFont('helvetica', 'normal');
    doc.text(value, pageWidth / 2 + 50, summaryY);
    summaryY += 7;
  });
  
  yPos += 45;
  
  // Service Items Table
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('SERVICE DETAILS', margin, yPos);
  yPos += 8;
  
  const serviceTableBody = serviceBill.serviceItems.map((item: ServiceItem) => [
    item.sno.toString(),
    item.description,
    item.quantity.toString(),
    formatCurrency(item.rate),
    formatCurrency(item.amount),
  ]);
  
  autoTable(doc, {
    startY: yPos,
    head: [['S.No', 'Service Description', 'Qty', 'Rate (₹)', 'Amount (₹)']],
    body: serviceTableBody,
    theme: 'grid',
    headStyles: {
      fillColor: PRIMARY_COLOR,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 9,
      cellPadding: 4,
    },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 35, halign: 'right' },
    },
    margin: { left: margin, right: margin },
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 10;
  
  // Service Summary
  const summaryTableBody = [
    ['Sub Total', formatCurrency(serviceBill.subTotal)],
  ];
  
  if (serviceBill.applyGst) {
    summaryTableBody.push(['GST', formatCurrency(serviceBill.gstAmount)]);
  }
  
  autoTable(doc, {
    startY: yPos,
    body: summaryTableBody,
    foot: [['FINAL AMOUNT', formatCurrency(serviceBill.finalAmount)]],
    theme: 'plain',
    footStyles: {
      fillColor: HIGHLIGHT_COLOR,
      textColor: [30, 30, 30],
      fontStyle: 'bold',
      fontSize: 11,
    },
    styles: {
      fontSize: 10,
      cellPadding: 4,
    },
    columnStyles: {
      0: { cellWidth: 100, fontStyle: 'bold' },
      1: { halign: 'right' },
    },
    margin: { left: margin + 70, right: margin },
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 15;
  
  // Service Notes
  if (serviceBill.serviceNotes) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text('SERVICE NOTES:', margin, yPos);
    yPos += 6;
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...TEXT_COLOR);
    const splitNotes = doc.splitTextToSize(serviceBill.serviceNotes, pageWidth - 2 * margin);
    doc.text(splitNotes, margin, yPos);
    yPos += splitNotes.length * 5 + 10;
  }
  
  // Next Service Date
  if (serviceBill.nextServiceDate) {
    doc.setFillColor(...LIGHT_BG);
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 12, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text(`Next Service Date: ${formatDate(serviceBill.nextServiceDate)}`, margin + 5, yPos + 8);
    yPos += 20;
  }
  
  // Signatures
  const signatureY = 260;
  doc.setTextColor(...TEXT_COLOR);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.line(margin, signatureY, margin + 50, signatureY);
  doc.text('Customer Signature', margin, signatureY + 5);
  
  doc.line(pageWidth - margin - 50, signatureY, pageWidth - margin, signatureY);
  doc.text('Authorized Signature', pageWidth - margin - 50, signatureY + 5);
}

function formatDate(dateString: string): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
