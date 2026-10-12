#!/usr/bin/env node

/**
 * Complete Codebase Error Scanner
 * Scans for potential runtime errors, undefined variables, and console issues
 */

const fs = require('fs');
const path = require('path');

const ISSUES = {
    critical: [],
    warnings: [],
    info: []
};

// Check for console.log/error/warn in production code
function checkConsoleStatements() {
    const files = [
        'app.js',
        'middleware.js',
        ...fs.readdirSync('controllers').map(f => `controllers/${f}`),
        ...fs.readdirSync('routes').map(f => `routes/${f}`),
        ...fs.readdirSync('models').map(f => `models/${f}`),
    ];

    files.forEach(file => {
        try {
            const content = fs.readFileSync(file, 'utf8');
            const lines = content.split('\n');

            lines.forEach((line, idx) => {
                // Skip commented lines
                if (line.trim().startsWith('//')) return;

                if (line.includes('console.log') && !line.includes('CONNECTION')) {
                    ISSUES.info.push({
                        file,
                        line: idx + 1,
                        message: 'console.log statement found (consider using a logger)',
                        code: line.trim()
                    });
                }
            });
        } catch (err) {
            // Skip if file doesn't exist or can't be read
        }
    });
}

// Check for missing error handling
function checkErrorHandling() {
    const controllers = fs.readdirSync('controllers');

    controllers.forEach(file => {
        try {
            const content = fs.readFileSync(`controllers/${file}`, 'utf8');

            // Check if using catchAsync wrapper
            if (content.includes('module.exports.') && !content.includes('catchAsync') && !content.includes('try {')) {
                ISSUES.warnings.push({
                    file: `controllers/${file}`,
                    message: 'Controller may be missing error handling (no catchAsync or try/catch found)'
                });
            }
        } catch (err) {
            // Skip
        }
    });
}

// Check for undefined variable usage in templates
function checkTemplates() {
    const walkSync = (dir, filelist = []) => {
        fs.readdirSync(dir).forEach(file => {
            const filepath = path.join(dir, file);
            if (fs.statSync(filepath).isDirectory()) {
                filelist = walkSync(filepath, filelist);
            } else if (file.endsWith('.ejs')) {
                filelist.push(filepath);
            }
        });
        return filelist;
    };

    const templates = walkSync('views');

    templates.forEach(file => {
        try {
            const content = fs.readFileSync(file, 'utf8');

            // Check for unprotected variable access
            const dangerousPatterns = [
                { pattern: /<%=\s*(?!typeof\s)(\w+)\.(\w+)\.(\w+)/g, msg: 'Deep property access without null check' },
                { pattern: /<%=\s*process\.env\.(\w+)\s*%>/g, msg: 'Direct process.env access (should provide default)' }
            ];

            dangerousPatterns.forEach(({ pattern, msg }) => {
                const matches = content.match(pattern);
                if (matches && !file.includes('boilerplate.ejs')) {
                    ISSUES.info.push({
                        file,
                        message: msg,
                        count: matches.length
                    });
                }
            });
        } catch (err) {
            // Skip
        }
    });
}

// Check for missing files
function checkMissingFiles() {
    const requiredFiles = [
        'views/layouts/boilerplate.ejs',
        'views/includes/navbar.ejs',
        'views/includes/footer.ejs',
        'views/includes/flash.ejs',
        'views/includes/csrf.ejs',
        'views/error.ejs',
        'public/css/style.css',
        'public/js/map.js',
        'public/js/forms.js',
        'public/favicon.svg',
        'public/manifest.json',
        '.env'
    ];

    requiredFiles.forEach(file => {
        if (!fs.existsSync(file)) {
            ISSUES.critical.push({
                file,
                message: 'Required file is missing'
            });
        }
    });
}

// Check environment variables
function checkEnvConfig() {
    if (fs.existsSync('.env')) {
        const content = fs.readFileSync('.env', 'utf8');

        const required = ['DB_URL', 'SESSION_SECRET', 'MAPBOX_TOKEN', 'CLOUDINARY_CLOUD_NAME'];

        required.forEach(key => {
            if (!content.includes(key)) {
                ISSUES.critical.push({
                    message: `Missing required environment variable: ${key}`
                });
            }
        });

        if (content.includes('SESSION_SECRET=replace-with-a-long-random-string')) {
            ISSUES.critical.push({
                message: 'SESSION_SECRET is still set to default value - MUST CHANGE before production!'
            });
        }

        if (content.includes('NODE_ENV=development')) {
            ISSUES.warnings.push({
                message: 'NODE_ENV is set to development - change to "production" for deployment'
            });
        }
    } else {
        ISSUES.critical.push({
            message: '.env file is missing'
        });
    }
}

// Run all checks
console.log('\n🔍 Scanning codebase for potential issues...\n');

checkMissingFiles();
checkEnvConfig();
checkConsoleStatements();
checkErrorHandling();
checkTemplates();

// Display results
console.log('═'.repeat(70));
console.log('                     CODEBASE HEALTH REPORT');
console.log('═'.repeat(70));

if (ISSUES.critical.length > 0) {
    console.log('\n🔴 CRITICAL ISSUES (Must fix before production):');
    console.log('─'.repeat(70));
    ISSUES.critical.forEach(issue => {
        console.log(`\n   ${issue.file || 'Config'}`);
        console.log(`   ❌ ${issue.message}`);
        if (issue.code) console.log(`      ${issue.code}`);
    });
}

if (ISSUES.warnings.length > 0) {
    console.log('\n\n🟡 WARNINGS (Review before production):');
    console.log('─'.repeat(70));
    ISSUES.warnings.forEach(issue => {
        console.log(`\n   ${issue.file || 'Config'}`);
        console.log(`   ⚠️  ${issue.message}`);
    });
}

if (ISSUES.info.length > 0) {
    console.log('\n\n🔵 INFO (Optional improvements):');
    console.log('─'.repeat(70));
    ISSUES.info.forEach(issue => {
        console.log(`\n   ${issue.file}`);
        console.log(`   ℹ️  ${issue.message}`);
        if (issue.count) console.log(`      Found ${issue.count} occurrence(s)`);
    });
}

if (ISSUES.critical.length === 0 && ISSUES.warnings.length === 0 && ISSUES.info.length === 0) {
    console.log('\n\n✅ No issues found! Codebase is clean.\n');
} else {
    console.log('\n');
    console.log('═'.repeat(70));
    console.log(`Summary: ${ISSUES.critical.length} critical, ${ISSUES.warnings.length} warnings, ${ISSUES.info.length} info`);
    console.log('═'.repeat(70));
    console.log('');
}

process.exit(ISSUES.critical.length > 0 ? 1 : 0);
