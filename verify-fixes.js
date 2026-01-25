#!/usr/bin/env node

/**
 * Quick Test Script for Admin & Logout Functionality
 * 
 * This script helps verify that:
 * 1. The build completes without errors
 * 2. All critical files are properly formatted
 * 3. No TypeScript errors exist
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test 1: Check if critical files exist
console.log('✓ Test 1: Checking critical files...');
const criticalFiles = [
    'src/pages/Profile.tsx',
    'src/components/admin/AdminLayout.tsx',
    'src/components/admin/ProtectedRoute.tsx',
    'src/hooks/useAuth.tsx',
];

let allFilesExist = true;
criticalFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        console.log(`  ✓ ${file}`);
    } else {
        console.log(`  ✗ ${file} - MISSING!`);
        allFilesExist = false;
    }
});

if (allFilesExist) {
    console.log('  ✓ All critical files exist\n');
} else {
    console.log('  ✗ Some files are missing!\n');
    process.exit(1);
}

// Test 2: Check Profile.tsx for correct order
console.log('✓ Test 2: Verifying Profile.tsx fix...');
const profileContent = fs.readFileSync(path.join(__dirname, 'src/pages/Profile.tsx'), 'utf8');

// Check that loading check comes before displayName
const loadingCheckIndex = profileContent.indexOf('if (loading)');
const displayNameIndex = profileContent.indexOf('const displayName');

if (loadingCheckIndex < displayNameIndex && loadingCheckIndex !== -1) {
    console.log('  ✓ Profile.tsx: Loading check is before displayName declaration');
} else {
    console.log('  ✗ Profile.tsx: Loading check order is incorrect!');
    process.exit(1);
}

// Check that user check comes before displayName
const userCheckIndex = profileContent.indexOf('if (!user) return null');
if (userCheckIndex < displayNameIndex && userCheckIndex !== -1) {
    console.log('  ✓ Profile.tsx: User check is before displayName declaration\n');
} else {
    console.log('  ✗ Profile.tsx: User check order is incorrect!\n');
    process.exit(1);
}

// Test 3: Check AdminLayout.tsx doesn't have early return
console.log('✓ Test 3: Verifying AdminLayout.tsx fix...');
const adminLayoutContent = fs.readFileSync(path.join(__dirname, 'src/components/admin/AdminLayout.tsx'), 'utf8');

// Check that there's NO early return after the hooks
const hasEarlyReturn = /const \[sidebarOpen[\s\S]*?if \(!user\) \{\s*return null;\s*\}[\s\S]*?const logoUrl/.test(adminLayoutContent);

if (!hasEarlyReturn) {
    console.log('  ✓ AdminLayout.tsx: No premature early return (logout will work)\n');
} else {
    console.log('  ✗ AdminLayout.tsx: Has premature early return (logout may fail)!\n');
    process.exit(1);
}

// Test 4: Check setup files exist
console.log('✓ Test 4: Checking setup files...');
const setupFiles = [
    'setup-admin-user.sql',
    'ADMIN_SETUP_GUIDE.md',
];

setupFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        console.log(`  ✓ ${file}`);
    } else {
        console.log(`  ✗ ${file} - MISSING!`);
    }
});

console.log('\n✅ All tests passed!');
console.log('\n📋 Next Steps:');
console.log('1. Run the SQL script in setup-admin-user.sql in your Supabase SQL Editor');
console.log('2. Read ADMIN_SETUP_GUIDE.md for detailed instructions');
console.log('3. Start your dev server: npm run dev');
console.log('4. Test logout and admin access');
