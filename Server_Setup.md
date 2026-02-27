# Allies Connect - Server Setup 

## Server Information

- OS: RHEL 9 (Linux)
- Server IP: 10.96.61.243
- App Root: /opt/allies-connect
- Backend Path: /opt/allies-connect/Group4AlliesConnect/backend
- Backend Port: 5000
- Process Manager: PM2

---

## Connecting to the Server
1. Connecf to KSU VPN (GlobalProtect)
2. SSH into the server:

ssh adminstrator@10.96.61.243

---

## Deployment Location

All backend code runs from:

/opt/allies-connect/Group4AlliesConnect/backendStart/Restart:

Do NOT run additional backend instances from home directories

---

### Pulling Lastest Code After Merge

After a PR is merged into main:

cd /opt/allies-connect/Group4AlliesConnect
git pull origin main
cd backend
nmp install
pm2 restart allies-backend

---

## Checking Backend Status:

Check if backend is running:

pm2 list

View logs:

pm2 logs allies-backend

## Environment Variables

The backend uses a server-only .env file located at:

/opt/allies-connect/Group4AlliesConnect/backend/.env

This file contains database credentials an is not committed to GitHub

## Restarting Backend Manually

 Restart:

 pm2 restart allies-backend

 Stop: 

 pm2 restart allies-backend

 Start manually:

 pm2 start server.js --name allies-backend
