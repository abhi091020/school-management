// utils/cleanIndexes.js (Modernized to ES Module)

import mongoose from "mongoose";
import "dotenv/config"; // Modern way to load dotenv in an ES module

async function cleanIndexes() {
  console.log("⏳ Connecting to MongoDB...");

  // FIX: Use the standard way to connect and handle connection in modern Mongoose
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI, {
      // New Mongoose connection options are default, but can be specified if needed
    });
  }
  console.log("✅ Connected");

  // Load all models that have been defined (ensure all model files are imported before running this utility)
  // NOTE: This utility assumes all your models have been imported/registered elsewhere in your application entry point.
  const models = mongoose.modelNames();

  for (const modelName of models) {
    const Model = mongoose.model(modelName);

    console.log(`\n🔍 Checking indexes for: ${modelName}`);
    // Use the native driver collection method to get indexes
    const indexes = await Model.collection.indexes();

    // Get schema-defined indexes (including unique indexes)
    const indexDefs = Model.schema.indexes();
    // A Set of JSON strings representing the fields of allowed indexes
    const allowedIndexes = new Set(
      indexDefs.map(([fields]) => JSON.stringify(fields))
    );

    // Add unique/sparse indexes to the allowed set if they were defined via the schema
    for (const idx of indexes) {
      if (idx.unique || idx.sparse) {
        const fields = { ...idx.key };
        delete fields._id;
        if (Object.keys(fields).length > 0) {
          allowedIndexes.add(JSON.stringify(fields));
        }
      }
    }

    for (const idx of indexes) {
      const fields = { ...idx.key };
      delete fields._id; // skip default _id index

      const fieldsKey = JSON.stringify(fields);

      // Condition for removal:
      // 1. Not the default _id index (fieldsKey !== "{}")
      // 2. Not explicitly defined in the schema (!allowedIndexes.has(fieldsKey))
      // 3. Not a unique, sparse, or TTL index (which are critical and should be preserved)
      if (
        fieldsKey !== "{}" &&
        !allowedIndexes.has(fieldsKey) &&
        !idx.unique && // Keep unique indexes
        !idx.sparse && // Keep sparse indexes
        !idx.expireAfterSeconds // Keep TTL indexes
      ) {
        console.log(`⚠️ Removing unused index: ${idx.name}`);
        await Model.collection.dropIndex(idx.name);
      }
    }
  }

  console.log("\n✨ Index cleanup complete.");
  // FIX: Clean exit
  mongoose.connection.close();
  process.exit(0);
}

cleanIndexes().catch((err) => {
  console.error("❌ Error during index cleanup:", err);
  // FIX: Clean exit on error
  if (mongoose.connection.readyState !== 0) mongoose.connection.close();
  process.exit(1);
});
