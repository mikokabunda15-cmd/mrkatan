    </main>
</div>
</div>

<script>
// Close sidebar on mobile when clicking outside
document.addEventListener('click', function(e) {
    const sidebar = document.getElementById('sidebar');
    if (sidebar && window.innerWidth < 1024) {
        if (!sidebar.contains(e.target) && !e.target.closest('button[onclick*="sidebar"]')) {
            sidebar.classList.add('-translate-x-full');
        }
    }
});
</script>
</body>
</html>
