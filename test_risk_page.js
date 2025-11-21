// Test script to validate Risk page API endpoints
const API_BASE = "http://127.0.0.1:5000";

async function testRiskPageEndpoints() {
  console.log('🧪 Testing Risk Page Endpoints...\n');
  
  // Test 1: Severity data
  try {
    const response = await fetch(`${API_BASE}/api/incidents/by-severity`);
    const data = await response.json();
    console.log('✅ Severity endpoint:', response.status);
    console.log('   Data:', data.by_severity?.length || 0, 'severity levels');
  } catch (error) {
    console.log('❌ Severity endpoint failed:', error.message);
  }
  
  // Test 2: Metrics
  try {
    const response = await fetch(`${API_BASE}/metrics`);
    const data = await response.json();
    console.log('✅ Metrics endpoint:', response.status);
    console.log('   Keys:', Object.keys(data));
  } catch (error) {
    console.log('❌ Metrics endpoint failed:', error.message);
  }
  
  // Test 3: Road analysis
  try {
    const response = await fetch(`${API_BASE}/road-analysis`);
    const data = await response.json();
    console.log('✅ Road analysis endpoint:', response.status);
    console.log('   Roads found:', Object.keys(data).length);
    if (Object.keys(data).length > 0) {
      console.log('   Sample road:', Object.keys(data)[0]);
    }
  } catch (error) {
    console.log('❌ Road analysis endpoint failed:', error.message);
  }
  
  // Test 4: HERE incidents (should fallback gracefully)
  try {
    const response = await fetch(`${API_BASE}/api/here/traffic-incidents`);
    const data = await response.json();
    console.log('✅ HERE incidents endpoint:', response.status);
    console.log('   Incidents:', data.count || 0);
    if (data.message) {
      console.log('   Message:', data.message);
    }
  } catch (error) {
    console.log('❌ HERE incidents endpoint failed:', error.message);
  }
  
  console.log('\n🎯 Risk page should now load properly!');
}

// Run in Node.js or browser console
if (typeof window === 'undefined') {
  // Node.js environment
  const fetch = require('node-fetch');
  testRiskPageEndpoints();
} else {
  // Browser environment
  console.log('Run testRiskPageEndpoints() in browser console');
  window.testRiskPageEndpoints = testRiskPageEndpoints;
}