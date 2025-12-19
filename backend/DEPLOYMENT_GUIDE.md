# Backend Deployment Guide for Ubuntu Server

This guide will help you deploy and run the Knapsack Tool backend as a systemd service on Ubuntu.

## Prerequisites

- Ubuntu Server (18.04 or later)
- Node.js installed (v18 or later)
- MySQL database running
- Backend code in `/var/knapsack-tool/backend`

## Step 1: Verify Node.js Installation

```bash
node --version  # Should be v18 or later
npm --version
```

If Node.js is not installed:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## Step 2: Setup Backend Directory

```bash
cd /var/knapsack-tool/backend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
nano .env  # Edit with your database credentials
```

## Step 3: Run Database Migrations

```bash
npx prisma migrate deploy
npx prisma generate
```

## Step 4: Seed BOM Data (First Time Only)

```bash
# Make sure bom_data_export.json is in the backend directory
node scripts/seedBomComplete.js
```

## Step 5: Install Systemd Service

```bash
# Copy the service file to systemd directory
sudo cp knapsack-backend.service /etc/systemd/system/

# Reload systemd to recognize the new service
sudo systemctl daemon-reload

# Enable the service to start on boot
sudo systemctl enable knapsack-backend

# Start the service
sudo systemctl start knapsack-backend
```

## Step 6: Verify Service is Running

```bash
# Check service status
sudo systemctl status knapsack-backend

# View logs
sudo journalctl -u knapsack-backend -f

# Check if API is responding
curl http://localhost:5050/api/health
```

## Common Commands

### Start the service
```bash
sudo systemctl start knapsack-backend
```

### Stop the service
```bash
sudo systemctl stop knapsack-backend
```

### Restart the service
```bash
sudo systemctl restart knapsack-backend
```

### View logs (real-time)
```bash
sudo journalctl -u knapsack-backend -f
```

### View last 100 logs
```bash
sudo journalctl -u knapsack-backend -n 100
```

### Check service status
```bash
sudo systemctl status knapsack-backend
```

### Disable service (prevent auto-start on boot)
```bash
sudo systemctl disable knapsack-backend
```

## Troubleshooting

### Service won't start

1. **Check logs:**
   ```bash
   sudo journalctl -u knapsack-backend -n 50
   ```

2. **Verify Node.js path:**
   ```bash
   which node
   # Update ExecStart in service file if different from /usr/bin/node
   ```

3. **Check permissions:**
   ```bash
   ls -la /var/knapsack-tool/backend
   ```

4. **Test manually:**
   ```bash
   cd /var/knapsack-tool/backend
   node src/server.js
   ```

### Database connection errors

1. **Check .env file:**
   ```bash
   cat .env | grep DATABASE_URL
   ```

2. **Test MySQL connection:**
   ```bash
   mysql -u your_user -p -h localhost
   ```

3. **Verify MySQL is running:**
   ```bash
   sudo systemctl status mysql
   ```

### Port already in use

1. **Find process using port 5000:**
   ```bash
   sudo lsof -i :5000
   ```

2. **Kill the process or change port in .env:**
   ```bash
   # Change PORT in .env file
   nano .env
   # Then restart service
   sudo systemctl restart knapsack-backend
   ```

## Update/Redeploy

When you update your code:

```bash
cd /var/knapsack-tool/backend

# Pull latest code (if using git)
git pull

# Install new dependencies (if any)
npm install

# Run new migrations (if any)
npx prisma migrate deploy

# Restart the service
sudo systemctl restart knapsack-backend

# Check logs
sudo journalctl -u knapsack-backend -f
```

## Environment Variables

Make sure your `.env` file contains:

```env
# Database
DATABASE_URL="mysql://username:password@localhost:3306/knapsack_db"

# Server
PORT=5000
NODE_ENV=production

# Optional: CORS origins
CORS_ORIGIN=http://your-frontend-domain.com
```

## Security Recommendations

1. **Use a non-root user** (recommended):
   ```bash
   sudo useradd -r -s /bin/false knapsack
   sudo chown -R knapsack:knapsack /var/knapsack-tool
   # Update User=knapsack in service file
   ```

2. **Setup firewall:**
   ```bash
   sudo ufw allow 5000/tcp
   sudo ufw enable
   ```

3. **Use reverse proxy (Nginx):**
   ```bash
   sudo apt install nginx
   # Configure nginx to proxy to localhost:5000
   ```

---

**Note:** This guide assumes the backend is in `/var/knapsack-tool/backend`. Adjust paths if your location is different.
