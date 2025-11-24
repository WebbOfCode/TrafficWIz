from services.here_service import HereService
import os

hs = HereService(os.getenv('HERE_API_KEY', '_Y8zyahHf6R_i8_nllC1LjVeIQAySkuVSBpmm5LDaUU'))
result = hs.get_traffic_incidents('-87.0,36.0,-86.5,36.4')
incidents = result.get('incidents', [])

print(f'Fetched {len(incidents)} incidents from HERE API')
print('\nSeverity distribution:')

severity_counts = {}
for inc in incidents:
    sev = inc.get('severity', 'Unknown')
    severity_counts[sev] = severity_counts.get(sev, 0) + 1

for k, v in severity_counts.items():
    print(f'  {k}: {v}')

print('\nFirst 5 incidents:')
for i, inc in enumerate(incidents[:5]):
    print(f"  {i+1}. Severity: {inc.get('severity')}, Type: {inc.get('type')}, Desc: {inc.get('description', '')[:60]}")
