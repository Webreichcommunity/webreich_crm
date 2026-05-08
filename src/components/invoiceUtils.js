import jsPDF from 'jspdf';
import { formatINR } from './projectUtils';

const COMPANY = {
  name: 'WebReich Solutions',
  brand: 'WebReich',
  email: 'webreichcommunity@gmail.com',
  phone: '',
  website: '',
};

const toDataUrl = async (path) => {
  const res = await fetch(path);
  const blob = await res.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const safeText = (value) => String(value || '').trim();

const formatDate = (date) => {
  try {
    return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
};

export const downloadProjectInvoicePdf = async (project) => {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40;

  const createdAt = project?.createdAt || new Date().toISOString();
  const invoiceNo = safeText(project?.serial || 'WR-INVOICE');
  const invoiceDate = formatDate(createdAt);

  const clientName = safeText(project?.clientName);
  const clientPhone = safeText(project?.phone);
  const clientAddress = safeText(project?.address);

  const projectName = safeText(project?.projectName);
  const projectType = safeText(project?.projectType);
  const product = safeText(project?.product);

  const budget = Number(project?.budget || 0);
  const received = (project?.payments || []).reduce((a, p) => a + Number(p.amount || 0), 0);
  const pending = Math.max(budget - received, 0);

  let logo;
  try {
    logo = await toDataUrl('/logo.png');
  } catch {
    logo = '';
  }

  doc.setFillColor(2, 6, 23);
  doc.rect(0, 0, pageW, 90, 'F');

  if (logo) {
    try {
      doc.addImage(logo, 'PNG', margin, 24, 44, 44);
    } catch {
      // ignore logo render errors
    }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(COMPANY.name, margin + 56, 44);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const companyLine = [COMPANY.email, COMPANY.phone, COMPANY.website].filter(Boolean).join('  •  ');
  if (companyLine) doc.text(companyLine, margin + 56, 62);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('INVOICE', pageW - margin, 44, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Invoice No: ${invoiceNo}`, pageW - margin, 62, { align: 'right' });
  doc.text(`Invoice Date: ${invoiceDate}`, pageW - margin, 78, { align: 'right' });

  doc.setTextColor(17, 24, 39);

  const sectionTop = 120;
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(margin, sectionTop, pageW - margin * 2, 110, 12, 12, 'F');
  doc.setDrawColor(229, 231, 235);
  doc.roundedRect(margin, sectionTop, pageW - margin * 2, 110, 12, 12);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Bill To', margin + 16, sectionTop + 24);
  doc.text('Project', margin + (pageW - margin * 2) / 2, sectionTop + 24);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const leftX = margin + 16;
  const rightX = margin + (pageW - margin * 2) / 2;
  doc.text(clientName || '—', leftX, sectionTop + 44);
  if (clientPhone) doc.text(clientPhone, leftX, sectionTop + 60);
  if (clientAddress) doc.text(doc.splitTextToSize(clientAddress, (pageW - margin * 2) / 2 - 24), leftX, sectionTop + 76);

  doc.text(projectName || '—', rightX, sectionTop + 44);
  const meta = [product, projectType].filter(Boolean).join(' • ');
  if (meta) doc.text(meta, rightX, sectionTop + 60);
  doc.text(`Start Date: ${formatDate(createdAt)}`, rightX, sectionTop + 76);

  const tableTop = 260;
  const col1 = margin;
  const col2 = pageW - margin;

  doc.setFillColor(255, 247, 237);
  doc.roundedRect(margin, tableTop, pageW - margin * 2, 34, 10, 10, 'F');
  doc.setDrawColor(253, 186, 116);
  doc.roundedRect(margin, tableTop, pageW - margin * 2, 34, 10, 10);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(124, 45, 18);
  doc.text('Description', col1 + 16, tableTop + 22);
  doc.text('Amount', col2 - 16, tableTop + 22, { align: 'right' });

  doc.setTextColor(17, 24, 39);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const itemTop = tableTop + 46;
  doc.text(projectName || product || 'Service', col1 + 16, itemTop);
  doc.text(formatINR(budget), col2 - 16, itemTop, { align: 'right' });
  doc.setFontSize(9);
  const itemSub = [product, projectType].filter(Boolean).join(' • ');
  if (itemSub) doc.text(itemSub, col1 + 16, itemTop + 16);

  const totalsTop = itemTop + 60;
  const boxW = 240;
  const boxX = pageW - margin - boxW;
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(boxX, totalsTop, boxW, 110, 12, 12, 'F');
  doc.setDrawColor(229, 231, 235);
  doc.roundedRect(boxX, totalsTop, boxW, 110, 12, 12);

  const line = (label, value, y, bold = false, accent = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(bold ? 11 : 10);
    doc.setTextColor(accent ? 234 : 55, accent ? 88 : 65, accent ? 12 : 81);
    doc.text(label, boxX + 14, y);
    doc.setTextColor(17, 24, 39);
    doc.text(value, boxX + boxW - 14, y, { align: 'right' });
  };

  line('Total', formatINR(budget), totalsTop + 28, true);
  line('Received', formatINR(received), totalsTop + 52);
  line('Pending', formatINR(pending), totalsTop + 76, true, true);
  doc.setDrawColor(229, 231, 235);
  doc.line(boxX + 12, totalsTop + 62, boxX + boxW - 12, totalsTop + 62);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  const footerY = pageH - 60;
  doc.text(`Generated by ${COMPANY.brand} CRM • ${new Date().toLocaleString('en-IN')}`, margin, footerY);
  doc.text('Thank you for your business.', pageW - margin, footerY, { align: 'right' });

  doc.save(`${invoiceNo}.pdf`);
};

