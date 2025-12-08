
'use client';

import { useState } from 'react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Pencil, Trash } from 'lucide-react';

type ShippingMethod = {
  id: string;
  name: string;
  cost: number;
  estimatedTime: string;
  isActive: boolean;
};

const initialMethods: ShippingMethod[] = [
    { id: 'sm-1', name: 'Inside Rajshahi', cost: 60, estimatedTime: '24-48 Hours', isActive: true },
    { id: 'sm-2', name: 'Inside Dhaka', cost: 120, estimatedTime: '2-3 Days', isActive: true },
    { id: 'sm-3', name: 'Nationwide (Outside Dhaka)', cost: 150, estimatedTime: '3-5 Days', isActive: true },
    { id: 'sm-4', name: 'Express Delivery (Dhaka Only)', cost: 250, estimatedTime: '24 Hours', isActive: false },
];

export default function AdminShippingPage() {
  const [methods, setMethods] = useState<ShippingMethod[]>(initialMethods);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<ShippingMethod | null>(null);
  const [methodToDelete, setMethodToDelete] = useState<ShippingMethod | null>(null);
  const { toast } = useToast();
  
  const handleOpenForm = (method: ShippingMethod | null = null) => {
    setEditingMethod(method);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setEditingMethod(null);
    setIsFormOpen(false);
  };
  
  const handleSaveMethod = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = formData.get('name') as string;
    const cost = parseFloat(formData.get('cost') as string);
    const estimatedTime = formData.get('estimatedTime') as string;
    const isActive = formData.get('isActive') === 'on';

    if (!name || isNaN(cost)) {
        toast({ variant: 'destructive', title: 'Error', description: 'Method name and a valid cost are required.' });
        return;
    }
    
    if (editingMethod) {
      setMethods(methods.map(m => 
        m.id === editingMethod.id ? { ...editingMethod, name, cost, estimatedTime, isActive } : m
      ));
      toast({ title: 'Success', description: 'Shipping method updated successfully.' });
    } else {
      const newMethod: ShippingMethod = {
          id: `sm-${Date.now()}`,
          name,
          cost,
          estimatedTime,
          isActive
      };
      setMethods([...methods, newMethod]);
      toast({ title: 'Success', description: 'New shipping method added.' });
    }
    handleCloseForm();
  };

  const handleDeleteMethod = (methodId: string) => {
    setMethods(methods.filter(m => m.id !== methodId));
    setMethodToDelete(null);
    toast({ variant: 'destructive', title: 'Deleted', description: 'Shipping method has been removed.' });
  }

  const handleStatusToggle = (methodId: string, isActive: boolean) => {
      setMethods(methods.map(m => m.id === methodId ? { ...m, isActive } : m));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Shipping Methods</h1>
        <Button onClick={() => handleOpenForm()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Shipping Method
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage Shipping Options</CardTitle>
          <CardDescription>
            Configure delivery methods and charges for your store.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Method Name</TableHead>
                  <TableHead>Cost/Charge</TableHead>
                  <TableHead>Estimated Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {methods.map(method => (
                  <TableRow key={method.id}>
                    <TableCell className="font-medium">{method.name}</TableCell>
                    <TableCell>BDT {method.cost.toLocaleString()}</TableCell>
                    <TableCell>{method.estimatedTime}</TableCell>
                    <TableCell>
                        <Switch
                            checked={method.isActive}
                            onCheckedChange={(checked) => handleStatusToggle(method.id, checked)}
                            aria-label="Toggle method status"
                        />
                    </TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenForm(method)}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => setMethodToDelete(method)}>
                            <Trash className="h-4 w-4" />
                        </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Add/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <form onSubmit={handleSaveMethod}>
            <DialogHeader>
              <DialogTitle>{editingMethod ? 'Edit Shipping Method' : 'Add New Shipping Method'}</DialogTitle>
              <DialogDescription>
                {editingMethod ? 'Update the details of this shipping option.' : 'Fill in the details for a new shipping option.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input id="name" name="name" defaultValue={editingMethod?.name} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="cost" className="text-right">
                  Cost (BDT)
                </Label>
                <Input id="cost" name="cost" type="number" defaultValue={editingMethod?.cost} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="estimatedTime" className="text-right">
                  Est. Time
                </Label>
                <Input id="estimatedTime" name="estimatedTime" defaultValue={editingMethod?.estimatedTime} className="col-span-3" placeholder="e.g., 2-3 Days"/>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                 <Label htmlFor="isActive" className="text-right">
                  Is Active
                </Label>
                 <div className="col-span-3">
                    <Switch id="isActive" name="isActive" defaultChecked={editingMethod?.isActive ?? true} />
                 </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseForm}>Cancel</Button>
              <Button type="submit">Save Method</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation */}
      <AlertDialog open={!!methodToDelete} onOpenChange={() => setMethodToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the shipping method
              "{methodToDelete?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMethodToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => methodToDelete && handleDeleteMethod(methodToDelete.id)}>
              Yes, delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}

