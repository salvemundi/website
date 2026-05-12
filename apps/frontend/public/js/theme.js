(function() {
    try {
        if (localStorage.theme === 'light') {
            document.documentElement.classList.remove('dark');
        }
    } catch (_) {}
})();
