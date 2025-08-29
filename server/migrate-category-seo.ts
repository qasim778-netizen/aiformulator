import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { categories as categoriesTable } from '../shared/schema';
import { generateCategorySEOSlug, generateCategoryMetaDescription, generateCategorySEOKeywords } from './seo-utils';
import { eq } from 'drizzle-orm';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required');
}

const sql = neon(databaseUrl);
const db = drizzle(sql);

async function migrateCategorySEO() {
  console.log('🔄 Starting category SEO migration...');
  
  try {
    // Get all categories
    const categories = await db.select().from(categoriesTable);
    console.log(`Found ${categories.length} categories to update`);
    
    // Update each category with SEO fields
    for (const category of categories) {
      const slug = generateCategorySEOSlug(category.name);
      const metaDescription = generateCategoryMetaDescription(category.name, category.description);
      const keywords = generateCategorySEOKeywords(category.name, category.description);
      
      await db
        .update(categoriesTable)
        .set({
          slug,
          metaDescription,
          keywords,
        })
        .where(eq(categoriesTable.id, category.id));
      
      console.log(`✅ Updated ${category.name} -> ${slug}`);
    }
    
    console.log('🎉 Category SEO migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateCategorySEO();