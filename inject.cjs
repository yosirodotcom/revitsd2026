const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');
if (!html.includes('catch_errors')) {
  html = html.replace('<head>', `<head><script id="catch_errors">
    window.addEventListener('error', function(e) {
      fetch('http://localhost:5176/', { method: 'POST', body: e.message + ' | ' + e.filename + ':' + e.lineno });
    });
    window.addEventListener('unhandledrejection', function(e) {
      fetch('http://localhost:5176/', { method: 'POST', body: 'Unhandled Promise: ' + e.reason });
    });
  </script>`);
  fs.writeFileSync('index.html', html);
  console.log('Injected');
}
