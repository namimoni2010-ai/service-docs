import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ServiceBillData, COMPANY_DETAILS, ServiceItem } from '@/types/bill';

const PRIMARY_COLOR: [number, number, number] = [20, 100, 60];
const HIGHLIGHT_COLOR: [number, number, number] = [245, 158, 11];
const TEXT_COLOR: [number, number, number] = [30, 30, 30];
const LIGHT_BG: [number, number, number] = [248, 250, 252];

export function generateServiceBillPDF(serviceBill: ServiceBillData, logoBase64?: string): jsPDF {
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
  
  // Service Bill Title
  doc.setTextColor(...TEXT_COLOR);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('SERVICE BILL', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;
  
  // Customer & Vehicle Summary
  doc.setFillColor(...LIGHT_BG);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 28, 2, 2, 'F');
  
  doc.setTextColor(...TEXT_COLOR);
  doc.setFontSize(9);
  
  const summaryLeft = [
    ['Customer Name:', serviceBill.customerName],
    ['Mobile:', serviceBill.customerMobile],
    ['Vehicle Model:', serviceBill.vehicleModel],
  ];
  
  const summaryRight = [
    ['Vehicle Number:', serviceBill.vehicleNumber || '-'],
    ['Service Date:', formatDate(serviceBill.serviceDate)],
  ];
  
  let summaryY = yPos + 6;
  summaryLeft.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, margin + 4, summaryY);
    doc.setFont('helvetica', 'normal');
    doc.text(value, margin + 35, summaryY);
    summaryY += 6;
  });
  
  summaryY = yPos + 6;
  summaryRight.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, pageWidth / 2 + 10, summaryY);
    doc.setFont('helvetica', 'normal');
    doc.text(value, pageWidth / 2 + 45, summaryY);
    summaryY += 6;
  });
  
  yPos += 35;
  
  // Service Items Table
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('SERVICE DETAILS', margin, yPos);
  yPos += 5;
  
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
      fontSize: 8,
    },
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 25, halign: 'right' },
      4: { cellWidth: 30, halign: 'right' },
    },
    margin: { left: margin, right: margin },
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 8;
  
  // Service Summary
  const summaryTableBody = [
    ['Sub Total', formatCurrency(serviceBill.subTotal)],
  ];
  
  if (serviceBill.applyGst) {
    summaryTableBody.push(['GST (18%)', formatCurrency(serviceBill.gstAmount)]);
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
      fontSize: 10,
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 80, fontStyle: 'bold' },
      1: { halign: 'right' },
    },
    margin: { left: margin + 60, right: margin },
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 8;
  
  // Service Notes
  if (serviceBill.serviceNotes) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text('SERVICE NOTES:', margin, yPos);
    yPos += 5;
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...TEXT_COLOR);
    const splitNotes = doc.splitTextToSize(serviceBill.serviceNotes, pageWidth - 2 * margin);
    doc.text(splitNotes, margin, yPos);
    yPos += splitNotes.length * 4 + 5;
  }
  
  // Next Service Date
  if (serviceBill.nextServiceDate) {
    doc.setFillColor(...LIGHT_BG);
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 10, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text(`Next Service Date: ${formatDate(serviceBill.nextServiceDate)}`, margin + 4, yPos + 6);
    yPos += 15;
  }
  
  // Signatures
  const signatureY = 270;
  doc.setTextColor(...TEXT_COLOR);
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
