export interface GalleryImage {
  id?: number;
  image: string;
}

// Slots use the same ordered positions as the admin form, including legacy data.
export function planProductGallery(
  existing: GalleryImage[],
  uploads: Array<string | null>,
  deletedIds: number[],
  replaceAll: boolean,
): GalleryImage[] {
  return Array.from({ length: 5 }, (_, index) => {
    if (uploads[index]) return { image: uploads[index]! };
    const old = existing[index];
    if (replaceAll || !old || (old.id !== undefined && deletedIds.includes(old.id))) return null;
    return old;
  }).filter((image): image is GalleryImage => image !== null);
}
