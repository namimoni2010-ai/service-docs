import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SalesBillData, COMPANY_DETAILS } from '@/types/bill';

const PRIMARY_COLOR: [number, number, number] = [20, 100, 60];
const HIGHLIGHT_COLOR: [number, number, number] = [245, 158, 11];
const TEXT_COLOR: [number, number, number] = [30, 30, 30];
const LIGHT_BG: [number, number, number] = [248, 250, 252];

export function generateSalesBillPDF(salesBill: SalesBillData, logoBase64?: string): jsPDF {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  
  let yPos = margin;
  
  // Header with Logo
  doc.setFillColor(...PRIMARY_COLOR);
  doc.rect(0, 0, pageWidth, 50, 'F');
  
  // Add logo if available
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'JPEG', margin, 5, 25, 25);
    } catch (e) {
      console.error('Failed to add logo:', e);
    }
  }
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(COMPANY_DETAILS.name, pageWidth / 2, 12, { align: 'center' });
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(COMPANY_DETAILS.address, pageWidth / 2, 19, { align: 'center' });
  doc.text(COMPANY_DETAILS.city, pageWidth / 2, 24, { align: 'center' });
  doc.text(`Phone: ${COMPANY_DETAILS.phone}`, pageWidth / 2, 29, { align: 'center' });
  
  // GSTIN and PAN
  doc.setFontSize(8);
  doc.text(`GSTIN NO: ${COMPANY_DETAILS.gstin}`, pageWidth / 2, 36, { align: 'center' });
  doc.text(`PAN NO: ${COMPANY_DETAILS.pan}`, pageWidth / 2, 41, { align: 'center' });
  
  yPos = 58;
  
  // Sales Bill Title
  doc.setTextColor(...TEXT_COLOR);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('SALES BILL', pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;
  
  // Invoice Details Box
  doc.setFillColor(...LIGHT_BG);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 14, 2, 2, 'F');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Invoice No: ${salesBill.invoiceNumber}`, margin + 5, yPos + 7);
  doc.text(`Invoice Date: ${formatDate(salesBill.invoiceDate)}`, pageWidth - margin - 55, yPos + 7);
  
  yPos += 20;
  
  // Customer Details Section
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('CUSTOMER DETAILS', margin, yPos);
  yPos += 4;
  
  doc.setDrawColor(...PRIMARY_COLOR);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 5;
  
  doc.setTextColor(...TEXT_COLOR);
  doc.setFontSize(9);
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
    doc.text(value, margin + 30, yPos);
    yPos += 5;
  });
  
  yPos += 4;
  
  // Vehicle Details Table
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('VEHICLE DETAILS', margin, yPos);
  yPos += 5;
  
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
      fontSize: 8,
    },
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40 },
      1: { cellWidth: 'auto' },
    },
    margin: { left: margin, right: margin },
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 5;
  
  // Pricing Section
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('PRICING DETAILS', margin, yPos);
  yPos += 5;
  
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
      fontSize: 8,
    },
    footStyles: {
      fillColor: HIGHLIGHT_COLOR,
      textColor: [30, 30, 30],
      fontStyle: 'bold',
      fontSize: 9,
    },
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { halign: 'right' },
    },
    margin: { left: margin, right: margin },
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 5;
  
  // Battery Details
  if (salesBill.batteryChemistry || salesBill.batteryCapacity) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text('BATTERY DETAILS', margin, yPos);
    yPos += 5;
    
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
        fontSize: 8,
      },
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 40 },
      },
      margin: { left: margin, right: margin },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 5;
  }
  
  // Warranty Note
  doc.setFillColor(...LIGHT_BG);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 10, 2, 2, 'F');
  doc.setTextColor(...TEXT_COLOR);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('WARRANTY:', margin + 3, yPos + 5);
  doc.setFont('helvetica', 'normal');
  doc.text('Controller, Motor, Charger & Battery – 1 Year Warranty', margin + 25, yPos + 5);
  
  // Signatures
  const signatureY = 270;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.line(margin, signatureY, margin + 45, signatureY);
  doc.text('Customer Signature', margin, signatureY + 5);
  
  doc.line(pageWidth - margin - 45, signatureY, pageWidth - margin, signatureY);
  doc.text('Authorized Signature', pageWidth - margin - 45, signatureY + 5);
  
  return doc;
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
