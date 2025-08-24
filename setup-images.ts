import { addImageFieldToFormulations, generateFormulationImages } from "./server/image-generator";

async function setupImages() {
  try {
    console.log("🔧 Setting up image fields in database...");
    await addImageFieldToFormulations();
    
    console.log("🎨 Generating image metadata for formulations...");
    const result = await generateFormulationImages();
    
    console.log("✅ Setup Complete!");
    console.log(`📊 ${result.message}`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  }
}

setupImages();