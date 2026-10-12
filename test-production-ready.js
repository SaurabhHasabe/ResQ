#!/usr/bin/env node

/**
 * Production Readiness Test Script
 * Tests all critical endpoints and checks for errors
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';
const TESTS = [
    { name: 'Homepage', path: '/', expectedStatus: 302 }, // redirects to /incidents
    { name: 'Incidents List', path: '/incidents', expectedStatus: 200 },
    { name: 'Shelters List', path: '/shelters', expectedStatus: 200 },
    { name: 'Requests List', path: '/requests', expectedStatus: 200 },
    { name: 'Login Page', path: '/login', expectedStatus: 200 },
    { name: 'Register Page', path: '/register', expectedStatus: 200 },
    { name: 'Health Check', path: '/health', expectedStatus: 200 },
    { name: 'Favicon SVG', path: '/favicon.svg', expectedStatus: 200 },
    { name: 'Manifest', path: '/manifest.json', expectedStatus: 200 },
    { name: 'CSS - Style', path: '/css/style.css', expectedStatus: 200 },
    { name: 'CSS - Mobile', path: '/css/mobile-enhancements.css', expectedStatus: 200 },
    { name: 'JS - Map', path: '/js/map.js', expectedStatus: 200 },
    { name: 'JS - Forms', path: '/js/forms.js', expectedStatus: 200 },
    { name: 'JS - Mobile Utils', path: '/js/mobile-utils.js', expectedStatus: 200 },
    { name: '404 Test', path: '/this-should-not-exist', expectedStatus: 404 },
];

let passed = 0;
let failed = 0;

console.log('\n🚀 Starting Production Readiness Tests...\n');
console.log('Testing endpoints at:', BASE_URL);
console.log('─'.repeat(60));

function testEndpoint(test) {
    return new Promise((resolve) => {
        http.get(`${BASE_URL}${test.path}`, (res) => {
            const success = res.statusCode === test.expectedStatus;

            if (success) {
                console.log(`✅ ${test.name.padEnd(25)} → ${res.statusCode}`);
                passed++;
            } else {
                console.log(`❌ ${test.name.padEnd(25)} → ${res.statusCode} (expected ${test.expectedStatus})`);
                failed++;
            }

            resolve();
        }).on('error', (err) => {
            console.log(`❌ ${test.name.padEnd(25)} → ERROR: ${err.message}`);
            failed++;
            resolve();
        });
    });
}

async function runTests() {
    // Check if server is running
    try {
        await new Promise((resolve, reject) => {
            http.get(`${BASE_URL}/health`, (res) => {
                if (res.statusCode === 200) {
                    resolve();
                } else {
                    reject(new Error('Health check failed'));
                }
            }).on('error', reject);
        });
    } catch (err) {
        console.log('\n❌ Server is not running at', BASE_URL);
        console.log('   Please start the server first: npm start\n');
        process.exit(1);
    }

    console.log('✓ Server is running\n');

    // Run all tests sequentially
    for (const test of TESTS) {
        await testEndpoint(test);
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay between requests
    }

    // Summary
    console.log('─'.repeat(60));
    console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed\n`);

    if (failed === 0) {
        console.log('✅ All tests passed! Application is production-ready.\n');
        process.exit(0);
    } else {
        console.log('❌ Some tests failed. Please review the errors above.\n');
        process.exit(1);
    }
}

runTests().catch(err => {
    console.error('Test runner failed:', err);
    process.exit(1);
});
