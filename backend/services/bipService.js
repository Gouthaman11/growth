import puppeteer from 'puppeteer';
import crypto from 'crypto';

// Encryption key for storing credentials (use env variable in production)
const ENCRYPTION_KEY = process.env.BIP_ENCRYPTION_KEY || 'edugrow-plus-bip-secret-key-32ch';
const IV_LENGTH = 16;

// Encrypt credentials before storing
export function encryptCredential(text) {
    if (!text) return '';
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

// Decrypt credentials when needed
export function decryptCredential(text) {
    if (!text || !text.includes(':')) return '';
    try {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (error) {
        console.error('Decryption error:', error);
        return '';
    }
}

// Main BIP portal scraping function - attempts to scrape after Google OAuth
export async function fetchBIPData(email) {
    let browser = null;
    
    try {
        console.log('Launching browser for BIP scraping...');
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ]
        });

        const page = await browser.newPage();
        page.setDefaultTimeout(30000);
        await page.setViewport({ width: 1280, height: 800 });
        
        // Navigate to BIP portal
        console.log('Navigating to BIP portal...');
        await page.goto('https://bip.bitsathy.ac.in', { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });

        // Since BIP uses Google SSO, we can't directly login
        // Instead, we'll check if there's any public data available
        // or return a structure for manual entry
        
        const pageTitle = await page.title();
        const currentUrl = page.url();
        
        console.log('BIP Page:', pageTitle, currentUrl);
        
        await browser.close();
        
        // Return data structure - actual data needs to be entered manually
        // since Google OAuth requires user interaction
        return {
            success: false,
            requiresManualEntry: true,
            message: 'BIP uses Google SSO which requires manual login. Please enter your academic data manually.',
            portalUrl: 'https://bip.bitsathy.ac.in',
            data: null
        };

    } catch (error) {
        console.error('BIP access error:', error.message);
        
        if (browser) {
            await browser.close();
        }
        
        return {
            success: false,
            requiresManualEntry: true,
            error: error.message,
            message: 'Could not access BIP portal automatically. Please enter data manually.',
            portalUrl: 'https://bip.bitsathy.ac.in',
            data: null
        };
    }
}

// Get BIP portal login page for checking connectivity
export async function testBIPConnection() {
    let browser = null;
    
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.goto('https://bip.bitsathy.ac.in', { waitUntil: 'networkidle2', timeout: 30000 });
        
        const title = await page.title();
        const url = page.url();
        
        // Check if it redirects to Google login
        const usesGoogleSSO = url.includes('google') || url.includes('accounts.google') || title.toLowerCase().includes('sign in');
        
        await browser.close();
        
        return {
            success: true,
            title,
            url,
            usesGoogleSSO,
            message: usesGoogleSSO 
                ? 'BIP uses Google SSO - manual data entry recommended'
                : 'BIP portal is accessible'
        };
    } catch (error) {
        if (browser) await browser.close();
        return {
            success: false,
            error: error.message,
            message: 'Could not connect to BIP portal'
        };
    }
}
