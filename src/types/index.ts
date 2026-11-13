
export interface Product {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  minStock: number;
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  sellingPrice: number;
  total: number;
}

export interface Sale {
  id: string;
  items: SaleItem[];
  totalAmount: number;
  createdAt: string;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  purchasePrice: number;
  total: number;
}

export interface Purchase {
  id: string;
  items: PurchaseItem[];
  totalAmount: number;
  createdAt: string;
}
export interface CashTransaction {
  id: string;
  type: "income" | "expense";
  description: string;
  amount: number;
  category: string;
  createdAt: string;
}