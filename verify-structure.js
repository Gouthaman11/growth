#!/usr/bin/env node

import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

console.log('🎓 EduGrow+ Structure Verification')
console.log('=====================================\n')

// Check if directories exist
const directories = [
    'frontend',
    'backend',
    'frontend/src',
    'frontend/public',
    'backend/controllers',
    'backend/routes',
    'backend/models'
]

console.log('📁 Checking directory structure...')
let structureValid = true

directories.forEach(dir => {
    const fullPath = join(__dirname, dir)
    if (fs.existsSync(fullPath)) {
        console.log(`✅ ${dir}`)
    } else {
        console.log(`❌ ${dir} - MISSING`)
        structureValid = false
    }
})

// Check if essential files exist
const files = [
    'frontend/package.json',
    'frontend/index.html',
    'frontend/vite.config.js',
    'backend/package.json', 
    'backend/server.js',
    'README.md'
]

console.log('\n📄 Checking essential files...')
files.forEach(file => {
    const fullPath = join(__dirname, file)
    if (fs.existsSync(fullPath)) {
        console.log(`✅ ${file}`)
    } else {
        console.log(`❌ ${file} - MISSING`)
        structureValid = false
    }
})

if (structureValid) {
    console.log('\n🎉 Project structure is valid!')
    console.log('\n🚀 Next steps:')
    console.log('   1. Run: npm install (install workspace manager)')
    console.log('   2. Run: npm run install:all (install all dependencies)')
    console.log('   3. Run: npm run dev (start both servers)')
    console.log('\n💡 Or run: npm run setup (interactive setup)')
} else {
    console.log('\n❌ Project structure has issues - please check missing files/directories')
}

console.log('\n📖 See README.md for detailed setup instructions')