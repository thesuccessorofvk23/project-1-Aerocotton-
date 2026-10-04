import type { Product } from "./types";

export const PRODUCT_TAXONOMY = [
  {
    department: "Table",
    categories: [
      "Table Cloth",
      "Table Runners",
      "Placemats",
      "Napkins",
      "Tea Cozies",
      "Chair Pad",
      "Chair Pad–Shell",
      "Chair Cover",
      "Chair Mats",
      "Doilies",
      "Table Skirting",
      "Floor Cushions",
      "Seat Cushions",
      "Blankets",
      "Throws",
      "Coated Table cloths",
    ],
  },
  {
    department: "Kitchen & Dining",
    categories: [
      "Aprons",
      "Oven Mittens",
      "Pot Holder",
      "Tea Towels",
      "Double Oven Glove",
      "Duck Mouth Glove",
      "Bread basket",
      "Hand Kerchiefs",
      "Terry Towels",
      "Coasters",
      "Dish Cloths",
      "Dish Towels",
    ],
  },
  {
    department: "Beddings",
    categories: [
      "Duvet Covers",
      "Bed Spreads",
      "Bed Comforters",
      "Bed Skirts",
      "Bed Throws",
      "Pillow Cover",
      "Bed Sheets",
      "Cushions and Covers",
      "Curtains",
      "Curtains valance",
      "Quilts",
    ],
  },
  {
    department: "Functional Fibres Articles",
    categories: [
      "Linen Tablecloth",
      "Linen / Cotton Tablecloth",
      "Linen Kitchen Cloths",
      "Linen / Cotton Kitchen Cloths",
      "Organic Cotton",
      "Textile Swatches",
    ],
  },
  {
    department: "Miscellaneous",
    categories: [
      "Scarf",
      "Wool Items",
      "Velvet Items",
      "Wine Bags",
      "Stone Works",
      "Bamboo Items",
      "Voile Curtains",
      "Shopping Bags",
      "Peg Bags",
      "Jute Articles",
      "Ironing Pads",
      "Tote Bag",
      "Hang Tags",
    ],
  },
] as const;

export type ProductDepartment = (typeof PRODUCT_TAXONOMY)[number]["department"];
export type ProductCategory = (typeof PRODUCT_TAXONOMY)[number]["categories"][number];

const SOURCE_TYPE_MAP: Record<string, { department: ProductDepartment; productType: ProductCategory }> = {
  "Apron with Gloves": { department: "Kitchen & Dining", productType: "Aprons" },
  Blankets: { department: "Table", productType: "Blankets" },
  "Chair Pads": { department: "Table", productType: "Chair Pad" },
  "Cloth Bags": { department: "Miscellaneous", productType: "Tote Bag" },
  "Cloth Materials": { department: "Functional Fibres Articles", productType: "Textile Swatches" },
  Cushions: { department: "Beddings", productType: "Cushions and Covers" },
  "Hang Tags": { department: "Miscellaneous", productType: "Hang Tags" },
  Napkins: { department: "Table", productType: "Napkins" },
  Pillows: { department: "Beddings", productType: "Pillow Cover" },
  "Place Mats": { department: "Table", productType: "Placemats" },
  "Printed Table Runners": { department: "Table", productType: "Table Runners" },
  "Table Top Cover": { department: "Table", productType: "Table Cloth" },
  Towels: { department: "Kitchen & Dining", productType: "Tea Towels" },
};

export function classifyProduct(product: Product): Product {
  const classification = SOURCE_TYPE_MAP[product.productType];
  if (!classification) {
    throw new Error(`No product taxonomy mapping for source type: ${product.productType}`);
  }
  return { ...product, ...classification };
}