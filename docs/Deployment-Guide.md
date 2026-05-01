# Full-Stack Deployment Guide (AWS Lightsail \+ Node \+ React \+ Nginx)

This guide provides a blueprint for deploying a React/Node.js stack on a fresh AWS Lightsail instance. It utilizes **Nginx** as a reverse proxy to handle SSL/SSL-termination and route traffic between your static React files and your Node API.

**Note:** Throughout this document, values that you need to replace with the value from your instance are surrounded in `{{}}`. For example, if I was installing this, I would need to replace `git clone {{git repository}}` with `git clone https://github.com/logofile/Group4AlliesConnect`. Make sure you replace all of these placeholders with values.

## Prerequisites

- An OS-only, Amazon Linux 2023-based AWS Lightsale instance with the $12/month option:
  - 2GB RAM
  - 2 vCPUs
  - 60 GB SSD
- A domain name pointed to your Lightsail Public IP via Cloudflare.
- Access to your AWS Lightsail console.
- A database instance created on freesqldatabase.com.

## Phase 1: AWS Infrastructure Setup

Before logging into the server, configure the networking layer.

1. \[Optional\] **Static IP:** In Lightsail, create a static IP and attach it to your instance so it doesn't change on reboot.

2. **Firewall:** Navigate to the **Networking** tab of your instance. Add the following rules:
   - **TCP 80:** (HTTP) \- Required for Nginx.
   - **TCP 443:** (HTTPS) \- Required for Cloudflare SSL traffic.
   - **TCP 22:** (SSH) \- Default.

## Phase 2: Server Preparation

Log in using the web-based SSH option from the AWS console and initialize the server environment using the following commands.

```bash
sudo dnf upgrade -y
curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash -
sudo dnf install -y nodejs nginx  git
sudo npm install -g pm2
```

## Phase 3: Configure the Backend (Node.js)

1. **Clone your project:**

   ```bash
   mkdir -p /home/ec2-user/AlliesConnect
   cd /home/ec2-user/AlliesConnect
   git clone {{git repository}}
   ```

2. **Install Dependencies:**

   ```bash
   cd /home/ec2-user/AlliesConnect/Group4AlliesConnect/backend
   npm install
   ```

3. **Environment Variables:** Create the file `/home/ec2-user/AlliesConnect/Group4AlliesConnect/backend/.env` and add the following to its content:

   ```
   DB_URL={{database server URL}}
   DB_USER={{database login username}}
   DB_PASSWORD={{database login password}}
   DB_NAME={{database name}}
   REACT_APP_API_URL=

   GOOGLE_MAPS_API_KEY={{API Key for Google Maps integration}}

   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER={{Email address that will be used for the email service}}
   SMTP_PASS={{Email password for the SMTP service. For google this is a secret key that can be found on the account settings page.}}
   SMTP_FROM=Allies Connect <{{Email address that the emails should be coming from}}>
   ```

   **Note:** The `REACT_APP_API_URL` value is intentionally empty; if you were running this on a local machine, you would provide a URL.

4. **Start with PM2:**

   ```bash
   pm2 start server.js --name "Allies Connect"
   pm2 save
   ```

## Phase 4: Configure the Frontend (React)

1. **Build:**

   ```bash
   cd /home/ec2-user/AlliesConnect/Group4AlliesConnect/allies-connect
   npm install
   ```

2. **Configure:**

   ```bash
   nano .env
   ```

   Add the following to the `.env` file:

   ```
   REACT_APP_MAP_API_KEY={{Google Maps API key}}
   REACT_APP_API_URL=
   ```

   **Note:** The `REACT_APP_API_URL` value is intentionally empty; if you were running this on a local machine, you would provide a URL.

3. **Build:**

   ```bash
   npm run build
   ```

4. **Deploy Files:**

   ```bash
   sudo mkdir -p /var/www/html/allies
   sudo cp -r /home/ec2-user/AlliesConnect/Group4AlliesConnect/allies-connect/build/* /var/www/html/allies/
   ```

5. **Fix Permissions:** Nginx needs permission to access your home directory path.

   ```bash
   sudo chmod \+x /var/www
   sudo chmod \+x /var/www/html
   sudo chmod \-R 755 /var/www/html/allies
   ```

## Phase 5: Nginx Reverse Proxy

1. **Configure Nginx:**

   ```bash
   sudo nano /etc/nginx/nginx.conf
   ```

   Find the `server { ... }` block inside the `http` block (usually around line 40-60) that listens on port 80 and has `root /usr/share/nginx/html;`. Comment out every line in that block by adding a `#` at the start.

2. **Create Site Configuration:**

   ```bash
   sudo nano /etc/nginx/conf.d/allies.conf
   ```

   Paste the following:

   ```
   server {
       listen 80;
       server_name {{yourdomain.com}};
       root /var/www/html/allies;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       location /api/ {
           proxy_pass http://127.0.0.1:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

3. **Test and Restart:**

   ```bash
   sudo nginx -t
   sudo systemctl enable nginx
   sudo systemctl restart nginx
   ```

## Phase 6: Cloudflare Setup

1. **DNS:** Set an **A record** pointing to your Lightsail Static IP.
2. **SSL/TLS:**
   - **Flexible:** Use if you want Cloudflare to handle SSL but connect to your server over HTTP (port 80).
   - **Full:** Recommended. Use this after installing a certificate on your server (e.g., via Certbot).

## Phase 7: Setting Up the Database

### Applying the Schema

Before the application can run, the database schema must be applied. Run the following against your database instance using a MySQL client (e.g. `mysql` CLI, DBeaver, or the freesqldatabase.com web console):

```sql
SOURCE /home/ec2-user/AlliesConnect/Group4AlliesConnect/database/schema.sql;
```

Or if connecting remotely via the CLI:

```bash
mysql -h {{database server URL}} -u {{database login username}} -p {{database name}} < /home/ec2-user/AlliesConnect/Group4AlliesConnect/database/schema.sql
```

### Loading the Seed Data (Development / Testing Only)

The seed file populates the database with sample users, organizations, events, volunteer opportunities, and other test data. **Do not run this on a production database** — it is intended for development and demo environments only.

After applying the schema, run:

```bash
mysql -h {{database server URL}} -u {{database login username}} -p {{database name}} < /home/ec2-user/AlliesConnect/Group4AlliesConnect/database/seed.sql
```

This will create the following test accounts (all passwords are placeholder hashes and **cannot be used to log in** — use the `create_admin.js` script described below to create a real admin account):

| Username | Role      | Email               |
| -------- | --------- | ------------------- |
| alice    | user      | alice@example.com   |
| bob      | volunteer | bob@volunteer.org   |
| charlie  | provider  | charlie@charity.com |
| admin    | admin     | admin@system.com    |
| dave     | provider  | dave@provider.io    |

It also seeds sample service providers, locations, resources, events, volunteer shifts, categories, and availability data.

---

## Phase 8: Creating the First Admin Account

New maintainers who need an admin account can use the `create_admin.js` script to create one directly in the database — no existing admin account or running UI is required.

### Steps

1. **Open the script** at `backend/scripts/create_admin.js` and fill in the `NEW_ADMIN` object at the top of the file:

   ```js
   const NEW_ADMIN = {
     username: "youradminusername",
     email: "you@example.com",
     password: "YourP@ssword1", // 7+ chars, one capital, one special character, no spaces
     first_name: "First",
     last_name: "Last",
     phone: "4045551234", // 10 digits, no dashes or spaces
     zip_code: "30301",
   };
   ```

2. **Run the script** from the `backend/` directory, setting `NODE_ENV` to match your target environment:

   ```bash
   cd /home/ec2-user/AlliesConnect/Group4AlliesConnect/backend

   # Production database
   node scripts/create_admin.js

   # Development database
   NODE_ENV=development node scripts/create_admin.js
   ```

3. **Check the output.** You will see exactly one of the following:

   ```
   [SUCCESS] Account created — username: youradminusername, email: you@example.com, user_id: 1
   ```

   ```
   [FAILED] Account not created — failed local validation: {Reason for failure}
   ```

   ```
   [FAILED] Account not created — failed during creation: {Reason for failure}

   ```

4. **Clear your credentials.** After the script runs successfully, blank out the `NEW_ADMIN` fields in the file before committing to version control.

---

## **Troubleshooting**

- **Status Check:** `pm2 status` and `sudo systemctl status nginx`.
- **Port Check:** `ss -tulpn | grep 5000` (Verify Node is listening).
- **Error Logs:** `sudo tail -f /var/log/nginx/error.log`.
