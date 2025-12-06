'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DollarSign, ShoppingBag, Users, Activity, Package, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

const recentOrders = [
    { id: 'ORD001', customer: 'Sadia Islam', amount: '2,800', status: 'Delivered', products: [{ name: 'Classic Cotton Three-Piece', quantity: 1, price: 2800 }] },
    { id: 'ORD002', customer: 'Karim Ahmed', amount: '1,200', status: 'Shipped', products: [{ name: 'Premium Silk Hijab', quantity: 1, price: 1200 }] },
    { id: 'ORD003', customer: 'Nusrat Jahan', amount: '4,500', status: 'Processing', products: [{ name: 'Modern Silk Three-Piece', quantity: 1, price: 4500 }] },
    { id: 'ORD004', customer: 'Rahim Sheikh', amount: '3,500', status: 'Pending', products: [{ name: 'Floral Print Bedsheet', quantity: 1, price: 3500 }] },
    { id: 'ORD005', customer: 'Farhana Begum', amount: '800', status: 'Cancelled', products: [{ name: 'Soft Cotton Hijab', quantity: 1, price: 800 }] },
];

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col">
      <header className="flex h-16 items-center border-b bg-background px-6 shrink-0">
          <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
      </header>
      <main className="flex-1 p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">BDT 12,540</div>
              <p className="text-xs text-muted-foreground">+5.2% from yesterday</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Orders</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+7</div>
              <p className="text-xs text-muted-foreground">+10% from yesterday</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">Items need restocking</p>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Inquiries</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground">Waiting for a response</p>
            </CardContent>
          </Card>
        </div>
        <Card className="mt-6">
            <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>A list of the last 5 orders.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Order ID</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Order Details</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {recentOrders.map(order => (
                             <TableRow key={order.id}>
                                <TableCell className="font-medium">{order.id}</TableCell>
                                <TableCell>{order.customer}</TableCell>
                                <TableCell>
                                    <Select defaultValue={order.status}>
                                        <SelectTrigger className="w-[120px]">
                                            <SelectValue placeholder="Status" />
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
                                <TableCell className="text-right">
                                     <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" size="sm">View Order</Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[425px]">
                                            <DialogHeader>
                                                <DialogTitle>Order {order.id}</DialogTitle>
                                                <DialogDescription>
                                                    Products ordered by {order.customer}.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="grid gap-4 py-4">
                                                {order.products.map((product, index) => (
                                                    <div key={index} className="flex justify-between items-center">
                                                        <div>
                                                            <p className="font-medium">{product.name}</p>
                                                            <p className="text-sm text-muted-foreground">Quantity: {product.quantity}</p>
                                                        </div>
                                                        <p className="text-sm font-medium">BDT {(product.price * product.quantity).toLocaleString()}</p>
                                                    </div>
                                                ))}
                                            </div>
                                             <div className="flex justify-between items-center font-bold border-t pt-4">
                                                <p>Total</p>
                                                <p>BDT {order.amount}</p>
                                            </div>
                                            <DialogFooter>
                                                <Button onClick={() => window.print()}>
                                                    <Printer className="mr-2 h-4 w-4" />
                                                    Print Invoice
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
