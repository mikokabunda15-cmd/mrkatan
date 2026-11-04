import { v4 as uuidv4 } from 'uuid';

// Types
export interface User {
  id: string;
  full_name: string;
  username: string;
  password_hash: string;
  role: 'admin' | 'employee';
  created_at: string;
}

export interface Product {
  id: string;
  serial_number: string;
  product_name: string;
  category: string;
  colour: string;
  size: string;
  original_quantity: number;
  current_quantity: number;
  total_sold: number;
  purchase_price: number;
  selling_price: number;
  product_image: string;
  barcode_image: string;
  minimum_stock_level: number;
  created_at: string;
  updated_at: string;
  archived: boolean;
  last_restocked_at: string | null;
}

export interface Sale {
  id: string;
  transaction_reference: string;
  total_amount: number;
  user_id: string;
  created_at: string;
  status: 'completed' | 'reversed';
  items: SaleItem[];
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  serial_number: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Restock {
  id: string;
  product_id: string;
  product_name: string;
  serial_number: string;
  quantity_added: number;
  purchase_cost: number;
  supplier: string;
  user_id: string;
  created_at: string;
}

export interface StockMovement {
  id: string;
  product_id: string;
  product_name: string;
  serial_number: string;
  movement_type: 'sale' | 'restock' | 'adjustment' | 'initial';
  quantity_changed: number;
  previous_quantity: number;
  new_quantity: number;
  reference_id: string;
  user_id: string;
  notes: string;
  created_at: string;
}

export interface Settings {
  store_name: string;
  store_address: string;
  store_phone: string;
  currency: string;
  low_stock_threshold: number;
  critical_stock_threshold: number;
}

// Database keys
const DB_KEYS = {
  users: 'mks_users',
  products: 'mks_products',
  sales: 'mks_sales',
  restocks: 'mks_restocks',
  stock_movements: 'mks_stock_movements',
  settings: 'mks_settings',
  initialized: 'mks_initialized',
};

// Helper functions
function getFromDB<T>(key: string, defaultValue: T): T {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
}

function saveToDB<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// Initialize database with demo data
export function initializeDatabase(): void {
  if (localStorage.getItem(DB_KEYS.initialized)) return;

  // Default users (password: admin123 / emp123)
  const users: User[] = [
    {
      id: uuidv4(),
      full_name: 'Ketan Patel',
      username: 'admin',
      password_hash: btoa('admin123'),
      role: 'admin',
      created_at: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      full_name: 'Ravi Kumar',
      username: 'employee',
      password_hash: btoa('emp123'),
      role: 'employee',
      created_at: new Date().toISOString(),
    },
  ];

  // Categories
  const categories = ['Shirts', 'Trousers', 'Shoes', 'Jackets', 'T-Shirts', 'Jeans'];

  // Demo products - using proper MKS-XXX format serial numbers
  const demoProducts: Omit<Product, 'id' | 'created_at' | 'updated_at'>[] = [
    { serial_number: 'MKS-001', product_name: 'Black Formal Shirt', category: 'Shirts', colour: 'Black', size: 'L', original_quantity: 20, current_quantity: 15, total_sold: 5, purchase_price: 150, selling_price: 250, product_image: '', barcode_image: '', minimum_stock_level: 5, archived: false, last_restocked_at: null },
    { serial_number: 'MKS-002', product_name: 'White Formal Shirt', category: 'Shirts', colour: 'White', size: 'M', original_quantity: 25, current_quantity: 18, total_sold: 7, purchase_price: 140, selling_price: 240, product_image: '', barcode_image: '', minimum_stock_level: 5, archived: false, last_restocked_at: null },
    { serial_number: 'MKS-003', product_name: 'Blue Casual Shirt', category: 'Shirts', colour: 'Blue', size: 'XL', original_quantity: 15, current_quantity: 10, total_sold: 5, purchase_price: 160, selling_price: 280, product_image: '', barcode_image: '', minimum_stock_level: 4, archived: false, last_restocked_at: null },
    { serial_number: 'MKS-004', product_name: 'Navy Formal Trousers', category: 'Trousers', colour: 'Navy', size: 'L', original_quantity: 18, current_quantity: 12, total_sold: 6, purchase_price: 200, selling_price: 350, product_image: '', barcode_image: '', minimum_stock_level: 4, archived: false, last_restocked_at: null },
    { serial_number: 'MKS-005', product_name: 'Black Formal Trousers', category: 'Trousers', colour: 'Black', size: 'M', original_quantity: 20, current_quantity: 14, total_sold: 6, purchase_price: 190, selling_price: 340, product_image: '', barcode_image: '', minimum_stock_level: 4, archived: false, last_restocked_at: null },
    { serial_number: 'MKS-006', product_name: 'Grey Denim Jeans', category: 'Jeans', colour: 'Grey', size: 'L', original_quantity: 22, current_quantity: 16, total_sold: 6, purchase_price: 220, selling_price: 380, product_image: '', barcode_image: '', minimum_stock_level: 5, archived: false, last_restocked_at: null },
    { serial_number: 'MKS-007', product_name: 'Dark Blue Jeans', category: 'Jeans', colour: 'Dark Blue', size: 'XL', original_quantity: 15, current_quantity: 3, total_sold: 12, purchase_price: 230, selling_price: 400, product_image: '', barcode_image: '', minimum_stock_level: 5, archived: false, last_restocked_at: null },
    { serial_number: 'MKS-008', product_name: 'Brown Leather Jacket', category: 'Jackets', colour: 'Brown', size: 'L', original_quantity: 8, current_quantity: 5, total_sold: 3, purchase_price: 500, selling_price: 850, product_image: '', barcode_image: '', minimum_stock_level: 2, archived: false, last_restocked_at: null },
    { serial_number: 'MKS-009', product_name: 'Black Bomber Jacket', category: 'Jackets', colour: 'Black', size: 'XL', original_quantity: 10, current_quantity: 7, total_sold: 3, purchase_price: 450, selling_price: 780, product_image: '', barcode_image: '', minimum_stock_level: 3, archived: false, last_restocked_at: null },
    { serial_number: 'MKS-010', product_name: 'White Sneakers', category: 'Shoes', colour: 'White', size: 'M', original_quantity: 12, current_quantity: 8, total_sold: 4, purchase_price: 300, selling_price: 500, product_image: '', barcode_image: '', minimum_stock_level: 3, archived: false, last_restocked_at: null },
    { serial_number: 'MKS-011', product_name: 'Black Formal Shoes', category: 'Shoes', colour: 'Black', size: 'L', original_quantity: 15, current_quantity: 10, total_sold: 5, purchase_price: 350, selling_price: 580, product_image: '', barcode_image: '', minimum_stock_level: 3, archived: false, last_restocked_at: null },
    { serial_number: 'MKS-012', product_name: 'Red Cotton T-Shirt', category: 'T-Shirts', colour: 'Red', size: 'M', original_quantity: 30, current_quantity: 22, total_sold: 8, purchase_price: 80, selling_price: 150, product_image: '', barcode_image: '', minimum_stock_level: 8, archived: false, last_restocked_at: null },
    { serial_number: 'MKS-013', product_name: 'Black Cotton T-Shirt', category: 'T-Shirts', colour: 'Black', size: 'L', original_quantity: 35, current_quantity: 0, total_sold: 35, purchase_price: 80, selling_price: 150, product_image: '', barcode_image: '', minimum_stock_level: 8, archived: false, last_restocked_at: null },
    { serial_number: 'MKS-014', product_name: 'Green Polo Shirt', category: 'Shirts', colour: 'Green', size: 'S', original_quantity: 12, current_quantity: 2, total_sold: 10, purchase_price: 170, selling_price: 290, product_image: '', barcode_image: '', minimum_stock_level: 3, archived: false, last_restocked_at: null },
    { serial_number: 'MKS-015', product_name: 'Khaki Chinos', category: 'Trousers', colour: 'Khaki', size: 'M', original_quantity: 16, current_quantity: 11, total_sold: 5, purchase_price: 180, selling_price: 320, product_image: '', barcode_image: '', minimum_stock_level: 4, archived: false, last_restocked_at: null },
  ];

  const products: Product[] = demoProducts.map((p) => ({
    ...p,
    id: uuidv4(),
    created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  }));

  // Demo sales
  const sales: Sale[] = [];
  const restocks: Restock[] = [];
  const movements: StockMovement[] = [];

  // Generate some demo sales
  for (let i = 0; i < 12; i++) {
    const product = products[Math.floor(Math.random() * products.length)];
    const qty = Math.floor(Math.random() * 3) + 1;
    const saleDate = new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000);
    const sale: Sale = {
      id: uuidv4(),
      transaction_reference: `TXN-${String(1000 + i).padStart(5, '0')}`,
      total_amount: product.selling_price * qty,
      user_id: users[Math.floor(Math.random() * 2)].id,
      created_at: saleDate.toISOString(),
      status: 'completed',
      items: [{
        id: uuidv4(),
        sale_id: '',
        product_id: product.id,
        product_name: product.product_name,
        serial_number: product.serial_number,
        quantity: qty,
        unit_price: product.selling_price,
        subtotal: product.selling_price * qty,
      }],
    };
    sale.items[0].sale_id = sale.id;
    sales.push(sale);

    movements.push({
      id: uuidv4(),
      product_id: product.id,
      product_name: product.product_name,
      serial_number: product.serial_number,
      movement_type: 'sale',
      quantity_changed: -qty,
      previous_quantity: product.current_quantity + qty,
      new_quantity: product.current_quantity,
      reference_id: sale.id,
      user_id: sale.user_id,
      notes: `Sale: ${qty} units`,
      created_at: saleDate.toISOString(),
    });
  }

  // Generate some demo restocks
  for (let i = 0; i < 5; i++) {
    const product = products[Math.floor(Math.random() * products.length)];
    const qty = Math.floor(Math.random() * 15) + 5;
    const restockDate = new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000);
    const restock: Restock = {
      id: uuidv4(),
      product_id: product.id,
      product_name: product.product_name,
      serial_number: product.serial_number,
      quantity_added: qty,
      purchase_cost: product.purchase_price * qty,
      supplier: ['Supplier A', 'Supplier B', 'Wholesale Mart', 'Fashion Distributors'][Math.floor(Math.random() * 4)],
      user_id: users[0].id,
      created_at: restockDate.toISOString(),
    };
    restocks.push(restock);

    movements.push({
      id: uuidv4(),
      product_id: product.id,
      product_name: product.product_name,
      serial_number: product.serial_number,
      movement_type: 'restock',
      quantity_changed: qty,
      previous_quantity: product.current_quantity - qty,
      new_quantity: product.current_quantity,
      reference_id: restock.id,
      user_id: users[0].id,
      notes: `Restock: +${qty} units from ${restock.supplier}`,
      created_at: restockDate.toISOString(),
    });
  }

  // Default settings
  const settings: Settings = {
    store_name: 'Mr Ketan Fashion Store',
    store_address: 'Main Market Road, City Center',
    store_phone: '+265 999 123 456',
    currency: 'K',
    low_stock_threshold: 5,
    critical_stock_threshold: 2,
  };

  saveToDB(DB_KEYS.users, users);
  saveToDB(DB_KEYS.products, products);
  saveToDB(DB_KEYS.sales, sales);
  saveToDB(DB_KEYS.restocks, restocks);
  saveToDB(DB_KEYS.stock_movements, movements);
  saveToDB(DB_KEYS.settings, settings);
  localStorage.setItem(DB_KEYS.initialized, 'true');
}

// CRUD Operations
export const db = {
  // Users
  getUsers: (): User[] => getFromDB(DB_KEYS.users, []),
  getUserById: (id: string): User | undefined => getFromDB<User[]>(DB_KEYS.users, []).find(u => u.id === id),
  authenticate: (username: string, password: string): User | null => {
    const users = getFromDB<User[]>(DB_KEYS.users, []);
    const user = users.find(u => u.username === username && u.password_hash === btoa(password));
    return user || null;
  },

  // Products
  getProducts: (): Product[] => getFromDB(DB_KEYS.products, []),
  getProductById: (id: string): Product | undefined => getFromDB<Product[]>(DB_KEYS.products, []).find(p => p.id === id),
  getProductBySerial: (serial: string): Product | undefined => getFromDB<Product[]>(DB_KEYS.products, []).find(p => p.serial_number === serial),
  addProduct: (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Product => {
    const products = getFromDB<Product[]>(DB_KEYS.products, []);
    const newProduct: Product = {
      ...product,
      id: uuidv4(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    products.push(newProduct);
    saveToDB(DB_KEYS.products, products);
    return newProduct;
  },
  updateProduct: (id: string, updates: Partial<Product>): Product | null => {
    const products = getFromDB<Product[]>(DB_KEYS.products, []);
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) return null;
    products[idx] = { ...products[idx], ...updates, updated_at: new Date().toISOString() };
    saveToDB(DB_KEYS.products, products);
    return products[idx];
  },
  archiveProduct: (id: string): boolean => {
    const products = getFromDB<Product[]>(DB_KEYS.products, []);
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) return false;
    products[idx].archived = true;
    products[idx].updated_at = new Date().toISOString();
    saveToDB(DB_KEYS.products, products);
    return true;
  },

  // Sales
  getSales: (): Sale[] => getFromDB(DB_KEYS.sales, []),
  getSaleById: (id: string): Sale | undefined => getFromDB<Sale[]>(DB_KEYS.sales, []).find(s => s.id === id),
  addSale: (sale: Omit<Sale, 'id' | 'created_at'>): Sale => {
    const sales = getFromDB<Sale[]>(DB_KEYS.sales, []);
    const newSale: Sale = {
      ...sale,
      id: uuidv4(),
      created_at: new Date().toISOString(),
    };
    newSale.items = newSale.items.map(item => ({ ...item, sale_id: newSale.id, id: uuidv4() }));
    sales.push(newSale);
    saveToDB(DB_KEYS.sales, sales);
    return newSale;
  },
  reverseSale: (saleId: string): boolean => {
    const sales = getFromDB<Sale[]>(DB_KEYS.sales, []);
    const idx = sales.findIndex(s => s.id === saleId);
    if (idx === -1 || sales[idx].status === 'reversed') return false;
    sales[idx].status = 'reversed';
    saveToDB(DB_KEYS.sales, sales);

    // Restore stock
    const products = getFromDB<Product[]>(DB_KEYS.products, []);
    const movements = getFromDB<StockMovement[]>(DB_KEYS.stock_movements, []);

    for (const item of sales[idx].items) {
      const pIdx = products.findIndex(p => p.id === item.product_id);
      if (pIdx !== -1) {
        const prevQty = products[pIdx].current_quantity;
        products[pIdx].current_quantity += item.quantity;
        products[pIdx].total_sold -= item.quantity;
        products[pIdx].updated_at = new Date().toISOString();

        movements.push({
          id: uuidv4(),
          product_id: item.product_id,
          product_name: item.product_name,
          serial_number: item.serial_number,
          movement_type: 'adjustment',
          quantity_changed: item.quantity,
          previous_quantity: prevQty,
          new_quantity: products[pIdx].current_quantity,
          reference_id: saleId,
          user_id: sales[idx].user_id,
          notes: `Sale reversal: TXN ref ${sales[idx].transaction_reference}`,
          created_at: new Date().toISOString(),
        });
      }
    }

    saveToDB(DB_KEYS.products, products);
    saveToDB(DB_KEYS.stock_movements, movements);
    return true;
  },

  // Restocks
  getRestocks: (): Restock[] => getFromDB(DB_KEYS.restocks, []),
  addRestock: (restock: Omit<Restock, 'id' | 'created_at'>): Restock => {
    const restocks = getFromDB<Restock[]>(DB_KEYS.restocks, []);
    const newRestock: Restock = {
      ...restock,
      id: uuidv4(),
      created_at: new Date().toISOString(),
    };
    restocks.push(newRestock);
    saveToDB(DB_KEYS.restocks, restocks);

    // Update product stock
    const products = getFromDB<Product[]>(DB_KEYS.products, []);
    const pIdx = products.findIndex(p => p.id === restock.product_id);
    if (pIdx !== -1) {
      const prevQty = products[pIdx].current_quantity;
      products[pIdx].current_quantity += restock.quantity_added;
      products[pIdx].last_restocked_at = new Date().toISOString();
      products[pIdx].updated_at = new Date().toISOString();
      saveToDB(DB_KEYS.products, products);

      // Add stock movement
      const movements = getFromDB<StockMovement[]>(DB_KEYS.stock_movements, []);
      movements.push({
        id: uuidv4(),
        product_id: restock.product_id,
        product_name: restock.product_name,
        serial_number: restock.serial_number,
        movement_type: 'restock',
        quantity_changed: restock.quantity_added,
        previous_quantity: prevQty,
        new_quantity: products[pIdx].current_quantity,
        reference_id: newRestock.id,
        user_id: restock.user_id,
        notes: `Restock: +${restock.quantity_added} units${restock.supplier ? ` from ${restock.supplier}` : ''}`,
        created_at: new Date().toISOString(),
      });
      saveToDB(DB_KEYS.stock_movements, movements);
    }

    return newRestock;
  },

  // Stock Movements
  getStockMovements: (): StockMovement[] => getFromDB(DB_KEYS.stock_movements, []),

  // Settings
  getSettings: (): Settings => getFromDB<Settings>(DB_KEYS.settings, {
    store_name: 'Mr Ketan Fashion Store',
    store_address: 'Main Market Road, City Center',
    store_phone: '+265 999 123 456',
    currency: 'K',
    low_stock_threshold: 5,
    critical_stock_threshold: 2,
  }),
  updateSettings: (settings: Settings): void => {
    saveToDB(DB_KEYS.settings, settings);
  },

  // Reset database
  resetDatabase: (): void => {
    Object.values(DB_KEYS).forEach(key => localStorage.removeItem(key));
    initializeDatabase();
  },
};
