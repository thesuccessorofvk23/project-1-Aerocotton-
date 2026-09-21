import Link from "next/link";
import { editorialImage } from "@/lib/editorial";

export function ProductCard({
  product,
  href,
}: {
  product: { name: string; tagline: string; image: string; collectionName: string };
  href: string;
}) {
  return (
    <Link href={href} className="group block">
      <div className="aspect-[4/5] overflow-hidden border border-hairline bg-cotton">
        <img
          src={editorialImage(product.collectionName)}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-700 ease-out-soft group-hover:scale-[1.04]"
        />
      </div>
      <p className="mt-4 text-2xs uppercase tracking-[0.2em] text-brass-deep">
        {product.collectionName}
      </p>
      <h3 className="font-display mt-1 text-xl text-ink">{product.name}</h3>
      <p className="mt-1 text-sm text-umber">{product.tagline}</p>
    </Link>
  );
}
