// Script to generate 50 auto care formulations
const API_BASE = 'http://localhost:5000/api';

// Using Node.js fetch (available in Node 18+)
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

async function findAutoCareCategory() {
  try {
    const response = await fetch(`${API_BASE}/categories`);
    const categories = await response.json();
    
    // Look for auto care category
    console.log('Available categories:', categories.map(c => c.name));
    const autoCareCategory = categories.find(cat => 
      cat.name.toLowerCase().includes('auto') || 
      cat.name.toLowerCase().includes('car') ||
      cat.name.toLowerCase().includes('vehicle')
    );
    
    return autoCareCategory;
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return null;
  }
}

async function generateBulkFormulations() {
  try {
    const category = await findAutoCareCategory();
    
    if (!category) {
      console.log('No auto care category found. Creating one first...');
      
      // Create auto care category if it doesn't exist
      const categoryResponse = await fetch(`${API_BASE}/ai/generate-category`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: 'Professional automotive care and maintenance products for car detailing, cleaning, protection, and restoration'
        })
      });
      
      if (!categoryResponse.ok) {
        throw new Error('Failed to create auto care category');
      }
      
      const newCategory = await categoryResponse.json();
      console.log(`Created category: ${newCategory.name}`);
      
      // Use the new category
      category = newCategory;
    }
    
    console.log(`Using category: ${category.name} (ID: ${category.id})`);
    console.log('Generating 50 auto care formulations...');
    
    // Generate bulk formulations
    const response = await fetch(`${API_BASE}/ai/generate-bulk-formulations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        categoryId: category.id,
        count: 50
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to generate formulations: ${error}`);
    }
    
    const result = await response.json();
    console.log(`✅ Successfully generated ${result.count} auto care formulations!`);
    console.log(`Message: ${result.message}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the generation
generateBulkFormulations();