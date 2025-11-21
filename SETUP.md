# TrafficWiz - First-Time Setup Guide

This guide walks you through setting up TrafficWiz on your local machine.

---

## Prerequisites

Before you start, make sure you have installed:
- ✅ **Python 3.8+** - [Download Python](https://www.python.org/downloads/)
- ✅ **Node.js 18+** - [Download Node.js](https://nodejs.org/)
- ✅ **MySQL 8.0+** - [Download MySQL](https://dev.mysql.com/downloads/mysql/)
- ✅ **Git** - [Download Git](https://git-scm.com/downloads)

---

## Step 1: Clone the Repository

```bash
git clone https://github.com/WebbOfCode/TrafficWIz.git
cd TrafficWiz
```

---

## Step 2: MySQL Database Setup

### 2.1 Start MySQL Server

Make sure MySQL is running:

**Windows (PowerShell):**
```powershell
Get-Service MySQL*
# If not running, start it:
Start-Service MySQL80
```

**macOS/Linux:**
```bash
sudo systemctl start mysql
# or
brew services start mysql
```

### 2.2 Login to MySQL

```bash
mysql -u root -p
# Enter your MySQL root password
```

### 2.3 Create Database and User

Run these SQL commands in the MySQL prompt:

```sql
-- Create the database
CREATE DATABASE trafficwiz;

-- Create a dedicated user for the app
CREATE USER 'trafficwiz_user'@'localhost' IDENTIFIED BY 'StrongPass123!';

-- Grant permissions
GRANT ALL PRIVILEGES ON trafficwiz.* TO 'trafficwiz_user'@'localhost';
FLUSH PRIVILEGES;

-- Verify it worked
SHOW DATABASES;

-- Exit MySQL
EXIT;
```

**Important:** You can change the username and password, but make sure to update the `.env` file (Step 3).

### 2.4 Create Database Schema

From the project root, run:

```bash
mysql -u trafficwiz_user -p trafficwiz < db/schema.sql
```

Enter the password (`StrongPass123!` or your custom password).



---

## Step 3: Configure Environment Variables

### Backend Configuration

1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```

2. Copy the example env file:
   ```bash
   # Windows
   copy .env.example .env
   
   # macOS/Linux
   cp .env.example .env
   ```

3. Open `backend/.env` in a text editor and update with your MySQL credentials:
   ```env
   DB_HOST=127.0.0.1
   DB_USER=trafficwiz_user
   DB_PASSWORD=StrongPass123!
   DB_NAME=trafficwiz
   PORT=5000
   ```

### Frontend Configuration (Optional - for Mapbox)

1. Navigate to the `frontend` folder:
   ```bash
   cd ../frontend
   ```

2. Copy the example env file:
   ```bash
   # Windows
   copy .env.example .env
   
   # macOS/Linux
   cp .env.example .env
   ```

3. (Optional) Add your Mapbox token to `frontend/.env`:
   ```env
   VITE_MAPBOX_TOKEN=your_mapbox_token_here
   ```
   
   Get a free token at: https://account.mapbox.com/access-tokens/
   
   *Note: The app will work without this, but won't show the map on the Home page.*

---

## Step 4: Run the Application

### Option A: Automated Start (Windows)

From the project root, double-click `start.bat` or run:

```powershell
.\start.bat
```

This will:
1. Create Python virtual environment
2. Install backend dependencies
3. Start Flask backend (port 5000)
4. Install frontend dependencies
5. Start Vite dev server (port 5173)



### Option B: Manual Start (All Platforms)

**Terminal 1 - Backend:**
```bash
cd backend
python -m venv venv

# Activate venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start Flask
python app.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## Step 5: Access the Application

Once both servers are running:

- **Frontend (React App):** http://localhost:5173
- **Backend API:** http://localhost:5000

---

## Troubleshooting

### MySQL Connection Errors

**Error:** `Access denied for user 'trafficwiz_user'@'localhost'`

**Fix:** 
- Make sure you created the MySQL user (Step 2.3)
- Verify credentials in `backend/.env` match MySQL user

**Error:** `Can't connect to MySQL server on '127.0.0.1'`

**Fix:**
- Check if MySQL is running: `Get-Service MySQL*` (Windows) or `systemctl status mysql` (Linux)
- Start MySQL if stopped

### Database Already Exists

If you get "database already exists" error:
```sql
DROP DATABASE trafficwiz;
CREATE DATABASE trafficwiz;
```

Then re-run schema:
```bash
mysql -u trafficwiz_user -p trafficwiz < db/schema.sql
```

### Port Already in Use

If port 5000 or 5173 is taken:

**Backend:** Change `PORT=5000` in `backend/.env` to another port (e.g., `5001`)

**Frontend:** The Vite dev server will auto-increment if 5173 is taken



### Clear Database Data

To reset all traffic incidents:
```sql
mysql -u trafficwiz_user -p
USE trafficwiz;
TRUNCATE TABLE traffic_incidents;
EXIT;
```



---

## Next Steps

✅ Explore the Dashboard at http://localhost:5173/dashboard  
✅ View Incidents at http://localhost:5173/incidents  
✅ Check Risk Analysis at http://localhost:5173/risk  
✅ Read `docs/README.md` for architecture details  

---

## Need Help?

- Check `docs/README.md` for detailed documentation
- Review `HEADERS_ADDED.md` for file-by-file explanations
- Open an issue on GitHub

---

**Happy coding! 🚀**
