import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Setup the raw PostgreSQL connection pool using our .env file
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });

// Pass the connection pool into Prisma's adapter
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export default prisma;