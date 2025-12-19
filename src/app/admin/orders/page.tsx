
'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Printer, Search } from 'lucide-react';
import { recentOrders, type Order } from '@/lib/data';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, getDocs, where } from 'firebase/firestore';
import { Input } from '@/components/ui/input';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);

  // Separate state for Firestore and Local orders to handle updates independently
  const [firestoreOrders, setFirestoreOrders] = useState<Order[]>([]);
  const [localOrders, setLocalOrders] = useState<Order[]>([]);

  // 1. Subscribe to Firestore
  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedOrders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];

      const normalized: Order[] = fetchedOrders.map(order => ({
        id: order.id,
        customer: order.customer,
        phone: order.phone,
        address: order.address,
        amount: order.amount,
        status: order.status,
        products: order.products,
        date: order.date,
      }));
      setFirestoreOrders(normalized);
    });
    return () => unsubscribe();
  }, []);

  // 2. Subscribe to Local Storage (Offline Orders)
  useEffect(() => {
    const loadLocalOrders = () => {
      const offline = JSON.parse(localStorage.getItem('offline_orders') || '[]');
      setLocalOrders(offline);
    };

    // Initial load
    loadLocalOrders();

    // Listen for changes from other tabs
    window.addEventListener('storage', loadLocalOrders);

    // Listen for window focus to ensure freshness (e.g. user switches back to tab)
    window.addEventListener('focus', loadLocalOrders);

    return () => {
      window.removeEventListener('storage', loadLocalOrders);
      window.removeEventListener('focus', loadLocalOrders);
    };
  }, []);

  // 3. Merge Orders whenever sources change
  useEffect(() => {
    // Combine and sort by date descending
    // We prioritize Firestore orders if IDs match (though in this case IDs should be unique enough or offline ones are distinct)
    // Actually, offline orders might eventually be synced to Firestore. 
    // For now, valid to just concat, but let's de-duplicate by ID just in case.
    const all = [...firestoreOrders, ...localOrders];

    // De-duplicate by ID (taking the first occurrence found)
    const uniqueMap = new Map();
    all.forEach(o => {
      if (!uniqueMap.has(o.id)) {
        uniqueMap.set(o.id, o);
      }
    });

    const sorted = Array.from(uniqueMap.values()).sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    setOrders(sorted);
  }, [firestoreOrders, localOrders]);



  const filteredOrders = useMemo(() => {
    const lowercasedQuery = searchQuery.toLowerCase();
    return orders.filter(order => {
      const statusMatch = statusFilter === 'all' || order.status === statusFilter;
      const searchMatch = !lowercasedQuery ||
        order.id.toLowerCase().includes(lowercasedQuery) ||
        order.phone.replace(/[\s-]/g, '').includes(lowercasedQuery.replace(/[\s-]/g, ''));
      return statusMatch && searchMatch;
    });
  }, [orders, statusFilter, searchQuery]);

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    // Optimistic update
    setOrders(currentOrders =>
      currentOrders.map(o =>
        // The orderId in the list comes from doc.id or data.id. 
        // Our checkout saves `id` inside the doc which matches our random ID.
        // However, for updateDoc we need the Firestore document ID.
        // Since we query collection and map doc.id => id only if data.id is not present, 
        // but we actually need to know which document to update.
        // Wait, standardizing: In the snapshot mapping above:
        // `id: doc.id` replaces the `id` inside the data if we are not careful.
        // Let's look at checkout: `await addDoc(collection(db, 'orders'), orderData);`
        // `orderData` has a custom `id` field (e.g. ORD1234). 
        // `addDoc` creates a random document ID (e.g. "AbCdEfGh").
        // Admin panel needs to update the document by "AbCdEfGh", but visualize "ORD1234".
        // Strategy: The listener needs to keep track of the Document ID.
        // Let's fix the useEffect mapping first.
        o.id === orderId ? { ...o, status: newStatus } : o
      )
    );

    try {
      // Find the document ID. Since our `orders` items might use "ORD..." as id which is NOT the doc id.
      // We actually need the doc id to update.
      // Let's querying for it is inefficient. 
      // BETTER APPROACH: Include `docId` in our Order type locally or just use one ID.
      // To simplify without changing types too much:
      // Let's search for the order in current list (which should have the docId hidden or we need to fetch it).
      // Actually, let's fix the fetching logic to include a hidden `docId` property or similar.
      // Wait, standard types are defined in `data.ts` and used everywhere.
      // Modifying `Order` type in `data.ts` is cleaner.
      // But for now, let's query the collection where `id` == orderId.

      // Alternative: When we map in useEffect, we can find the doc id. 
      // BUT my useEffect logic was: `id: doc.id`. 
      // If checkout saves `id: 'ORD1234'`, then `...doc.data()` overwrites `id` with 'ORD1234'.
      // So `order.id` is 'ORD1234'. We lost the document ID.

      // I will revise the useEffect to query properly below.

      // For now, assume we will fix the data mapping.
      // We can't easily find the doc ref without the doc ID. 
      // I'll query where 'id' == orderId.
      const q = query(collection(db, 'orders'), where('id', '==', orderId));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const docRef = querySnapshot.docs[0].ref;
        await updateDoc(docRef, { status: newStatus });
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    // Optimistic delete
    setOrders(currentOrders => currentOrders.filter(o => o.id !== orderId));
    setOrderToDelete(null);

    try {
      const q = query(collection(db, 'orders'), where('id', '==', orderId));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        await deleteDoc(querySnapshot.docs[0].ref);
      }
    } catch (error) {
      console.error("Error deleting order:", error);
    }
  };

  const handlePrintInvoice = (order: Order) => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
      const isInsideDhaka = order.address.toLowerCase().includes('dhaka');
      const shippingCharge = isInsideDhaka ? 60 : 120;
      const subTotal = parseInt(order.amount);
      const grandTotal = (subTotal + shippingCharge).toLocaleString();
      const formattedSubTotal = subTotal.toLocaleString();
      const orderDate = new Date(order.date).toLocaleDateString();

      const invoiceHtml = `
        <html>
          <head>
            <title>Invoice - ${order.id}</title>
            <style>
              body { 
                font-family: 'monospace', sans-serif; 
                width: 80mm; 
                margin: 0 auto;
                padding: 10px;
                font-size: 12px;
              }
              .header { text-align: center; margin-bottom: 20px; }
              .header h2 { margin: 0; font-size: 16px; font-weight: bold; }
              .header p { margin: 5px 0 0; font-size: 12px; }
              .section { margin-bottom: 15px; }
              .section-title { border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 5px 0; margin: 10px 0; font-weight: bold; }
              table { width: 100%; border-collapse: collapse; }
              th, td { text-align: left; padding: 4px 0; }
              .text-right { text-align: right; }
              .totals-table td { padding: 2px 0; }
              .footer { text-align: center; margin-top: 20px; border-top: 1px dashed #000; padding-top: 10px;}
            </style>
          </head>
          <body>
            <div class="header">
              <h2>Rodelas lifestyle</h2>
              <p>Your destination for premium apparel</p>
            </div>
            <div class="section">
              <p><strong>Order ID:</strong> ${order.id}</p>
              <p><strong>Date:</strong> ${orderDate}</p>
            </div>
            <div class="section">
                <p><strong>Customer:</strong> ${order.customer}</p>
                <p><strong>Phone:</strong> ${order.phone}</p>
                <p><strong>Address:</strong> ${order.address}</p>
            </div>
            <div class="section-title">ITEMS</div>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                ${order.products.map(p => `
                  <tr>
                    <td>
                      ${p.quantity} x ${p.name}<br/>
                      <span style="font-size: 10px; color: #555;">@ ${p.price.toLocaleString()}</span>
                    </td>
                    <td class="text-right">${(p.quantity * p.price).toLocaleString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="section-title">TOTALS</div>
             <table class="totals-table">
                <tbody>
                    <tr>
                        <td>Subtotal:</td>
                        <td class="text-right">${formattedSubTotal}</td>
                    </tr>
                    <tr>
                        <td>Shipping:</td>
                        <td class="text-right">${shippingCharge}</td>
                    </tr>
                     <tr>
                        <td><strong>Total:</strong></td>
                        <td class="text-right"><strong>BDT ${grandTotal}</strong></td>
                    </tr>
                </tbody>
            </table>
            <div class="footer">
              <p>Thank you for your purchase!</p>
              <p>www.rodelaslifestyle.com</p>
            </div>
            <script>
              setTimeout(function() {
                window.print();
                // window.close(); // Optional: kept open for manual closing if needed
              }, 500);
            </script>
          </body>
        </html>
      `;
      printWindow.document.write(invoiceHtml);
      printWindow.document.close();
      printWindow.focus();
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Orders</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Order Management</CardTitle>
          <CardDescription>
            View and manage all customer orders.
          </CardDescription>
          <div className="mt-4 grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="search">Search Orders</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by Order ID or Phone Number..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status-filter">Filter by Status</Label>
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger id="status-filter" aria-label="Select status">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Processing">Processing</SelectItem>
                  <SelectItem value="Shipped">Shipped</SelectItem>
                  <SelectItem value="Delivered">Delivered</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead className="hidden sm:table-cell">Customer</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell className="hidden sm:table-cell">{order.customer}</TableCell>
                      <TableCell className="hidden md:table-cell">{new Date(order.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Select value={order.status} onValueChange={(newStatus: Order['status']) => handleStatusChange(order.id, newStatus)}>
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Update status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Processing">Processing</SelectItem>
                            <SelectItem value="Shipped">Shipped</SelectItem>
                            <SelectItem value="Delivered">Delivered</SelectItem>
                            <SelectItem value="Cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              aria-haspopup="true"
                              size="icon"
                              variant="ghost"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onSelect={() => setTimeout(() => setSelectedOrder(order), 100)}>
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onSelect={() => setTimeout(() => setOrderToDelete(order.id), 100)}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No orders found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="sm:max-w-lg">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle>Order Details: {selectedOrder.id}</DialogTitle>
                <DialogDescription>
                  Full details for the order placed on {new Date(selectedOrder.date).toLocaleDateString()}.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Customer Information</h4>
                  <div className="text-sm text-muted-foreground">
                    <p><strong>Name:</strong> {selectedOrder.customer}</p>
                    <p><strong>Phone:</strong> {selectedOrder.phone}</p>
                    <p><strong>Address:</strong> {selectedOrder.address}</p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <h4 className="font-semibold">Ordered Items</h4>
                  <ul className="space-y-2 text-sm">
                    {selectedOrder.products.map((product, index) => {
                      const productSlug = product.name.toLowerCase().replace(/\s+/g, '-');
                      return (
                        <li key={index} className="flex justify-between items-center">
                          <Link href={`/product/${productSlug}`} className="hover:underline" target="_blank" rel="noopener noreferrer">
                            <span>{product.name} (x{product.quantity})</span>
                          </Link>
                          <span className="font-medium">BDT {(product.price * product.quantity).toLocaleString()}</span>
                        </li>
                      )
                    })}
                  </ul>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-base">
                  <span>Total Amount</span>
                  <span>BDT {parseInt(selectedOrder.amount).toLocaleString()}</span>
                </div>
              </div>
              <DialogFooter>
                <Button variant="secondary" onClick={() => handlePrintInvoice(selectedOrder)}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print Invoice
                </Button>
                <Button variant="outline" onClick={() => setSelectedOrder(null)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!orderToDelete} onOpenChange={() => setOrderToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the order
              and remove its data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => orderToDelete && handleDeleteOrder(orderToDelete)}>
              Yes, delete order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
