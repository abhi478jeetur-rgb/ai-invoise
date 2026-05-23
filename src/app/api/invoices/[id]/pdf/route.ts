import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db/server";
import chromium from "@sparticuz/chromium";
import { InvoicePdfTemplate } from "@/components/invoices/invoice-pdf-template";

// We need to render the component to static markup dynamically to avoid build errors

// We use edge or nodejs? Puppeteer requires Nodejs
export const runtime = "nodejs";
// Vercel max duration for hobby plan is 10s, but we can set 60s for pro just in case
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

    // Render React component to HTML
    const ReactDOMServer = (await import("react-dom/server")).default;
    const htmlContent = ReactDOMServer.renderToStaticMarkup(
      InvoicePdfTemplate({ invoice, client, profile })
    );

    let browser;
    let page;

    try {
      if (process.env.NODE_ENV === "production") {
        const puppeteer = (await import("puppeteer-core")).default;
        browser = await puppeteer.launch({
          args: [...chromium.args, "--disable-dev-shm-usage", "--ignore-certificate-errors"],
          executablePath: await chromium.executablePath(),
          headless: true,
        });
      } else {
        const puppeteer = (await import("puppeteer")).default;
        browser = await puppeteer.launch({
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
          headless: true,
        });
      }

      if (!browser) {
        throw new Error("Failed to launch browser");
      }

      page = await browser.newPage();
      await page.setContent(htmlContent, {
        waitUntil: ["load", "domcontentloaded"],
        timeout: 30000,
      });

      // Inject Tailwind CSS via CDN for styling
      await page.addStyleTag({
        url: "https://cdn.tailwindcss.com",
      });

      const pdf = await page.pdf({
        format: "a4",
        printBackground: true,
        preferCSSPageSize: true,
      });

      return new NextResponse(Buffer.from(pdf), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename=invoice_${invoice.invoice_number}.pdf`,
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
        status: 200,
      });
    } finally {
      if (page) {
        try {
          await page.close();
        } catch (e) {
          console.error("Error closing page:", e);
        }
      }
      if (browser) {
        try {
          const pages = await browser.pages();
          await Promise.all(pages.map((p) => p.close()));
          await browser.close();
        } catch (e) {
          console.error("Error closing browser:", e);
        }
      }
    }
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
