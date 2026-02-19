import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SalesBillData, COMPANY_DETAILS } from '@/types/bill';

export function generateSalesBillPDF(salesBill: SalesBillData, logoBase64?: string): jsPDF {
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
  y += 5;

  // Trade Certificate No
  doc.text(`Trade Certificate No : ${COMPANY_DETAILS.tradeCertificateNo}`, pageWidth / 2, y, { align: 'center' });
  y += 5;

  // Divider
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  // Customer Details header
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Customer Details', margin, y);
  y += 5;

  doc.setLineWidth(0.2);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  // Customer details left column, invoice details right column
  doc.setFontSize(8);
  const leftX = margin;
  const rightX = pageWidth / 2 + 10;

  doc.setFont('helvetica', 'normal');
  doc.text('Sold To', leftX, y);
  doc.text(`:  ${salesBill.customerName}`, leftX + 22, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice No : ${salesBill.invoiceNumber}`, rightX, y);
  y += 5;

  doc.text('ADDRESSS', leftX, y);
  doc.text(`:  ${salesBill.customerAddress}`, leftX + 22, y);
  doc.text(`Invoice Date : ${formatDate(salesBill.invoiceDate)}`, rightX, y);
  y += 10;

  // State and Controller NO
  doc.text('STATE', leftX, y);
  doc.text(`:  ${salesBill.customerState}`, leftX + 22, y);
  doc.text(`CONTROLLER NO : ${salesBill.controllerNumber || '-'}`, rightX, y);
  y += 5;

  doc.text('Mobile no', leftX, y);
  doc.text(`:  ${salesBill.customerMobile}`, leftX + 22, y);
  doc.text(`BATTERY NO : ${salesBill.batteryNumber || '-'}`, rightX, y);
  y += 5;

  doc.text('PAN NO', leftX, y);
  doc.text(`:  ${salesBill.customerPan || ''}`, leftX + 22, y);
  doc.text(`CHARGER NO : ${salesBill.chargerNumber || '-'}`, rightX, y);
  y += 5;

  doc.text('GST NO', leftX, y);
  doc.text(`:  ${salesBill.customerGst || ''}`, leftX + 22, y);
  y += 5;

  // Vehicle Details Table
  autoTable(doc, {
    startY: y,
    head: [['S.NO', 'MODEL', 'COLOR', 'HSN/SAC CODE', 'CHASSIS NUMBER', 'MOTOR NO', 'AMOUNT']],
    body: [
      ['1', salesBill.vehicleModel, salesBill.vehicleColor, salesBill.hsnSacCode, salesBill.chassisNumber, salesBill.motorNumber, formatCurrency(salesBill.taxablePrice)],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 7,
      lineColor: [0, 0, 0],
      lineWidth: 0.3,
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.3,
    },
    styles: {
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      6: { halign: 'right' },
    },
    margin: { left: margin, right: margin },
  });

  y = (doc as any).lastAutoTable.finalY;

  // Pricing rows - right aligned in a table-like format
  const priceData = [
    ['Taxable Price', formatCurrency(salesBill.taxablePrice)],
    ['SGST @ 2.5%', formatCurrency(salesBill.sgstAmount)],
    ['CGST @ 2.5%', formatCurrency(salesBill.cgstAmount)],
    ['EX-Showroom Price', formatCurrency(salesBill.exShowroomPrice)],
    ['Rounded off', formatCurrency(salesBill.roundedOff)],
    ['Total invoice', formatCurrency(salesBill.totalInvoiceAmount)],
  ];

  autoTable(doc, {
    startY: y,
    body: priceData,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 1.5,
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.3,
    },
    columnStyles: {
      0: { cellWidth: 110, fontStyle: 'bold' },
      1: { halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: margin, right: margin },
  });

  y = (doc as any).lastAutoTable.finalY + 2;

  // Battery Details Table
  if (salesBill.batteryChemistry || salesBill.batteryCapacity) {
    autoTable(doc, {
      startY: y,
      head: [['Battery Chemistry', 'Battery Capacity', 'Battery make', 'Mfg. year']],
      body: [
        [salesBill.batteryChemistry || '-', salesBill.batteryCapacity || '-', salesBill.batteryMake || '-', salesBill.batteryManufacturingYear || '-'],
      ],
      theme: 'grid',
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 7,
        lineColor: [0, 0, 0],
        lineWidth: 0.3,
      },
      bodyStyles: {
        fontSize: 7,
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.3,
      },
      styles: { cellPadding: 2 },
      margin: { left: margin, right: margin },
    });

    y = (doc as any).lastAutoTable.finalY + 3;
  }

  // Warranty
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Controller, Motor, Charger and Battery one years warranty', margin, y);
  y += 6;

  // Received note
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  const receiveText = 'Received Vehicle (with above vin number) in good fresh condition along with this invoice, the details of which I have verified and found everything to my satisfaction';
  const splitText = doc.splitTextToSize(receiveText, contentWidth);
  doc.text(splitText, margin, y);
  y += splitText.length * 3.5 + 8;

  // Signatures
  const signY = Math.max(y, 262);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('CUSTOMER SIGN', margin, signY);
  doc.text('FOR PALANI ANDAVAR E MOTORS', pageWidth - margin, signY - 5, { align: 'right' });
  doc.text('AUTHORISED SIGN', pageWidth - margin, signY + 2, { align: 'right' });

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
