import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/server";
import { renderToStream } from "@react-pdf/renderer";
import { InvoicePdfDocument } from "@/components/invoices/invoice-pdf-document";

// We use edge or nodejs? React-PDF requires Nodejs
export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Fetch invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (invoiceError || !invoice) {
      return new NextResponse("Invoice not found", { status: 404 });
    }

    // Fetch client
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("*")
      .eq("id", invoice.client_id)
      .single();

    if (clientError || !client) {
      return new NextResponse("Client not found", { status: 404 });
    }

    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return new NextResponse("Profile not found", { status: 404 });
    }

    // Render React component to PDF stream
    const stream = await renderToStream(
      InvoicePdfDocument({ invoice, client, profile })
    );

    return new NextResponse(stream as unknown as ReadableStream, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=invoice_${invoice.invoice_number}.pdf`,
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
      status: 200,
    });
  } catch (error: any) {
    console.error("PDF Generation Error:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to generate PDF", details: error.message }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
