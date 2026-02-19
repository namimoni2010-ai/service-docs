import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ServiceBillData, COMPANY_DETAILS, ServiceItem } from '@/types/bill';

export function generateServiceBillPDF(serviceBill: ServiceBillData, logoBase64?: string): jsPDF {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 12;
  const contentWidth = pageWidth - 2 * margin;

  let y = 8;

  // Border around entire page
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.rect(margin - 2, 5, contentWidth + 4, 282);

  // Logo centered
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'JPEG', pageWidth / 2 - 8, y, 16, 12);
    } catch (e) {
      console.error('Failed to add logo:', e);
    }
  }
  y += 14;

  // "GAURA ELECTRIC" text
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text('GAURA ELECTRIC', pageWidth / 2, y, { align: 'center' });
  y += 5;

  // GSTIN left, PAN right
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`GSTIN  NO: ${COMPANY_DETAILS.gstin}`, margin, y);
  doc.text(`PAN NO: ${COMPANY_DETAILS.pan}`, pageWidth - margin, y, { align: 'right' });
  y += 6;

  // Company Name
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(COMPANY_DETAILS.name, pageWidth / 2, y, { align: 'center' });
  y += 6;

  // Address
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(COMPANY_DETAILS.address, pageWidth / 2, y, { align: 'center' });
  y += 4;
  doc.text(COMPANY_DETAILS.city, pageWidth / 2, y, { align: 'center' });
  y += 6;

  // SALE INVOICE title
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('SALE INVOICE', pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // SPARES heading
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('SPARES', pageWidth / 2, y, { align: 'center' });
  y += 8;

  // Customer info left, bill info right
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const leftX = margin;
  const rightX = pageWidth / 2 + 20;

  doc.text(`TO:  ${serviceBill.customerName}`, leftX, y);
  doc.text(`NO:  ${serviceBill.billNumber || '-'}`, rightX, y);
  y += 5;

  doc.text(`ADDRESS:  ${serviceBill.customerAddress || '-'}`, leftX, y);
  doc.text(`DATE:  ${formatDate(serviceBill.serviceDate)}`, rightX, y);
  y += 7;

  doc.text(`CELL :  ${serviceBill.customerMobile}`, leftX, y);
  y += 7;

  // Service Items Table
  const tableBody = serviceBill.serviceItems.map((item: ServiceItem) => {
    const amountRs = Math.floor(item.amount);
    const amountPs = Math.round((item.amount - amountRs) * 100);
    return [
      item.sno.toString(),
      item.description,
      item.hsnCode || '',
      item.quantity.toString(),
      formatCurrency(item.rate),
      item.gst ? `${item.gst}%` : '',
      amountRs.toLocaleString('en-IN'),
      amountPs.toString().padStart(2, '0'),
    ];
  });

  // Fill empty rows to match format
  const emptyRows = Math.max(0, 8 - tableBody.length);
  for (let i = 0; i < emptyRows; i++) {
    tableBody.push(['', '', '', '', '', '', '', '']);
  }

  autoTable(doc, {
    startY: y,
    head: [['S.NO', 'ITEM', 'HSN CODE', 'QTY', 'PRICE', 'GST', { content: 'AMOUNT', colSpan: 2 }],
           ['', '', '', '', '', '', 'RS', 'PS']],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 7,
      lineColor: [0, 0, 0],
      lineWidth: 0.3,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.3,
    },
    styles: { cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 55 },
      2: { cellWidth: 22, halign: 'center' },
      3: { cellWidth: 12, halign: 'center' },
      4: { cellWidth: 22, halign: 'right' },
      5: { cellWidth: 18, halign: 'center' },
      6: { cellWidth: 22, halign: 'right' },
      7: { cellWidth: 12, halign: 'center' },
    },
    margin: { left: margin, right: margin },
  });

  y = (doc as any).lastAutoTable.finalY;

  // Summary rows
  const cgstRs = Math.floor(serviceBill.cgstAmount);
  const cgstPs = Math.round((serviceBill.cgstAmount - cgstRs) * 100);
  const sgstRs = Math.floor(serviceBill.sgstAmount);
  const sgstPs = Math.round((serviceBill.sgstAmount - sgstRs) * 100);
  const roundRs = Math.floor(serviceBill.roundedOff);
  const roundPs = Math.round((Math.abs(serviceBill.roundedOff) - Math.abs(roundRs)) * 100);
  const totalRs = Math.floor(serviceBill.finalAmount);
  const totalPs = Math.round((serviceBill.finalAmount - totalRs) * 100);

  const summaryData: string[][] = [];
  if (serviceBill.applyGst) {
    summaryData.push(['', '', '', '', '', 'C.GST...9%', cgstRs.toLocaleString('en-IN'), cgstPs.toString().padStart(2, '0')]);
    summaryData.push(['', '', '', '', '', 'S.GST...9%', sgstRs.toLocaleString('en-IN'), sgstPs.toString().padStart(2, '0')]);
  }
  summaryData.push(['', '', '', '', '', 'ROUND OFF+', roundRs.toLocaleString('en-IN'), roundPs.toString().padStart(2, '0')]);
  summaryData.push(['', '', '', '', '', 'TOTAL', totalRs.toLocaleString('en-IN'), totalPs.toString().padStart(2, '0')]);

  autoTable(doc, {
    startY: y,
    body: summaryData,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.3,
    },
    columnStyles: {
      0: { cellWidth: 12 },
      1: { cellWidth: 55 },
      2: { cellWidth: 22 },
      3: { cellWidth: 12 },
      4: { cellWidth: 22 },
      5: { cellWidth: 18, fontStyle: 'bold', halign: 'center' },
      6: { cellWidth: 22, halign: 'right', fontStyle: 'bold' },
      7: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
    },
    margin: { left: margin, right: margin },
  });

  y = (doc as any).lastAutoTable.finalY;

  // Signatures
  const signY = Math.max(y + 15, 262);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('CUSTOMER SIGNATURE', margin, signY);
  doc.text('FOR PALANI ANDAVAR E MOTORS', pageWidth - margin, signY, { align: 'right' });

  return doc;
}

function formatDate(dateString: string): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
