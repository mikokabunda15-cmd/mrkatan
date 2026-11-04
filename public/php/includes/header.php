<?php
/**
 * Page Header
 */
require_once __DIR__ . '/../config/app.php';
$page_title = $page_title ?? 'Dashboard';
$csrf_token = generate_csrf_token();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo e($page_title); ?> - <?php echo APP_NAME; ?></title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root { --gold: #D4A017; --gold-light: #F5D442; --dark: #1a1a1a; }
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
        .sidebar-gradient { background: linear-gradient(to bottom, #111827, #000000); }
        .gold-gradient { background: linear-gradient(135deg, #D4A017, #F5D442); }
        .btn-gold { background: linear-gradient(135deg, #D4A017, #F5D442); color: #000; font-weight: 700; }
        .btn-gold:hover { background: linear-gradient(135deg, #F5D442, #D4A017); }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: #D4A017; border-radius: 3px; }
    </style>
</head>
<body class="bg-gray-50 min-h-screen">
<div class="flex min-h-screen">
