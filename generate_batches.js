// Generate 50 auto care formulations in batches of 10
const API_BASE = 'http://localhost:5000/api';
const CATEGORY_ID = '7d802e86-ea9f-45e3-8b4b-5d3f139aaedf';
const BATCH_SIZE = 5;
const TOTAL_FORMULATIONS = 50;

async function generateBatch(batchNumber, count) {
  try {
    console.log(`🔄 Generating batch ${batchNumber} (${count} formulations)...`);
    
    const response = await fetch(`${API_BASE}/ai/generate-bulk-formulations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        categoryId: CATEGORY_ID,
        count: count
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Batch ${batchNumber} failed: ${error}`);
    }
    
    const result = await response.json();
    console.log(`✅ Batch ${batchNumber} complete: ${result.count} formulations generated`);
    return result.count;
    
  } catch (error) {
    console.error(`❌ Batch ${batchNumber} error:`, error.message);
    return 0;
  }
}

async function generateAllBatches() {
  console.log(`🚀 Starting generation of ${TOTAL_FORMULATIONS} auto care formulations in batches of ${BATCH_SIZE}`);
  
  let totalGenerated = 0;
  const batches = Math.ceil(TOTAL_FORMULATIONS / BATCH_SIZE);
  
  for (let i = 1; i <= batches; i++) {
    const batchSize = (i === batches) ? (TOTAL_FORMULATIONS % BATCH_SIZE || BATCH_SIZE) : BATCH_SIZE;
    const generated = await generateBatch(i, batchSize);
    totalGenerated += generated;
    
    // Small delay between batches to avoid overwhelming the system
    if (i < batches) {
      console.log('⏱️  Waiting 3 seconds before next batch...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  console.log(`\n🎉 Generation complete! Total formulations created: ${totalGenerated}/${TOTAL_FORMULATIONS}`);
  
  // Check final count
  try {
    const statsResponse = await fetch(`${API_BASE}/stats`);
    const stats = await statsResponse.json();
    console.log(`📊 Current system stats: ${stats.totalFormulations} total formulations`);
  } catch (error) {
    console.log('Could not fetch final stats');
  }
}

// Run the generation
generateAllBatches();