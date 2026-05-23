import React from 'react';

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
}

interface ClientData {
  client_name: string;
  email: string | null;
  company_name: string | null;
}

interface ProfileData {
  display_name: string | null;
  email: string | null;
  // add other profile fields if needed
}

export interface InvoicePdfProps {
  invoice: InvoiceData;
  client: ClientData;
  profile: ProfileData;
}

export function InvoicePdfTemplate({ invoice, client, profile }: InvoicePdfProps) {
  // Format dates
  const invoiceDate = new Date(invoice.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  const dueDate = new Date(invoice.due_date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Invoice {invoice.invoice_number}</title>
        {/* Tailwind will be injected here by Puppeteer */}
      </head>
      <body className="bg-white text-slate-800 p-12 font-sans">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-start mb-16 border-b border-slate-200 pb-8">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">INVOICE</h1>
              <p className="text-slate-500 font-medium">#{invoice.invoice_number}</p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold text-slate-800">{profile.display_name || 'Freelancer'}</h2>
              {profile.email && <p className="text-slate-500 mt-1">{profile.email}</p>}
            </div>
          </div>

          {/* Billing Info */}
          <div className="flex justify-between mb-16">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Bill To</h3>
              <p className="text-lg font-semibold text-slate-800">{client.client_name}</p>
              {client.company_name && <p className="text-slate-600 mt-1">{client.company_name}</p>}
              {client.email && <p className="text-slate-500 mt-1">{client.email}</p>}
            </div>
            <div className="text-right">
              <div className="mb-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Date</h3>
                <p className="text-slate-800 font-medium">{invoiceDate}</p>
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Due Date</h3>
                <p className="text-slate-800 font-medium">{dueDate}</p>
              </div>
            </div>
          </div>

          {/* Invoice Item / Title */}
          <div className="mb-12">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-200 text-slate-500 text-sm">
                  <th className="py-3 font-semibold">Description</th>
                  <th className="py-3 font-semibold text-right w-32">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="py-6 pr-4">
                    <p className="font-semibold text-slate-800 text-lg mb-1">{invoice.title || 'Professional Services'}</p>
                    {invoice.description && (
                      <p className="text-slate-500 whitespace-pre-wrap leading-relaxed">{invoice.description}</p>
                    )}
                  </td>
                  <td className="py-6 text-right font-medium text-slate-800 text-lg align-top">
                    {invoice.amount.toLocaleString('en-US', { style: 'currency', currency: invoice.currency || 'USD' })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-16">
            <div className="w-64">
              <div className="flex justify-between py-3 font-bold text-xl text-slate-900 border-t-2 border-slate-800">
                <span>Total Due</span>
                <span>{invoice.amount.toLocaleString('en-US', { style: 'currency', currency: invoice.currency || 'USD' })}</span>
              </div>
            </div>
          </div>

          {/* Footer Notes & Payment Link */}
          <div className="border-t border-slate-200 pt-8 mt-auto">
            {invoice.payment_link && (
              <div className="mb-6 bg-slate-50 p-4 rounded-lg inline-block">
                <p className="text-sm font-semibold text-slate-700 mb-1">Pay Securely Online:</p>
                <a href={invoice.payment_link} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  {invoice.payment_link}
                </a>
              </div>
            )}
            {invoice.notes && (
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-1">Notes:</p>
                <p className="text-slate-500 text-sm whitespace-pre-wrap">{invoice.notes}</p>
              </div>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
