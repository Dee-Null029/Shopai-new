# Azure VM Deployment

This guide prepares ShopAI for a single Ubuntu VM on Azure.

## Recommended VM Shape

- Ubuntu 24.04 LTS
- Size: at least 2 vCPU and 4 GB RAM
- Open inbound ports: `22`, `80`, and optionally `443`
- Keep MongoDB and Redis private on the VM. Do not expose ports `27017` or `6379`.

## 1. Copy Project To The VM

On your local machine:

```bash
scp -r /home/deeban/Documents/Shopai azureuser@YOUR_AZURE_VM_PUBLIC_IP:/tmp/Shopai
```

On the VM:

```bash
sudo mkdir -p /var/www
sudo mv /tmp/Shopai /var/www/shopai
sudo chown -R "$USER":"$USER" /var/www/shopai
cd /var/www/shopai
```

## 2. Install Server Dependencies

Run the setup script once:

```bash
sudo bash deploy/azure-vm/setup-ubuntu.sh
```

This installs Node.js 20, Nginx, MongoDB, Redis, PM2, Git, and UFW firewall rules.

## 3. Configure Environment

Create the production env file:

```bash
cp server/.env.production.example server/.env
nano server/.env
```

Set these before deployment:

```bash
NODE_ENV=production
TRUST_PROXY=true
ALLOWED_ORIGINS=http://YOUR_AZURE_VM_PUBLIC_IP
JWT_SECRET=your-long-random-secret
JWT_REFRESH_SECRET=your-other-long-random-secret
OPENAI_API_KEY=your-private-openai-key
```

If you use a domain later, change `ALLOWED_ORIGINS`:

```bash
ALLOWED_ORIGINS=https://your-domain.com,http://YOUR_AZURE_VM_PUBLIC_IP
```

## 4. Deploy

From `/var/www/shopai`:

```bash
bash deploy/azure-vm/deploy.sh
```

If you want the script to also install the Nginx config, run it with sudo:

```bash
sudo APP_DIR=/var/www/shopai bash deploy/azure-vm/deploy.sh
```

The app should be available at:

```text
http://YOUR_AZURE_VM_PUBLIC_IP
```

## 5. Verify

Check backend health:

```bash
curl http://127.0.0.1:5000/api/health
curl http://YOUR_AZURE_VM_PUBLIC_IP/api/health
```

Check services:

```bash
systemctl status mongod
systemctl status redis-server
systemctl status nginx
pm2 status
```

View logs:

```bash
pm2 logs shopai-server
tail -f /var/log/nginx/error.log
tail -f /var/www/shopai/server/logs/pm2-error.log
```

## 6. Updating The App

After copying or pulling new code:

```bash
cd /var/www/shopai
bash deploy/azure-vm/deploy.sh
```

## 7. HTTPS

After pointing a domain to the Azure VM, install Certbot:

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

Then update `server/.env`:

```bash
ALLOWED_ORIGINS=https://your-domain.com
```

Reload the app:

```bash
pm2 restart shopai-server
```

## Troubleshooting

If the server starts locally but the browser cannot connect, check Azure Network Security Group inbound rules for port `80`.

If login or chat fails in production, confirm `ALLOWED_ORIGINS` exactly matches the browser URL, including `http` or `https`.

If product scraping fails, confirm Chromium dependencies are installed and that the target site is reachable from the VM.
