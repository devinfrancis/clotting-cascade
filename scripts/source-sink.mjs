// Tiny local receiver: a browser tab that can open NCBI Bookshelf pages posts the article text
// here, and it is saved to content/sources/<id>.txt exactly as fetched.
import { createServer } from 'node:http';
import { writeFileSync } from 'node:fs';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Private-Network': 'true'
};

createServer((req, res) => {
  if (req.method === 'OPTIONS') { res.writeHead(204, headers); return res.end(); }
  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    try {
      const { id, url, text } = JSON.parse(body);
      if (!/^[a-z0-9-]+$/.test(id)) throw new Error('bad id');
      writeFileSync(`content/sources/${id}.txt`, `URL: ${url}\nFETCHED: ${new Date().toISOString()}\n\n${text}\n`);
      console.log('saved', id, text.length);
      res.writeHead(200, headers); res.end('ok');
    } catch (e) {
      res.writeHead(400, headers); res.end(e.message);
    }
  });
}).listen(4321, () => console.log('sink on 4321'));
