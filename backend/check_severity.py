import mysql.connector

conn = mysql.connector.connect(
    host='127.0.0.1',
    user='trafficwiz_user',
    password='StrongPass123!',
    database='trafficwiz'
)

cur = conn.cursor()

# Check severity distribution
cur.execute('SELECT severity, COUNT(*) as count FROM traffic_incidents GROUP BY severity')
print('Severity distribution in database:')
for row in cur.fetchall():
    print(f'  {repr(row[0])}: {row[1]} incidents')

# Check first 10 incidents
print('\nFirst 10 incidents:')
cur.execute('SELECT id, severity, location FROM traffic_incidents LIMIT 10')
for row in cur.fetchall():
    print(f'  ID {row[0]}: severity={repr(row[1])}, location={row[2][:50] if row[2] else "None"}')

# Check severity column type
cur.execute("DESCRIBE traffic_incidents")
print('\nTable schema:')
for row in cur.fetchall():
    if row[0] == 'severity':
        print(f'  severity column type: {row[1]}')

cur.close()
conn.close()
