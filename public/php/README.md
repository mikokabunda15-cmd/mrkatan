# Mr Ketan Fashion Store - Inventory Management System

## Complete PHP Application

This directory contains the full PHP backend for the Mr Ketan Fashion Store Inventory Management System.

---

## 📋 Requirements

- **PHP** 7.4 or higher (8.0+ recommended)
- **MySQL** 5.7+ or **MariaDB** 10.3+
- **Web Server**: Apache (XAMPP, WAMP, LAMP) or Nginx
- **Browser**: Chrome, Firefox, Edge, or Safari (latest versions)

---

## 🚀 Installation Instructions

### Step 1: Set Up Your Environment

1. Install **XAMPP** (recommended for Windows/Mac) or **LAMP** (Linux):
   - Download from: https://www.apachefriends.org/
   - Install and start Apache + MySQL services

2. Alternatively, use any PHP hosting environment with MySQL support.

### Step 2: Copy Files

1. Copy the entire `php/` folder to your web server's document root:
   - **XAMPP**: `C:\xampp\htdocs\php\`
   - **WAMP**: `C:\wamp\www\php\`
   - **Linux**: `/var/www/html/php/`

2. Create the uploads directory:
   ```
   php/uploads/products/
   php/uploads/barcodes/
   ```

### Step 3: Create the Database

1. Open **phpMyAdmin** (http://localhost/phpmyadmin)
2. Click "Import" tab
3. Choose the file: `database/mr_ketan_inventory.sql`
4. Click "Go" to execute

**OR** via MySQL CLI:
```bash
mysql -u root -p < database/mr_ketan_inventory.sql
```

### Step 4: Configure Database Connection

Edit `config/database.php` if your MySQL credentials differ from defaults:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'mr_ketan_inventory');
define('DB_USER', 'root');
define('DB_PASS', '');  // Change if you have a password
```

### Step 5: Access the Application

Open your browser and navigate to:
```
http://localhost/php/
```

---

## 🔑 Demo Login Credentials

| Role | Username | Password |
|------|----------|----------|
| **Admin** | admin | admin123 |
| **Employee** | employee | emp123 |

> **Note**: The demo passwords use PHP's `password_hash()` with bcrypt. The SQL file includes pre-hashed passwords.

---

## 📁 Project Structure

```
php/
├── config/
│   ├── database.php          # Database connection (PDO)
│   └── app.php               # App settings, session, CSRF, helpers
├── includes/
│   ├── header.php            # HTML head + Tailwind CSS
│   ├── sidebar.php           # Navigation sidebar
│   ├── footer.php            # Closing HTML tags
│   └── functions.php         # Business logic (CRUD, transactions)
├── uploads/
│   ├── products/             # Product images
│   └── barcodes/             # Generated barcodes
├── database/
│   └── mr_ketan_inventory.sql  # Full database schema + demo data
├── index.php                 # Login page
├── dashboard.php             # Main dashboard
├── products.php              # All products listing
├── add_product.php           # Add/Edit product form
├── product_detail.php        # Individual product details
├── record_sale.php           # Record sales (with barcode scanning)
├── restock.php               # Restock inventory
├── sales_history.php         # Sales history + CSV export
├── stock_movement.php        # Stock movement log
├── reports.php               # Reports & analytics
├── settings.php              # Store settings (admin only)
├── barcode.php               # Barcode display/print page
└── logout.php                # Session logout
```

---

## 📊 Features

### 1. Dashboard
- Real-time inventory statistics
- Top selling products (ranked by units sold)
- Stock alerts with direct restock links
- Recent activity feed
- Time-based sales filters

### 2. Product Management
- Register products with auto-generated barcodes
- Unique serial number validation
- Product image uploads (max 2MB)
- Category, colour, size management
- Edit and archive (soft delete) products
- Search and multi-filter support
- Pagination for large inventories

### 3. Barcode Generation & Scanning
- Code 128 barcode generation from serial numbers
- Print-ready barcode labels
- Download barcodes as PNG
- USB barcode scanner support (keyboard wedge)
- Manual serial number entry fallback

### 4. Sales Recording
- Scan-to-sell workflow
- Multi-item cart transactions
- Real-time stock validation
- Automatic stock deduction
- Transaction reference generation
- Sale confirmation dialog
- Duplicate submission prevention

### 5. Restocking
- Scan or search products to restock
- Quick restock from low-stock list
- Supplier and cost tracking
- Automatic stock updates
- Stock movement logging

### 6. Sales History
- Searchable transaction records
- Date range filters
- CSV export
- Sale reversal (admin only)
- Stock auto-restoration on reversal

### 7. Stock Movement
- Complete audit trail
- Filter by movement type
- CSV export
- Previous → New quantity tracking

### 8. Reports & Analytics
- **Inventory Report**: Stock levels, values, low-stock items
- **Sales Report**: Revenue, cost of goods, gross profit, category breakdown
- **Restocking Report**: Quantities, costs, suppliers
- Date range filtering
- CSV export for all reports

### 9. Settings (Admin)
- Store name, address, phone
- Currency symbol
- Configurable stock thresholds
- USB scanner setup guide

---

## 🔒 Security Features

- **PDO with prepared statements** (SQL injection prevention)
- **password_hash() / password_verify()** (secure password storage)
- **CSRF token protection** on forms
- **htmlspecialchars()** output escaping (XSS prevention)
- **Session-based authentication** with role checking
- **File upload validation** (type, size limits)
- **Database transactions** for data consistency
- **Server-side validation** on all inputs
- **Role-based access control** (admin vs employee)

---

## 🔌 USB Barcode Scanner Setup

1. Plug the USB barcode scanner into any USB port
2. Wait for the OS to recognize it (no drivers needed for most scanners)
3. Open "Record a Sale" or "Restock" page
4. Click the scan input field
5. Scan a barcode — the serial number appears automatically
6. Press Enter or click "Find"

> Most USB scanners work as "keyboard wedge" devices — they type data as if from a keyboard.

---

## 🗄️ Database Tables

| Table | Purpose |
|-------|---------|
| `users` | System users (admin, employee) |
| `categories` | Product categories |
| `products` | Product inventory |
| `sales` | Sales transactions |
| `sale_items` | Individual items in each sale |
| `restocks` | Restocking records |
| `stock_movements` | Complete audit trail |
| `settings` | Application configuration |

---

## 🛠️ Technical Stack

- **Backend**: PHP 7.4+ with PDO
- **Database**: MySQL/MariaDB
- **Frontend**: HTML5, Tailwind CSS (CDN), JavaScript
- **Icons**: Font Awesome 6
- **Barcode**: Code 128 (custom implementation)
- **CSS Framework**: Tailwind CSS via CDN

---

## 📝 Notes

- All monetary values use configurable currency (default: K)
- Products are soft-deleted (archived) to preserve transaction history
- Stock movements provide complete traceability
- Database transactions ensure data consistency during sales/restocking
- The system supports multiple items per sale transaction
- Demo data includes 15 products across 6 categories

---

## 📞 Support

For questions about this system, contact the development team.

**Mr Ketan Fashion Store** — Inventory Management System v1.0
