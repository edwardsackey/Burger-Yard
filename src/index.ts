import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import customerRoutes from './routes/customer';
import adminRoutes from './routes/admin';
import paymentsRoutes from './routes/payments';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentsRoutes);

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Burger Yard API is running!' });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
