"""
Test HERE API connectivity and DNS resolution
"""
import requests
import socket
import sys

print("Testing HERE API Connection...")
print("="*60)

# Test 1: DNS Resolution
print("\n1. Testing DNS resolution for data.traffic.hereapi.com...")
try:
    ip = socket.gethostbyname("data.traffic.hereapi.com")
    print(f"   ✅ Resolved to: {ip}")
except socket.gaierror as e:
    print(f"   ❌ DNS resolution failed: {e}")
    print("\n   Try flushing DNS cache:")
    print("   Windows: ipconfig /flushdns")
    print("   Or check your DNS settings / firewall")
    sys.exit(1)

# Test 2: HTTP Connection
print("\n2. Testing HTTPS connection...")
try:
    response = requests.get("https://data.traffic.hereapi.com", timeout=10)
    print(f"   ✅ Connected successfully (Status: {response.status_code})")
except requests.exceptions.RequestException as e:
    print(f"   ❌ Connection failed: {e}")
    sys.exit(1)

# Test 3: HERE API with key
print("\n3. Testing HERE Incidents API...")
api_key = "_Y8zyahHf6R_i8_nllC1LjVeIQAySkuVSBpmm5LDaUU"
url = "https://data.traffic.hereapi.com/v7/incidents"
params = {
    'apiKey': api_key,
    'in': 'bbox:-87.0,36.0,-86.5,36.4',
    'locationReferencing': 'shape'
}

try:
    response = requests.get(url, params=params, timeout=30)
    print(f"   Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        incident_count = len(data.get('results', []))
        print(f"   ✅ API working! Found {incident_count} incidents in Nashville area")
    elif response.status_code == 401:
        print(f"   ❌ Authentication failed - check your API key")
    elif response.status_code == 403:
        print(f"   ❌ API key not authorized for this endpoint")
    else:
        print(f"   ⚠️  Unexpected status: {response.text[:200]}")
        
except requests.exceptions.RequestException as e:
    print(f"   ❌ Request failed: {e}")
    sys.exit(1)

print("\n" + "="*60)
print("✅ All tests passed! HERE API is accessible.")
print("\nYou can now run: python backend/services/here_data_collector.py --once")
