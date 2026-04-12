export type CatalogItemType = 'service' | 'product' | 'inventory';

export type CatalogListItem = {
  id: string;
  itemType: CatalogItemType;
  name: string;
  description: string | null;
  sku: string | null;
  unit: string | null;
  unitPrice: number;
  defaultTaxRate: number | null;
  stockQuantity: number | null;
  costPrice: number | null;
  updatedAt: string;
};
