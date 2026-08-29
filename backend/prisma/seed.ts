import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

// Mirrors mobile/constants/catalog.ts PRODUCTS exactly — ids match the
// frontend's productId strings so cart lines map straight to MenuItem rows.
const MENU_ITEMS = [
  { id: 1, name: 'Single Cheese Burger', description: 'Beef patty, cheddar, lettuce, onions & yard sauce', price: 70, category: 'Burgers' },
  { id: 2, name: 'Double Cheese Burger', description: 'Double beef patties, double cheese, caramelized onions', price: 100, category: 'Burgers' },
  { id: 3, name: 'Crispy Chicken Burger', description: 'Crunchy fried chicken fillet, coleslaw & spicy mayo', price: 70, category: 'Burgers' },
  { id: 4, name: 'French Fries', description: 'Crispy golden fries, lightly salted', price: 25, category: 'Sides' },
  { id: 5, name: 'Chicken Shawarma', description: 'Grilled chicken, crunchy veg & garlic sauce in warm pita', price: 50, category: 'Wraps' },
  { id: 6, name: 'Coca-Cola (Cold)', description: 'Chilled 500ml PET bottle', price: 10, category: 'Drinks' },
  { id: 7, name: 'Fanta Cocktail', description: 'Chilled 300ml refreshing soda', price: 10, category: 'Drinks' },
  { id: 8, name: 'BB Fruit Cocktail', description: 'Pineapple, apple & grape blend, served ice cold', price: 15, category: 'Drinks' },
  { id: 9, name: 'Double Yard Deal', description: '2x Double Cheese Burger + Large Fries, saving GHS 45', price: 180, category: 'Combos' },
];

async function main() {
  for (const item of MENU_ITEMS) {
    await prisma.menuItem.upsert({
      where: { id: item.id },
      update: { name: item.name, description: item.description, price: item.price, category: item.category },
      create: item,
    });
  }
  // Explicit ids bypass the auto-increment sequence, so nudge it past the
  // highest seeded id — otherwise the next admin-created item collides.
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"MenuItem"', 'id'), (SELECT MAX(id) FROM "MenuItem"))`,
  );

  console.log(`Seeded ${MENU_ITEMS.length} menu items.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
