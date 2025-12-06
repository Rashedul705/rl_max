'use client';
import { use, useEffect } from 'react';
import { notFound } from 'next/navigation';
import { recentOrders } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

type InvoicePageProps = {
  params: Promise<{ id: string }>;
};

export default function InvoicePage({ params }: InvoicePageProps) {
  // Asynchronously get the slug from the params promise.
  const { id } = use(params);

  const order = recentOrders.find((o) => o.id === id);

  useEffect(() => {
    if (order) {
      setTimeout(() => window.print(), 100);
    }
  }, [order]);
  
  if (!order) {
    notFound();
  }

  const subtotal = order.products.reduce((acc, p) => acc + p.price * p.quantity, 0);

  return (
    <div className="bg-white text-black min-h-screen">
      <style jsx global>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print {
            display: none;
          }
        }
      `}</style>
      <div className="max-w-4xl mx-auto p-8 sm:p-12 print:p-8">
        <header className="flex justify-between items-center pb-8 border-b">
          <div>
            <h1 className="text-3xl font-bold">Rodelas lifestyle</h1>
            <p>Your destination for premium apparel.</p>
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-bold uppercase text-gray-700">Invoice</h2>
            <p className="text-gray-500">{order.id}</p>
          </div>
        </header>

        <section className="grid sm:grid-cols-2 gap-8 my-8">
          <div>
            <h3 className="font-semibold mb-2">Bill To:</h3>
            <p className="font-bold">{order.customer}</p>
            <p>{order.address}</p>
            <p>{order.phone}</p>
          </div>
          <div className="text-right">
            <h3 className="font-semibold mb-2">Invoice Details:</h3>
            <p><span className="font-semibold">Date:</span> {new Date(order.date).toLocaleDateString()}</p>
            <p><span className="font-semibold">Status:</span> {order.status}</p>
          </div>
        </section>

        <section>
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3 font-semibold">Product</th>
                <th className="p-3 font-semibold text-center">Quantity</th>
                <th className="p-3 font-semibold text-right">Price</th>
                <th className="p-3 font-semibold text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.products.map((product, index) => (
                <tr key={index} className="border-b">
                  <td className="p-3">{product.name}</td>
                  <td className="p-3 text-center">{product.quantity}</td>
                  <td className="p-3 text-right">BDT {product.price.toLocaleString()}</td>
                  <td className="p-3 text-right">BDT {(product.price * product.quantity).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="flex justify-end mt-8">
          <div className="w-full sm:w-1/2 md:w-1/3 space-y-4">
             <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-medium">BDT {subtotal.toLocaleString()}</span>
            </div>
             <div className="flex justify-between">
                <span>Shipping</span>
                <span className="font-medium">BDT {(parseInt(order.amount) - subtotal).toLocaleString()}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-xl font-bold">
                <span>Total</span>
                <span>BDT {parseInt(order.amount).toLocaleString()}</span>
            </div>
          </div>
        </section>

        <footer className="mt-16 text-center text-gray-500 border-t pt-8">
          <p>Thank you for your business!</p>
          <p>Questions? Contact us at support@rodelas.com</p>
           <div className="mt-8 no-print">
              <Button onClick={() => window.print()}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print Invoice
              </Button>
            </div>
        </footer>
      </div>
    </div>
  );
}
