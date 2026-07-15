import 'dotenv/config';
import express from 'express';
import uploadHandler from './api/upload.js';
import deleteHandler from './api/delete.js';
import proxyHandler from './api/proxy.js';

const app = express();
const PORT = process.env.API_PORT || 3000;

app.use(express.json());

app.post('/api/upload', uploadHandler);
app.post('/api/delete', deleteHandler);
app.get('/api/proxy', proxyHandler);

app.listen(PORT, () => {
  console.log(`Local API server running at http://localhost:${PORT}`);
});
