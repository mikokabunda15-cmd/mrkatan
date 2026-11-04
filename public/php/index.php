<?php
/**
 * Login Page
 */
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/config/app.php';

// If already logged in, redirect to dashboard
if (is_logged_in()) {
    redirect(BASE_URL . 'dashboard.php');
}

// Auto-setup: Fix demo password hashes on first run
// The SQL file contains placeholder hashes; this generates real bcrypt hashes
$setup_done = false;
try {
    $stmt = $pdo->query("SELECT COUNT(*) FROM users");
    $user_count = $stmt->fetchColumn();
    if ($user_count > 0) {
        // Check if passwords need updating (test with known passwords)
        $stmt = $pdo->prepare("SELECT * FROM users WHERE username = 'admin'");
        $stmt->execute();
        $admin = $stmt->fetch();
        if ($admin && !password_verify('admin123', $admin['password_hash'])) {
            // Passwords need to be regenerated
            $admin_hash = password_hash('admin123', PASSWORD_DEFAULT);
            $emp_hash = password_hash('emp123', PASSWORD_DEFAULT);
            $pdo->prepare("UPDATE users SET password_hash = ? WHERE username = 'admin'")->execute([$admin_hash]);
            $pdo->prepare("UPDATE users SET password_hash = ? WHERE username = 'employee'")->execute([$emp_hash]);
            $setup_done = true;
        }
    }
} catch (Exception $e) {
    // Silently continue - will show error on login attempt
}

$error = '';
if ($setup_done) {
    $error = ''; // Setup succeeded silently
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';

    if (empty($username) || empty($password)) {
        $error = 'Please enter both username and password.';
    } else {
        $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
        $stmt->execute([$username]);
        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password_hash'])) {
            // Rehash if needed (future-proofing)
            if (password_needs_rehash($user['password_hash'], PASSWORD_DEFAULT)) {
                $new_hash = password_hash($password, PASSWORD_DEFAULT);
                $pdo->prepare("UPDATE users SET password_hash = ? WHERE id = ?")->execute([$new_hash, $user['id']]);
            }
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['full_name'] = $user['full_name'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['role'] = $user['role'];
            redirect(BASE_URL . 'dashboard.php');
        } else {
            $error = 'Invalid username or password.';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - <?php echo APP_NAME; ?></title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        .gold-gradient { background: linear-gradient(135deg, #D4A017, #F5D442); }
    </style>
</head>
<body class="bg-gradient-to-br from-gray-900 via-black to-gray-900 min-h-screen flex items-center justify-center p-4">
    <div class="w-full max-w-md">
        <!-- Logo -->
        <div class="text-center mb-8">
            <div class="inline-flex items-center justify-center w-20 h-20 gold-gradient rounded-2xl shadow-2xl shadow-yellow-500/20 mb-4">
                <span class="text-3xl font-bold text-black">MK</span>
            </div>
            <h1 class="text-2xl font-bold text-yellow-400">Mr Ketan Fashion Store</h1>
            <p class="text-gray-400 mt-1">Inventory Management System</p>
        </div>

        <!-- Login Form -->
        <div class="bg-white rounded-2xl shadow-2xl p-8">
            <h2 class="text-xl font-bold text-gray-800 mb-6 text-center">Sign In</h2>

            <?php if ($error): ?>
            <div class="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <i class="fas fa-exclamation-circle"></i>
                <span><?php echo e($error); ?></span>
            </div>
            <?php endif; ?>

            <form method="POST" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <div class="relative">
                        <i class="fas fa-user absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                        <input type="text" name="username" value="<?php echo e($_POST['username'] ?? ''); ?>"
                               class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
                               placeholder="Enter username" required autofocus>
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <div class="relative">
                        <i class="fas fa-lock absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                        <input type="password" name="password"
                               class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none"
                               placeholder="Enter password" required>
                    </div>
                </div>

                <button type="submit" class="w-full py-3.5 gold-gradient text-black font-bold text-lg rounded-lg hover:opacity-90 transition-all shadow-lg shadow-yellow-500/20">
                    Sign In
                </button>
            </form>

            <!-- Demo Credentials -->
            <div class="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p class="text-sm font-medium text-gray-700 mb-2">Demo Credentials:</p>
                <div class="space-y-1 text-sm text-gray-600">
                    <p><span class="font-medium">Admin:</span> admin / admin123</p>
                    <p><span class="font-medium">Employee:</span> employee / emp123</p>
                </div>
            </div>
        </div>

        <p class="text-center text-gray-500 text-sm mt-6">
            © <?php echo date('Y'); ?> <?php echo APP_NAME; ?>. All rights reserved.
        </p>
    </div>
</body>
</html>
