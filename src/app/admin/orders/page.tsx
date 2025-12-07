
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import { recentOrders, type Order } from '@/lib/data';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  useEffect(() => {
    setOrders(recentOrders);
  }, []);

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'all') return orders;
    return orders.filter(order => order.status === statusFilter);
  }, [orders, statusFilter]);

  const handleStatusChange = (orderId: string, newStatus: Order['status']) => {
    setOrders(currentOrders => 
        currentOrders.map(o => 
            o.id === orderId ? { ...o, status: newStatus } : o
        )
    );
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Orders</h1>
      </div>
      <div className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Order Management</CardTitle>
            <CardDescription>
              View and manage all customer orders.
            </CardDescription>
            <div className="mt-4 grid sm:grid-cols-2 md:grid-cols-3 gap-4">
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{order.customer}</TableCell>
                    <TableCell>{order.date}</TableCell>
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
                    <TableCell className="text-right">
                      BDT {parseInt(order.amount).toLocaleString()}
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
                          <DropdownMenuItem onSelect={() => setSelectedOrder(order)}>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="sm:max-w-lg">
              {selectedOrder && (
                  <>
                      <DialogHeader>
                          <DialogTitle>Order Details: {selectedOrder.id}</DialogTitle>
                          <DialogDescription>
                              Full details for the order placed on {selectedOrder.date}.
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
                                  {selectedOrder.products.map((product, index) => (
                                      <li key={index} className="flex justify-between items-center">
                                          <span>{product.name} (x{product.quantity})</span>
                                          <span className="font-medium">BDT {(product.price * product.quantity).toLocaleString()}</span>
                                      </li>
                                  ))}
                              </ul>
                          </div>
                          <Separator />
                          <div className="flex justify-between font-bold text-base">
                              <span>Total Amount</span>
                              <span>BDT {parseInt(selectedOrder.amount).toLocaleString()}</span>
                          </div>
                      </div>
                      <DialogFooter>
                          <Button variant="outline" onClick={() => setSelectedOrder(null)}>Close</Button>
                      </DialogFooter>
                  </>
              )}
          </DialogContent>
      </Dialog>
    </>
  );
}
