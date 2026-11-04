import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db, initializeDatabase, Product, Sale, Restock, StockMovement, User, Settings } from '../utils/database';

interface AppContextType {
  currentUser: User | null;
  login: (username: string, password: string) => User | null;
  logout: () => void;
  products: Product[];
  sales: Sale[];
  restocks: Restock[];
  movements: StockMovement[];
  settings: Settings;
  refreshData: () => void;
  updateSettings: (s: Settings) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [restocks, setRestocks] = useState<Restock[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [settings, setSettings] = useState<Settings>(db.getSettings());

  const refreshData = useCallback(() => {
    setProducts(db.getProducts());
    setSales(db.getSales());
    setRestocks(db.getRestocks());
    setMovements(db.getStockMovements());
    setSettings(db.getSettings());
  }, []);

  useEffect(() => {
    initializeDatabase();
    refreshData();
    // Check for existing session
    const savedUser = sessionStorage.getItem('mks_current_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, [refreshData]);

  const login = (username: string, password: string): User | null => {
    const user = db.authenticate(username, password);
    if (user) {
      setCurrentUser(user);
      sessionStorage.setItem('mks_current_user', JSON.stringify(user));
    }
    return user;
  };

  const logout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('mks_current_user');
  };

  const updateSettings = (s: Settings) => {
    db.updateSettings(s);
    setSettings(s);
  };

  return (
    <AppContext.Provider value={{
      currentUser, login, logout, products, sales, restocks, movements, settings, refreshData, updateSettings
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
