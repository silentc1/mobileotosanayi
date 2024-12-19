import app from './app';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`Server is running at http://${HOST}:${PORT}`);
  console.log('Available routes:');
  console.log('- GET    /api/health');
  console.log('- GET    /api/acil');
  console.log('- POST   /api/acil');
  console.log('- PATCH  /api/acil/:id/status');
  console.log('- GET    /api/businesses');
  console.log('- POST   /api/auth/login');
  console.log('- POST   /api/auth/register');
}); 