# Mr Ketan Fashion Store - Inventory Management System

## Complete Installation & Testing Guide

---

## 🚀 Quick Start (5 Minutes)

### Option A: React Demo (Instant - No Server Required)

The React application works standalone using browser localStorage. Just open the built `dist/index.html`.

**Demo Credentials:**
- Admin: `admin` / `admin123`
- Employee: `employee` / `emp123`

### Option B: Full PHP + MySQL (Production)

1. Install XAMPP (https://www.apachefriends.org/)
2. Copy `dist/php/` folder to `C:\xampp\htdocs\mr-ketan\`
3. Start Apache + MySQL in XAMPP
4. Open phpMyAdmin → Import `php/database/mr_ketan_inventory.sql`
5. Visit `http://localhost/mr-ketan/`
6. Login with demo credentials (passwords auto-setup on first visit)

---

## 📋 Features

| Feature | Status | Description |
|---------|--------|-------------|
| Dashboard | ✅ PASS | Real-time stats, top sellers, stock alerts |
| Product Registration | ✅ PASS | Full form with validation, image upload |
| Barcode Generation | ✅ PASS | Code 128B, encodes full serial (e.g. MKS-001) |
| Barcode Scanning | ✅ PASS | USB scanner + manual entry support |
| Record Sale | ✅ PASS | Multi-item cart, stock validation |
| Restock | ✅ PASS | Quick restock, supplier tracking |
| Sales History | ✅ PASS | Search, filter, CSV export, reversal |
| Stock Movement | ✅ PASS | Full audit trail, all movement types |
| Reports | ✅ PASS | Inventory, Sales, Restocking with CSV |
| Settings | ✅ PASS | Store info, thresholds, scanner guide |
| Authentication | ✅ PASS | Secure bcrypt, role-based access |
| Responsive Design | ✅ PASS | Desktop, tablet, mobile layouts |

---

## 🔧 Bug Fixes Applied

### Critical Fixes
1. **Barcode Generator** - Fixed to encode FULL alphanumeric serial numbers (MKS-001) using Code 128B instead of stripping to digits only
2. **Serial Number Validation** - Now accepts letters, numbers, hyphens and underscores
3. **Password Hashes** - PHP auto-generates proper bcrypt hashes on first run
4. **Demo Data** - Updated to use MKS-XXX format serial numbers
5. **PHP Record Sale** - Fixed AJAX lookup to handle alphanumeric serials
6. **PHP Restock** - Fixed scan input to handle alphanumeric serials
7. **PHP Barcode Page** - Updated to use Code 128B encoding for full serials

---

## 🗄️ Database Schema

### Tables
- `users` - System users with bcrypt password hashes
- `categories` - Product categories
- `products` - Full product inventory with serial numbers
- `sales` - Sales transactions
- `sale_items` - Individual items per sale
- `restocks` - Restocking records
- `stock_movements` - Complete audit trail
- `settings` - Application configuration

### Relationships
- products → categories (FK)
- sales → users (FK)
- sale_items → sales, products (FK)
- restocks → products, users (FK)
- stock_movements → products, users (FK)

---

## 🔒 Security

- PDO prepared statements (SQL injection prevention)
- bcrypt password hashing (password_hash/password_verify)
- CSRF token protection
- XSS prevention (htmlspecialchars)
- Role-based access control
- Secure session handling
- File upload validation
- Server-side validation

---

## 📱 USB Barcode Scanner Setup

1. Plug scanner into USB port
2. Open "Record a Sale" or "Restock" page
3. Click the scan input field
4. Scan a barcode → serial number appears automatically
5. Press Enter or click "Find"

---

## 📁 Project Structure

```
dist/
├── index.html          # React app entry
├── assets/             # Built JS/CSS
└── php/                # Complete PHP backend
    ├── config/         # Database & app config
    ├── includes/       # Header, sidebar, footer, functions
    ├── database/       # SQL installation file
    ├── uploads/        # Product images & barcodes
    ├── index.php       # Login page
    ├── dashboard.php   # Main dashboard
    ├── products.php    # All products
    ├── add_product.php # Add/Edit product
    ├── product_detail.php
    ├── record_sale.php # Record sales
    ├── restock.php     # Restock inventory
    ├── sales_history.php
    ├── stock_movement.php
    ├── reports.php     # Reports & analytics
    ├── settings.php    # Admin settings
    ├── barcode.php     # Barcode display/print
    ├── logout.php
    └── README.md       # PHP-specific docs
```

---

## ✅ Testing Report

| # | Test | Result | Notes |
|---|------|--------|-------|
| 1 | Login as admin | ✅ PASS | admin/admin123 |
| 2 | Login as employee | ✅ PASS | employee/emp123 |
| 3 | Register product (MKS-016) | ✅ PASS | Full alphanumeric serial |
| 4 | Barcode encodes "MKS-016" | ✅ PASS | Code 128B, full serial |
| 5 | Product appears in inventory | ✅ PASS | With correct stock |
| 6 | Search by serial "MKS-016" | ✅ PASS | Found correctly |
| 7 | View product details | ✅ PASS | All fields displayed |
| 8 | Record sale (2 units) | ✅ PASS | Stock reduced correctly |
| 9 | Sale appears in history | ✅ PASS | With correct total |
| 10 | Stock movement logged | ✅ PASS | -2 units recorded |
| 11 | Restock product (+10) | ✅ PASS | Stock increased |
| 12 | Dashboard updates | ✅ PASS | All stats correct |
| 13 | Best sellers ranking | ✅ PASS | By units sold |
| 14 | CSV export | ✅ PASS | Downloads correctly |
| 15 | Reverse sale | ✅ PASS | Stock restored |
| 16 | Employee permissions | ✅ PASS | Limited access |
| 17 | Responsive layout | ✅ PASS | Mobile-friendly |
| 18 | Barcode print/download | ✅ PASS | PNG format |

---

## 📞 Support

For issues with the PHP backend, ensure:
- PHP 7.4+ is installed
- MySQL/MariaDB is running
- The `uploads/products/` and `uploads/barcodes/` directories exist with write permissions
- Database credentials in `config/database.php` match your setup

---

**Mr Ketan Fashion Store** - Inventory Management System v1.1
