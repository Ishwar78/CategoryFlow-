import 'dotenv/config';
import { connectDB } from './db.js';
import Category from './models/Category.js';
import User from './models/User.js';

const MIGRATIONS = [
  { oldSlug: 'acg', name: 'ACG-565/01', slug: 'acg-565-01', icon: 'building-2', color: 'blue', description: 'ACG-565/01' },
  { oldSlug: 'medicine', name: 'ATG-567/00', slug: 'atg-567-00', icon: 'pill', color: 'rose', description: 'ATG-567/00' },
  { oldSlug: 'grocery', name: 'TT&IEG-569/00', slug: 'tt-ieg-569-00', icon: 'shopping-basket', color: 'emerald', description: 'TT&IEG-569/00' },
  { oldSlug: 'electrical', name: 'ETG-568/02', slug: 'etg-568-02', icon: 'zap', color: 'amber', description: 'ETG-568/02' },
  { oldSlug: 'furniture', name: 'AMENITY-566/01', slug: 'amenity-566-01', icon: 'armchair', color: 'orange', description: 'AMENITY-566/01' },
  { oldSlug: 'staff-expense', name: 'ALG/00', slug: 'alg-00', icon: 'users', color: 'violet', description: 'ALG/00' },
  { oldSlug: 'transport', name: 'IT HW (433/01)', slug: 'it-hw-433-01', icon: 'truck', color: 'sky', description: 'IT HW (433/01)' },
  { oldSlug: 'other-expenses', name: 'IT SW (433/02)', slug: 'it-sw-433-02', icon: 'package', color: 'slate', description: 'IT SW (433/02)' }
];

const NEW_CATS = [
  { name: 'IT STY (433/05)', slug: 'it-sty-433-05', icon: 'building-2', color: 'blue', description: 'IT STY (433/05)' },
  { name: 'IT TRG (433/06)', slug: 'it-trg-433-06', icon: 'pill', color: 'rose', description: 'IT TRG (433/06)' },
  { name: 'Condiments Expdr (429/01)', slug: 'condiments-expdr-429-01', icon: 'shopping-basket', color: 'emerald', description: 'Condiments Expdr (429/01)' },
  { name: 'PPC (429/01)', slug: 'ppc-429-01', icon: 'zap', color: 'amber', description: 'PPC (429/01)' }
];

async function run() {
  await connectDB();
  console.log('Migrating categories...');
  
  for (const m of MIGRATIONS) {
    const existing = await Category.findOne({ slug: m.oldSlug });
    if (existing) {
      console.log(`Updating category slug: ${m.oldSlug} -> ${m.slug}`);
      existing.name = m.name;
      existing.slug = m.slug;
      existing.icon = m.icon;
      existing.color = m.color;
      existing.description = m.description;
      await existing.save();
    } else {
      // If old slug is not found, maybe it was already migrated or we should just upsert by new slug
      console.log(`Old slug ${m.oldSlug} not found, checking by new slug: ${m.slug}`);
      await Category.updateOne(
        { slug: m.slug },
        { $set: { name: m.name, icon: m.icon, color: m.color, description: m.description } },
        { upsert: true }
      );
    }
  }

  console.log('Inserting brand new categories...');
  for (const nc of NEW_CATS) {
    console.log(`Upserting category: ${nc.name}`);
    await Category.updateOne(
      { slug: nc.slug },
      { $set: nc },
      { upsert: true }
    );
  }

  console.log('Updating existing users to approved = true...');
  const res = await User.updateMany(
    { approved: { $exists: false } },
    { $set: { approved: true } }
  );
  console.log(`Updated ${res.modifiedCount} users.`);

  console.log('Migration finished successfully.');
  process.exit(0);
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
