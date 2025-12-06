
'use client';

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
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
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import Link from "next/link";
import { products, categories } from "@/lib/data";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function AdminProductsPage() {
    
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [showLowStock, setShowLowStock] = useState(false);

    const getCategoryName = (categoryId: string) => {
        const category = categories.find(c => c.id === categoryId);
        return category ? category.name : 'N/A';
    }

    const filteredProducts = products.filter(product => {
        const categoryMatch = selectedCategory === 'all' || product.category === selectedCategory;
        const stockMatch = !showLowStock || product.stock < 5;
        return categoryMatch && stockMatch;
    });

    return (
        <div className="flex flex-col">
            <header className="flex h-16 items-center justify-between border-b bg-background px-6 shrink-0">
                <h1 className="text-xl font-semibold tracking-tight">Products</h1>
                <Button asChild>
                    <Link href="/admin/products/new">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Product
                    </Link>
                </Button>
            </header>
            <main className="flex-1 p-6">
                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                            <div>
                                <CardTitle>All Products</CardTitle>
                                <CardDescription>Manage your products and view their sales performance.</CardDescription>
                            </div>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="low-stock" checked={showLowStock} onCheckedChange={(checked) => setShowLowStock(!!checked)} />
                                    <Label htmlFor="low-stock">Filter low stock</Label>
                                </div>
                                <div className="w-full sm:w-auto">
                                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                        <SelectTrigger className="w-full sm:w-[180px]">
                                            <SelectValue placeholder="Filter by category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Products</SelectItem>
                                            {categories.map(category => (
                                                <SelectItem key={category.id} value={category.id}>
                                                    {category.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="hidden w-[100px] sm:table-cell">Image</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Stock</TableHead>
                                    <TableHead className="text-right">Price</TableHead>
                                    <TableHead>
                                        <span className="sr-only">Actions</span>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredProducts.map(product => (
                                     <TableRow key={product.id}>
                                        <TableCell className="hidden sm:table-cell">
                                            <Image src={product.image} alt={product.name} width={60} height={60} className="rounded-md object-cover" />
                                        </TableCell>
                                        <TableCell className="font-medium">{product.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{getCategoryName(product.category)}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            {product.stock > 0 ? (
                                                <Badge variant={product.stock < 5 ? 'destructive' : 'secondary'}>{product.stock} in stock</Badge>
                                            ) : (
                                                <Badge variant="destructive">Out of stock</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">BDT {product.price.toLocaleString()}</TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">Toggle menu</span>
                                                </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem>Edit</DropdownMenuItem>
                                                <DropdownMenuItem>Delete</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
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
