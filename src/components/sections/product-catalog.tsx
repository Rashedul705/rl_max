import { products, categories } from "@/lib/data";
import { ProductCard } from "./product-card";
import { CategorySection } from "./category-section";

export function ProductCatalog() {
  return (
    <div className="bg-background">
      <div className="container pt-4 pb-16 md:pt-6 md:pb-24 space-y-16">
        {categories.map((category) => (
          <CategorySection
            key={category.id}
            category={category}
            products={products.filter((product) => product.category === category.id)}
          />
        ))}
      </div>
    </div>
  );
}
