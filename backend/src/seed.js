import 'dotenv/config';
import { connectDB } from './db.js';
import Category from './models/Category.js';

const CATS = [
  { name: 'ACG-565/01', slug: 'acg-565-01', icon: 'building-2', color: 'blue', description: 'ACG-565/01' },
  { name: 'ATG-567/00', slug: 'atg-567-00', icon: 'pill', color: 'rose', description: 'ATG-567/00' },
  { name: 'TT&IEG-569/00', slug: 'tt-ieg-569-00', icon: 'shopping-basket', color: 'emerald', description: 'TT&IEG-569/00' },
  { name: 'ETG-568/02', slug: 'etg-568-02', icon: 'zap', color: 'amber', description: 'ETG-568/02' },
  { name: 'AMENITY-566/01', slug: 'amenity-566-01', icon: 'armchair', color: 'orange', description: 'AMENITY-566/01' },
  { name: 'ALG/00', slug: 'alg-00', icon: 'users', color: 'violet', description: 'ALG/00' },
  { name: 'IT HW (433/01)', slug: 'it-hw-433-01', icon: 'truck', color: 'sky', description: 'IT HW (433/01)' },
  { name: 'IT SW (433/02)', slug: 'it-sw-433-02', icon: 'package', color: 'slate', description: 'IT SW (433/02)' },
  { name: 'IT STY (433/05)', slug: 'it-sty-433-05', icon: 'building-2', color: 'blue', description: 'IT STY (433/05)' },
  { name: 'IT TRG (433/06)', slug: 'it-trg-433-06', icon: 'pill', color: 'rose', description: 'IT TRG (433/06)' },
  { name: 'Condiments Expdr (429/01)', slug: 'condiments-expdr-429-01', icon: 'shopping-basket', color: 'emerald', description: 'Condiments Expdr (429/01)' },
  { name: 'PPC (429/01)', slug: 'ppc-429-01', icon: 'zap', color: 'amber', description: 'PPC (429/01)' }
];

await connectDB();
for (const c of CATS) {
  await Category.updateOne({ slug: c.slug }, { $setOnInsert: c }, { upsert: true });
}
console.log('Seeded categories');
process.exit(0);
