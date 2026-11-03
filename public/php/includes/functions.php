<?php
/**
 * Shared Functions
 * Mr Ketan Fashion Store - Inventory Management System
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/app.php';

// Get all active products
function get_all_products($pdo, $archived = false) {
    $sql = "SELECT p.*, c.category_name FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            WHERE " . ($archived ? "p.archived_at IS NOT NULL" : "p.archived_at IS NULL") . "
            ORDER BY p.created_at DESC";
    return $pdo->query($sql)->fetchAll();
}

// Get product by ID
function get_product($pdo, $id) {
    $stmt = $pdo->prepare("SELECT p.*, c.category_name FROM products p 
                           LEFT JOIN categories c ON p.category_id = c.id 
                           WHERE p.id = ?");
    $stmt->execute([$id]);
    return $stmt->fetch();
}

// Get product by serial number
function get_product_by_serial($pdo, $serial) {
    $stmt = $pdo->prepare("SELECT p.*, c.category_name FROM products p 
                           LEFT JOIN categories c ON p.category_id = c.id 
                           WHERE p.serial_number = ? AND p.archived_at IS NULL");
    $stmt->execute([$serial]);
    return $stmt->fetch();
}

// Get all categories
function get_categories($pdo) {
    return $pdo->query("SELECT * FROM categories ORDER BY category_name")->fetchAll();
}

// Get stock status
function get_stock_status($quantity, $low_threshold = 5, $critical_threshold = 2) {
    if ($quantity == 0) return ['label' => 'Out of Stock', 'color' => 'bg-gray-100 text-gray-600'];
    if ($quantity <= $critical_threshold) return ['label' => 'Critical', 'color' => 'bg-red-100 text-red-700'];
    if ($quantity <= $low_threshold) return ['label' => 'Low Stock', 'color' => 'bg-orange-100 text-orange-700'];
    return ['label' => 'In Stock', 'color' => 'bg-green-100 text-green-700'];
}

// Record sale with transaction
function record_sale($pdo, $user_id, $items) {
    $pdo->beginTransaction();
    try {
        // Calculate total
        $total = 0;
        foreach ($items as $item) {
            $total += $item['unit_price'] * $item['quantity'];
        }

        // Create sale record
        $txn_ref = generate_transaction_ref();
        $stmt = $pdo->prepare("INSERT INTO sales (transaction_reference, total_amount, user_id, status) VALUES (?, ?, ?, 'completed')");
        $stmt->execute([$txn_ref, $total, $user_id]);
        $sale_id = $pdo->lastInsertId();

        // Add sale items and update stock
        foreach ($items as $item) {
            // Insert sale item
            $stmt = $pdo->prepare("INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)");
            $subtotal = $item['unit_price'] * $item['quantity'];
            $stmt->execute([$sale_id, $item['product_id'], $item['quantity'], $item['unit_price'], $subtotal]);

            // Get current product state
            $stmt = $pdo->prepare("SELECT current_quantity FROM products WHERE id = ? FOR UPDATE");
            $stmt->execute([$item['product_id']]);
            $product = $stmt->fetch();
            $prev_qty = $product['current_quantity'];

            // Update product stock
            $new_qty = $prev_qty - $item['quantity'];
            $stmt = $pdo->prepare("UPDATE products SET current_quantity = ?, total_sold = total_sold + ? WHERE id = ?");
            $stmt->execute([$new_qty, $item['quantity'], $item['product_id']]);

            // Record stock movement
            $stmt = $pdo->prepare("INSERT INTO stock_movements (product_id, movement_type, quantity_changed, previous_quantity, new_quantity, reference_id, user_id, notes) VALUES (?, 'sale', ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$item['product_id'], -$item['quantity'], $prev_qty, $new_qty, $sale_id, $user_id, "Sale: {$item['quantity']} units @ {$item['unit_price']} each"]);
        }

        $pdo->commit();
        return ['success' => true, 'sale_id' => $sale_id, 'reference' => $txn_ref, 'total' => $total];
    } catch (Exception $e) {
        $pdo->rollBack();
        return ['success' => false, 'error' => $e->getMessage()];
    }
}

// Record restock with transaction
function record_restock($pdo, $user_id, $product_id, $quantity, $purchase_cost, $supplier) {
    $pdo->beginTransaction();
    try {
        // Get current product state
        $stmt = $pdo->prepare("SELECT current_quantity FROM products WHERE id = ? FOR UPDATE");
        $stmt->execute([$product_id]);
        $product = $stmt->fetch();
        $prev_qty = $product['current_quantity'];
        $new_qty = $prev_qty + $quantity;

        // Insert restock record
        $stmt = $pdo->prepare("INSERT INTO restocks (product_id, quantity_added, purchase_cost, supplier, user_id) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$product_id, $quantity, $purchase_cost, $supplier, $user_id]);
        $restock_id = $pdo->lastInsertId();

        // Update product
        $stmt = $pdo->prepare("UPDATE products SET current_quantity = ?, last_restocked_at = NOW() WHERE id = ?");
        $stmt->execute([$new_qty, $product_id]);

        // Record stock movement
        $stmt = $pdo->prepare("INSERT INTO stock_movements (product_id, movement_type, quantity_changed, previous_quantity, new_quantity, reference_id, user_id, notes) VALUES (?, 'restock', ?, ?, ?, ?, ?, ?)");
        $notes = "Restock: +$quantity units" . ($supplier ? " from $supplier" : "");
        $stmt->execute([$product_id, $quantity, $prev_qty, $new_qty, $restock_id, $user_id, $notes]);

        $pdo->commit();
        return ['success' => true, 'restock_id' => $restock_id];
    } catch (Exception $e) {
        $pdo->rollBack();
        return ['success' => false, 'error' => $e->getMessage()];
    }
}

// Reverse a sale
function reverse_sale($pdo, $sale_id, $user_id) {
    $pdo->beginTransaction();
    try {
        // Get sale details
        $stmt = $pdo->prepare("SELECT * FROM sales WHERE id = ? AND status = 'completed' FOR UPDATE");
        $stmt->execute([$sale_id]);
        $sale = $stmt->fetch();
        if (!$sale) { $pdo->rollBack(); return ['success' => false, 'error' => 'Sale not found or already reversed']; }

        // Get sale items
        $stmt = $pdo->prepare("SELECT * FROM sale_items WHERE sale_id = ?");
        $stmt->execute([$sale_id]);
        $items = $stmt->fetchAll();

        // Restore stock for each item
        foreach ($items as $item) {
            $stmt = $pdo->prepare("SELECT current_quantity FROM products WHERE id = ? FOR UPDATE");
            $stmt->execute([$item['product_id']]);
            $product = $stmt->fetch();
            $prev_qty = $product['current_quantity'];
            $new_qty = $prev_qty + $item['quantity'];

            $stmt = $pdo->prepare("UPDATE products SET current_quantity = ?, total_sold = total_sold - ? WHERE id = ?");
            $stmt->execute([$new_qty, $item['quantity'], $item['product_id']]);

            $stmt = $pdo->prepare("INSERT INTO stock_movements (product_id, movement_type, quantity_changed, previous_quantity, new_quantity, reference_id, user_id, notes) VALUES (?, 'adjustment', ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$item['product_id'], $item['quantity'], $prev_qty, $new_qty, $sale_id, $user_id, "Sale reversal: {$sale['transaction_reference']}"]);
        }

        // Mark sale as reversed
        $stmt = $pdo->prepare("UPDATE sales SET status = 'reversed' WHERE id = ?");
        $stmt->execute([$sale_id]);

        $pdo->commit();
        return ['success' => true];
    } catch (Exception $e) {
        $pdo->rollBack();
        return ['success' => false, 'error' => $e->getMessage()];
    }
}

// Dashboard statistics
function get_dashboard_stats($pdo) {
    $stats = [];
    
    $stats['total_products'] = $pdo->query("SELECT COUNT(*) FROM products WHERE archived_at IS NULL")->fetchColumn();
    $stats['total_stock'] = $pdo->query("SELECT COALESCE(SUM(current_quantity), 0) FROM products WHERE archived_at IS NULL")->fetchColumn();
    $stats['total_sold'] = $pdo->query("SELECT COALESCE(SUM(total_sold), 0) FROM products WHERE archived_at IS NULL")->fetchColumn();
    $stats['inventory_value'] = $pdo->query("SELECT COALESCE(SUM(current_quantity * purchase_price), 0) FROM products WHERE archived_at IS NULL")->fetchColumn();
    
    $low_threshold = get_setting($pdo, 'low_stock_threshold', 5);
    $critical_threshold = get_setting($pdo, 'critical_stock_threshold', 2);
    $stats['low_stock'] = $pdo->query("SELECT COUNT(*) FROM products WHERE archived_at IS NULL AND current_quantity > 0 AND current_quantity <= $low_threshold")->fetchColumn();
    $stats['out_of_stock'] = $pdo->query("SELECT COUNT(*) FROM products WHERE archived_at IS NULL AND current_quantity = 0")->fetchColumn();
    $stats['total_sales'] = $pdo->query("SELECT COALESCE(SUM(total_amount), 0) FROM sales WHERE status = 'completed'")->fetchColumn();
    $stats['total_restocks'] = $pdo->query("SELECT COUNT(*) FROM restocks")->fetchColumn();
    
    return $stats;
}

// Get best selling products
function get_best_selling($pdo, $limit = 5) {
    $stmt = $pdo->prepare("SELECT p.*, c.category_name FROM products p 
                           LEFT JOIN categories c ON p.category_id = c.id 
                           WHERE p.archived_at IS NULL AND p.total_sold > 0
                           ORDER BY p.total_sold DESC LIMIT ?");
    $stmt->execute([$limit]);
    return $stmt->fetchAll();
}
