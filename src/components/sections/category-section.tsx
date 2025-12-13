"use client";

import { useState } from "react";
import { Product, Category } from "@/lib/data";
import { ProductCard } from "./product-card";
import { Button } from "@/components/ui/button";

interface CategorySectionProps {
    category: Category;
    products: Product[];
}

export function CategorySection({ category, products }: CategorySectionProps) {
    const [showAll, setShowAll] = useState(false);
    const INITIAL_LIMIT = 8;
    const displayedProducts = showAll ? products : products.slice(0, INITIAL_LIMIT);
    const hasMore = products.length > INITIAL_LIMIT;

    return (
        <section id={category.id} className="scroll-mt-20">
            <h2 className="text-3xl md:text-4xl mb-8 text-center">{category.name}</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
                {displayedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
            {hasMore && !showAll && (
                <div className="mt-8 flex justify-center">
                    <Button onClick={() => setShowAll(true)} variant="outline" size="lg">
                        Load More
                    </Button>
                </div>
            )}
        </section>
    );
}
