const editorialImages = {
  nature: "/images/editorial/workshop-detail.jpg",
  mountain: "/images/editorial/woven-texture.jpg",
  beach: "/images/editorial/textile-interior.jpg",
  city: "/images/editorial/woven-texture.jpg",
  default: "/images/editorial/workshop-detail.jpg",
} as const;

export function editorialImage(key: string | undefined) {
  const normalized = key?.toLowerCase() ?? "";
  if (normalized.includes("nature")) return editorialImages.nature;
  if (normalized.includes("mountain")) return editorialImages.mountain;
  if (normalized.includes("beach")) return editorialImages.beach;
  if (normalized.includes("city")) return editorialImages.city;
  return editorialImages.default;
}
