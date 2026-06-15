const http = require('http');
http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  let body = '';
  req.on('data', chunk => body += chunk.toString());
  req.on('end', () => {
    console.log('BROWSER ERROR REPORT:', body);
    res.end('OK');
  });
}).listen(5176, () => console.log('Listening for errors on 5176...'));
