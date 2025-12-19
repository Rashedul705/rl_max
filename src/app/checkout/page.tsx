'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/components/cart/cart-context';
import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Plus, Minus } from 'lucide-react';
import { bangladeshDistricts } from '@/lib/data';
import { sendEmail } from '@/ai/flows/send-email-flow';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';


const formSchema = z.object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters.'),
    phoneNumber: z.string().regex(/^01[0-9]{9}$/, 'Please enter a valid 11-digit phone number starting with 01.'),
    city: z.string().min(1, 'Please select a district.'),
    fullAddress: z.string().min(10, 'Full address must be at least 10 characters.'),
});

export default function CheckoutPage() {
    const { cart, clearCart, removeFromCart, updateQuantity } = useCart();
    const { toast } = useToast();
    const router = useRouter();
    const [shippingCharge, setShippingCharge] = useState<number | null>(null);

    const subtotal = cart.reduce(
        (acc, item) => acc + item.product.price * item.quantity,
        0
    );

    const total = subtotal + (shippingCharge ?? 0);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            fullName: '',
            phoneNumber: '',
            city: '',
            fullAddress: '',
        },
    });
    console.log("Form Errors:", form.formState.errors);

    const selectedCity = form.watch('city');

    useEffect(() => {
        if (selectedCity === 'Rajshahi') {
            setShippingCharge(60);
        } else if (selectedCity) {
            setShippingCharge(120);
        } else {
            setShippingCharge(null);
        }
    }, [selectedCity]);


    async function onSubmit(values: z.infer<typeof formSchema>) {
        console.log("DEBUG: onSubmit called with values:", values);
        const orderId = `ORD${Math.floor(1000 + Math.random() * 9000)}`; // 4 digit random ID

        const orderData = {
            id: orderId, // Store the custom ID
            customer: values.fullName,
            phone: values.phoneNumber,
            address: `${values.fullAddress}, ${values.city}`,
            amount: total.toString(),
            status: 'Pending',
            products: cart.map(item => ({
                name: item.product.name,
                quantity: item.quantity,
                price: item.product.price,
                image: item.product.image // Keep image for display if needed
            })),
            date: new Date().toISOString(),
            createdAt: serverTimestamp(), // Use server timestamp for sorting
            shippingInfo: values, // Keep full shipping info object just in case
            subtotal,
            shippingCharge
        };

        try {
            // Save to Firestore with timeout
            console.log("Attempting to save order to Firestore...");
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Firestore operation timed out")), 5000)
            );

            await Promise.race([
                addDoc(collection(db, 'orders'), orderData),
                timeoutPromise
            ]);

            console.log("Order Saved to Firestore:", orderData);

            // Send email notification (kept as is)
            try {
                const emailHtml = `
                    <h1>New Order Received!</h1>
                    <p><strong>Order ID:</strong> ${orderId}</p>
                    <p><strong>Customer:</strong> ${values.fullName}</p>
                    <p><strong>Phone:</strong> ${values.phoneNumber}</p>
                    <p><strong>Address:</strong> ${values.fullAddress}, ${values.city}</p>
                    <h2>Order Items:</h2>
                    <ul>
                        ${cart.map(item => `<li>${item.product.name} (x${item.quantity}) - BDT ${item.product.price * item.quantity}</li>`).join('')}
                    </ul>
                    <h3>Subtotal: BDT ${subtotal.toLocaleString()}</h3>
                    <h3>Shipping: BDT ${shippingCharge?.toLocaleString() ?? 'N/A'}</h3>
                    <h2>Total: BDT ${total.toLocaleString()}</h2>
                `;
                // await sendEmail(...) 
            } catch (emailError) {
                console.error("Failed to send order notification email:", emailError);
            }

            toast({
                title: 'Order Placed!',
                description: `Your order ${orderId} has been placed successfully.`,
            });

        } catch (error) {
            console.warn("Firestore unreachable (timeout/network), switching to Offline Mode. Error:", error);

            // Fallback: Save to Local Storage
            const offlineOrders = JSON.parse(localStorage.getItem('offline_orders') || '[]');
            // Add a flag to indicate it's offline
            const offlineOrder = { ...orderData, isOffline: true };
            offlineOrders.push(offlineOrder);
            localStorage.setItem('offline_orders', JSON.stringify(offlineOrders));

            toast({
                title: 'Order Saved Locally',
                description: 'Network issue detected. Your order has been saved to your device.',
                variant: "default"
            });
        } finally {
            // Always complete the flow
            clearCart();
            router.push(`/thank-you?orderId=${orderId}`);
        }
    }

    if (cart.length === 0 && subtotal === 0) {
        return (
            <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-1 flex items-center justify-center text-center">
                    <div>
                        <h1 className="text-2xl font-semibold mb-4">Your Cart is Empty</h1>
                        <p className="text-muted-foreground mb-8">You can't proceed to checkout without any items.</p>
                        <Button onClick={() => router.push('/')}>Go Shopping</Button>
                    </div>
                </main>
                <Footer />
            </div>
        )
    }

    return (
        <div className="flex flex-col min-h-screen bg-muted/30">
            <Header />
            <main className="flex-1 py-8 md:py-12">
                <div className="container mx-auto px-4">
                    <h1 className="text-3xl md:text-4xl font-bold text-center mb-8">Checkout</h1>
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                        {/* Shipping Details */}
                        <div className="lg:col-span-3">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Shipping Information</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Form {...form}>
                                        <form onSubmit={form.handleSubmit(onSubmit)} id="checkout-form" className="space-y-6">
                                            <FormField
                                                control={form.control}
                                                name="fullName"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Full Name</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="e.g. Jane Doe" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="phoneNumber"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Phone Number</FormLabel>
                                                        <FormControl>
                                                            <Input type="tel" placeholder="e.g. 01712345678" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="city"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>City / District</FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select your district" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {bangladeshDistricts.map((district) => (
                                                                    <SelectItem key={district} value={district}>
                                                                        {district}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="fullAddress"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Full Address</FormLabel>
                                                        <FormControl>
                                                            <Textarea placeholder="e.g. House 123, Road 4, Sector 5, City" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </form>
                                    </Form>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-2">
                            <Card className="sticky top-24">
                                <CardHeader>
                                    <CardTitle>Order Summary</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-3">
                                        {cart.map(item => (
                                            <div key={item.product.id} className="flex items-center gap-4">
                                                <div className="relative h-16 w-16 rounded-md overflow-hidden">
                                                    <Image
                                                        src={item.product.image}
                                                        alt={item.product.name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium leading-tight">{item.product.name}</p>
                                                    <div className="flex items-center mt-1">
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-6 w-6 text-red-500 hover:bg-red-500 hover:text-white"
                                                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                                        >
                                                            <Minus className="h-3 w-3" />
                                                        </Button>
                                                        <Input
                                                            type="number"
                                                            value={item.quantity}
                                                            onChange={(e) => {
                                                                const value = parseInt(e.target.value);
                                                                if (value > 0) {
                                                                    updateQuantity(item.product.id, value)
                                                                }
                                                            }}
                                                            className="h-6 w-10 rounded-none border-x-0 text-center px-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                        />
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-6 w-6 text-[#00846E] hover:bg-[#00846E] hover:text-white"
                                                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                                            disabled={item.quantity >= item.product.stock}
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="text-sm font-medium">
                                                    {(item.product.price * item.quantity).toLocaleString()}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <Separator />
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span>Subtotal</span>
                                            <span>BDT {subtotal.toLocaleString()}</span>
                                        </div>
                                        {shippingCharge !== null && (
                                            <div className="flex justify-between">
                                                <span>Shipping</span>
                                                <span>BDT {shippingCharge.toLocaleString()}</span>
                                            </div>
                                        )}
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between font-bold text-lg">
                                        <span>Total</span>
                                        <span>BDT {total.toLocaleString()}</span>
                                    </div>
                                    <Separator />
                                    <div>
                                        <h3 className="font-semibold mb-2">Payment Method</h3>
                                        <div className="rounded-md border border-primary bg-primary/10 p-4 text-center">
                                            <p className="font-medium text-primary">Cash on Delivery</p>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button
                                        type="button"
                                        className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                                        onClick={(e) => {
                                            console.log("DEBUG: Button clicked");
                                            form.handleSubmit(
                                                onSubmit,
                                                (errors) => console.log("DEBUG: Validation errors:", errors)
                                            )(e);
                                        }}
                                        disabled={form.formState.isSubmitting}
                                    >
                                        Place Order
                                    </Button>
                                </CardFooter>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
