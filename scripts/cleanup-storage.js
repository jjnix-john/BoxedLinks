#!/usr/bin/env node

/**
 * Cleanup script to remove orphaned folders from Supabase storage
 * Run with: node scripts/cleanup-storage.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const BUCKET = 'drops';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing environment variables:');
  console.error('   VITE_SUPABASE_URL');
  console.error('   VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function cleanupStorage() {
  try {
    console.log('🗑️  Scanning storage for folder_* directories...\n');

    // List all files
    const { data: files, error: listError } = await supabase.storage
      .from(BUCKET)
      .list('', { limit: 1000 });

    if (listError) throw listError;

    // Find folder directories
    const folderDirs = files.filter(f => f.name.startsWith('folder_') && f.id);
    
    if (folderDirs.length === 0) {
      console.log('✓ No folder directories found.');
      return;
    }

    console.log(`Found ${folderDirs.length} folder directory(ies):\n`);
    folderDirs.forEach(dir => console.log(`  - ${dir.name}`));
    console.log();

    // Delete each folder directory
    for (const dir of folderDirs) {
      const { error } = await supabase.storage
        .from(BUCKET)
        .remove([dir.name]);

      if (error) {
        console.warn(`⚠️  Failed to delete ${dir.name}: ${error.message}`);
      } else {
        console.log(`✓ Deleted ${dir.name}`);
      }
    }

    console.log('\n✓ Cleanup complete!');
  } catch (err) {
    console.error('❌ Error during cleanup:', err.message);
    process.exit(1);
  }
}

cleanupStorage();
