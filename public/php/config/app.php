<?php
/**
 * Application Configuration
 */

// Application settings
define('APP_NAME', 'Mr Ketan Fashion Store');
define('APP_VERSION', '1.0.0');
define('BASE_URL', '/php/');
define('UPLOAD_DIR', __DIR__ . '/../uploads/');
define('BARCODE_DIR', __DIR__ . '/../uploads/barcodes/');
define('PRODUCT_IMG_DIR', __DIR__ . '/../uploads/products/');

// Session configuration
ini_set('session.cookie_httponly', 1);
ini_set('session.use_strict_mode', 1);

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// CSRF Token
function generate_csrf_token() {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function verify_csrf_token($token) {
    return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
}

// Sanitize output
function e($string) {
    return htmlspecialchars($string, ENT_QUOTES, 'UTF-8');
}

// Format currency
function format_currency($amount, $symbol = 'K') {
    return $symbol . number_format($amount, 2);
}

// Format date
function format_date($datetime) {
    return date('d M Y', strtotime($datetime));
}

function format_datetime($datetime) {
    return date('d M Y H:i', strtotime($datetime));
}

// Generate transaction reference
function generate_transaction_ref() {
    return 'TXN-' . strtoupper(substr(md5(uniqid()), 0, 8));
}

// Get setting value
function get_setting($pdo, $key, $default = '') {
    $stmt = $pdo->prepare("SELECT setting_value FROM settings WHERE setting_key = ?");
    $stmt->execute([$key]);
    $result = $stmt->fetch();
    return $result ? $result['setting_value'] : $default;
}

// Update setting
function update_setting($pdo, $key, $value) {
    $stmt = $pdo->prepare("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?");
    $stmt->execute([$key, $value, $value]);
}

// Flash messages
function set_flash($type, $message) {
    $_SESSION['flash'] = ['type' => $type, 'message' => $message];
}

function get_flash() {
    if (isset($_SESSION['flash'])) {
        $flash = $_SESSION['flash'];
        unset($_SESSION['flash']);
        return $flash;
    }
    return null;
}

// Redirect
function redirect($url) {
    header("Location: $url");
    exit;
}

// Check if user is logged in
function is_logged_in() {
    return isset($_SESSION['user_id']);
}

// Get current user
function current_user() {
    if (!is_logged_in()) return null;
    return [
        'id' => $_SESSION['user_id'],
        'full_name' => $_SESSION['full_name'],
        'username' => $_SESSION['username'],
        'role' => $_SESSION['role'],
    ];
}

// Require login
function require_login() {
    if (!is_logged_in()) {
        redirect(BASE_URL . 'index.php');
    }
}

// Require admin
function require_admin() {
    require_login();
    if ($_SESSION['role'] !== 'admin') {
        set_flash('error', 'Access denied. Admin privileges required.');
        redirect(BASE_URL . 'dashboard.php');
    }
}
