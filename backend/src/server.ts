import app from './app.js';

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

app.listen(PORT, HOST, () => {
  console.log(`Backend server running on ${HOST}:${PORT}`);
});