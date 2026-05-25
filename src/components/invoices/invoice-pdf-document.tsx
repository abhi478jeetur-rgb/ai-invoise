import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Register fonts if desired. For now we use standard Helvetica.

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#334155',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 20,
  },
  logo: {
    width: 80,
    height: 80,
    objectFit: 'contain',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    letterSpacing: 1,
  },
  invoiceNumber: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  companyDetails: {
    alignItems: 'flex-end',
  },
  companyName: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  billingSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  billTo: {
    width: '50%',
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  clientName: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#1e293b',
    marginBottom: 2,
  },
  metaData: {
    alignItems: 'flex-end',
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  metaLabel: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
    width: 60,
    textAlign: 'right',
    marginRight: 10,
  },
  metaValue: {
    fontSize: 10,
    color: '#1e293b',
    width: 80,
    textAlign: 'right',
  },
  table: {
    width: '100%',
    marginBottom: 30,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingBottom: 8,
    marginBottom: 8,
  },
  colDesc: {
    flex: 1,
  },
  colAmount: {
    width: 100,
    textAlign: 'right',
  },
  tableHeaderCell: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#64748b',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  itemTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  itemDesc: {
    fontSize: 10,
    color: '#64748b',
    lineHeight: 1.4,
  },
  itemAmount: {
    fontSize: 12,
    color: '#0f172a',
  },
  totals: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 40,
  },
  totalsBox: {
    width: 200,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 2,
    borderTopColor: '#0f172a',
    paddingTop: 10,
  },
  totalLabel: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  totalAmount: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  footer: {
    marginTop: 'auto',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 20,
  },
  footerBox: {
    marginBottom: 15,
  },
  footerTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#475569',
    marginBottom: 4,
  },
  footerText: {
    fontSize: 9,
    color: '#64748b',
    lineHeight: 1.5,
  },
  paymentLink: {
    fontSize: 9,
    color: '#2563eb',
    textDecoration: 'none',
  },
});

interface InvoiceData {
  invoice_number: string;
  title: string | null;
  description: string | null;
  amount: number;
  currency: string;
  due_date: string;
  notes: string | null;
  payment_link: string | null;
  created_at: string;
  po_number?: string | null;
  line_items?: any[];
}

interface ClientData {
  client_name: string;
  email: string | null;
  company_name: string | null;
}

interface ProfileData {
  full_name: string | null;
  email: string | null;
  company_name: string | null;
  company_address: string | null;
  company_website: string | null;
  tax_id: string | null;
  logo_url: string | null;
  bank_details: string | null;
  global_rules: {
    late_payment_policy?: string;
    refund_policy?: string;
    terms_and_conditions?: string;
  } | null;
}

export interface InvoicePdfProps {
  invoice: InvoiceData;
  client: ClientData;
  profile: ProfileData;
}

export function InvoicePdfDocument({ invoice, client, profile }: InvoicePdfProps) {
  const invoiceDate = new Date(invoice.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  
  const dueDate = new Date(invoice.due_date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const currencyStr = invoice.currency || 'USD';
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyStr,
  }).format(invoice.amount);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* Header */}
        <View style={styles.header}>
          <View>
            {profile.logo_url && <Image src={profile.logo_url} style={styles.logo} />}
            <Text style={styles.title}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>#{invoice.invoice_number}</Text>
            {invoice.po_number && (
              <Text style={styles.invoiceNumber}>PO: {invoice.po_number}</Text>
            )}
          </View>
          <View style={styles.companyDetails}>
            <Text style={styles.companyName}>{profile.company_name || profile.full_name || 'Freelancer'}</Text>
            {profile.company_address && (
              <Text style={{ ...styles.invoiceNumber, marginTop: 2 }}>{profile.company_address}</Text>
            )}
            {profile.tax_id && (
              <Text style={{ ...styles.invoiceNumber, marginTop: 2 }}>Tax ID: {profile.tax_id}</Text>
            )}
            {profile.email && (
              <Text style={{ ...styles.invoiceNumber, marginTop: 2 }}>{profile.email}</Text>
            )}
            {profile.company_website && (
              <Text style={{ ...styles.invoiceNumber, marginTop: 2 }}>{profile.company_website}</Text>
            )}
          </View>
        </View>

        {/* Billing Info */}
        <View style={styles.billingSection}>
          <View style={styles.billTo}>
            <Text style={styles.sectionTitle}>Bill To</Text>
            <Text style={styles.clientName}>{client.client_name}</Text>
            {client.company_name && <Text style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>{client.company_name}</Text>}
            {client.email && <Text style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>{client.email}</Text>}
          </View>
          
          <View style={styles.metaData}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Date</Text>
              <Text style={styles.metaValue}>{invoiceDate}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Due Date</Text>
              <Text style={styles.metaValue}>{dueDate}</Text>
            </View>
          </View>
        </View>

        {/* Invoice Items */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <View style={styles.colDesc}>
              <Text style={styles.tableHeaderCell}>Description</Text>
            </View>
            <View style={{ width: 50, textAlign: 'right', paddingRight: 10 }}>
              <Text style={styles.tableHeaderCell}>Qty</Text>
            </View>
            <View style={{ width: 60, textAlign: 'right', paddingRight: 10 }}>
              <Text style={styles.tableHeaderCell}>Rate</Text>
            </View>
            <View style={styles.colAmount}>
              <Text style={styles.tableHeaderCell}>Total</Text>
            </View>
          </View>
          
          {invoice.line_items && invoice.line_items.length > 0 ? (
            invoice.line_items.map((item, idx) => (
              <View key={idx} style={styles.tableRow}>
                <View style={styles.colDesc}>
                  <Text style={styles.itemTitle}>{item.name || 'Item'}</Text>
                  {item.description && (
                    <Text style={styles.itemDesc}>{item.description}</Text>
                  )}
                </View>
                <View style={{ width: 50, textAlign: 'right', paddingRight: 10 }}>
                  <Text style={styles.itemAmount}>{item.quantity}</Text>
                </View>
                <View style={{ width: 60, textAlign: 'right', paddingRight: 10 }}>
                  <Text style={styles.itemAmount}>{new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyStr }).format(item.rate)}</Text>
                </View>
                <View style={styles.colAmount}>
                  <Text style={styles.itemAmount}>{new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyStr }).format(item.total)}</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.tableRow}>
              <View style={styles.colDesc}>
                <Text style={styles.itemTitle}>{invoice.title || 'Professional Services'}</Text>
                {invoice.description && (
                  <Text style={styles.itemDesc}>{invoice.description}</Text>
                )}
              </View>
              <View style={{ width: 50, textAlign: 'right', paddingRight: 10 }}>
                <Text style={styles.itemAmount}>1</Text>
              </View>
              <View style={{ width: 60, textAlign: 'right', paddingRight: 10 }}>
                <Text style={styles.itemAmount}>{formattedAmount}</Text>
              </View>
              <View style={styles.colAmount}>
                <Text style={styles.itemAmount}>{formattedAmount}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Due</Text>
              <Text style={styles.totalAmount}>{formattedAmount}</Text>
            </View>
          </View>
        </View>

        {/* Footer Notes & Payment Link */}
        <View style={styles.footer}>
          {(invoice.payment_link || profile.bank_details) && (
            <View style={styles.footerBox}>
              <Text style={styles.footerTitle}>PAYMENT DETAILS</Text>
              {invoice.payment_link && (
                <Text style={styles.paymentLink}>{invoice.payment_link}</Text>
              )}
              {profile.bank_details && (
                <Text style={{ ...styles.footerText, marginTop: 4 }}>{profile.bank_details}</Text>
              )}
            </View>
          )}

          {invoice.notes && (
            <View style={styles.footerBox}>
              <Text style={styles.footerTitle}>NOTES</Text>
              <Text style={styles.footerText}>{invoice.notes}</Text>
            </View>
          )}

          {profile.global_rules?.terms_and_conditions && (
            <View style={styles.footerBox}>
              <Text style={styles.footerTitle}>TERMS & CONDITIONS</Text>
              <Text style={styles.footerText}>{profile.global_rules.terms_and_conditions}</Text>
            </View>
          )}
        </View>
      </Page>
    </Document>
  );
}
