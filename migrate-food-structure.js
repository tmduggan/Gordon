const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrateFoodStructure() {
  console.log('Starting food structure migration...');
  
  try {
    // Get all foods from the current collection
    const foodsSnapshot = await db.collection('foods').get();
    
    if (foodsSnapshot.empty) {
      console.log('No foods found to migrate.');
      return;
    }
    
    console.log(`Found ${foodsSnapshot.size} foods to process.`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const doc of foodsSnapshot.docs) {
      const foodData = doc.data();
      const oldId = doc.id;
      
      try {
        // Check if this is already in the new format
        if (foodData.nix_item_id && foodData.nutritionix_data) {
          console.log(`Skipping ${oldId} - already in new format`);
          skippedCount++;
          continue;
        }
        
        // Determine new ID
        let newId = oldId;
        if (foodData.nix_item_id) {
          newId = foodData.nix_item_id;
        }
        
        // Prepare new food structure
        const newFoodData = {
          id: newId,
          label: foodData.label || foodData.food_name,
          // Preserve existing data
          ...foodData,
          // Add metadata
          migrated_at: new Date().toISOString(),
          original_id: oldId,
          source: foodData.source || 'migrated'
        };
        
        // If we have a new ID, we need to create a new document
        if (newId !== oldId) {
          // Check if new document already exists
          const existingDoc = await db.collection('foods').doc(newId).get();
          if (existingDoc.exists) {
            console.log(`New ID ${newId} already exists, keeping old document ${oldId}`);
            // Update the old document with migration metadata
            await db.collection('foods').doc(oldId).update({
              migrated_at: new Date().toISOString(),
              migration_status: 'duplicate_id_exists',
              new_id: newId
            });
            skippedCount++;
            continue;
          }
          
          // Create new document with new ID
          await db.collection('foods').doc(newId).set(newFoodData);
          
          // Delete old document
          await db.collection('foods').doc(oldId).delete();
          
          console.log(`Migrated ${oldId} -> ${newId}`);
        } else {
          // Same ID, just update the document
          await db.collection('foods').doc(oldId).set(newFoodData);
          console.log(`Updated ${oldId}`);
        }
        
        migratedCount++;
        
      } catch (error) {
        console.error(`Error migrating ${oldId}:`, error);
        errorCount++;
      }
    }
    
    console.log('\nMigration Summary:');
    console.log(`- Migrated: ${migratedCount}`);
    console.log(`- Skipped: ${skippedCount}`);
    console.log(`- Errors: ${errorCount}`);
    console.log(`- Total processed: ${foodsSnapshot.size}`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Function to analyze current food structure
async function analyzeFoodStructure() {
  console.log('Analyzing current food structure...');
  
  try {
    const foodsSnapshot = await db.collection('foods').get();
    
    if (foodsSnapshot.empty) {
      console.log('No foods found.');
      return;
    }
    
    const analysis = {
      total: foodsSnapshot.size,
      hasNixItemId: 0,
      hasNutritionixData: 0,
      hasOldStructure: 0,
      hasNewStructure: 0,
      mixedStructure: 0
    };
    
    for (const doc of foodsSnapshot.docs) {
      const foodData = doc.data();
      
      const hasNixItemId = !!foodData.nix_item_id;
      const hasNutritionixData = !!foodData.nutritionix_data;
      const hasOldStructure = !!(foodData.calories || foodData.fat || foodData.carbs || foodData.protein);
      const hasNewStructure = hasNixItemId && hasNutritionixData;
      
      if (hasNixItemId) analysis.hasNixItemId++;
      if (hasNutritionixData) analysis.hasNutritionixData++;
      if (hasOldStructure) analysis.hasOldStructure++;
      if (hasNewStructure) analysis.hasNewStructure++;
      if (hasOldStructure && hasNewStructure) analysis.mixedStructure++;
    }
    
    console.log('Food Structure Analysis:');
    console.log(`- Total foods: ${analysis.total}`);
    console.log(`- Has Nutritionix item ID: ${analysis.hasNixItemId}`);
    console.log(`- Has Nutritionix data: ${analysis.hasNutritionixData}`);
    console.log(`- Has old structure: ${analysis.hasOldStructure}`);
    console.log(`- Has new structure: ${analysis.hasNewStructure}`);
    console.log(`- Mixed structure: ${analysis.mixedStructure}`);
    
  } catch (error) {
    console.error('Analysis failed:', error);
  }
}

// Run analysis first, then migration
async function main() {
  await analyzeFoodStructure();
  console.log('\n' + '='.repeat(50) + '\n');
  
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('Do you want to proceed with migration? (y/N): ', async (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      await migrateFoodStructure();
    } else {
      console.log('Migration cancelled.');
    }
    rl.close();
    process.exit(0);
  });
}

main().catch(console.error); 