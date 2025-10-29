#!/bin/bash

set -e  # Exit on error

echo "🚀 4Word Production Deployment Script"
echo "======================================"
echo ""

# Get domain name
read -p "Enter your domain name (or press Enter for IP-only setup): " DOMAIN
if [ -z "$DOMAIN" ]; then
    DOMAIN=$(hostname -I | awk '{print $1}')
    echo "Using IP address: $DOMAIN"
fi

# ============================================
# Step 1: Create production package
# ============================================
echo ""
echo "📦 Step 1: Creating production package..."

# Create production directory
rm -rf production-ready
mkdir -p production-ready

# Copy source files
cp -r src/* production-ready/

echo "✅ Production files copied"

# ============================================
# Step 2: Create Nginx configuration
# ============================================
echo ""
echo "🔧 Step 2: Creating Nginx configuration..."

cat > nginx-4word.conf << NGINXCONF
server {
    listen 80;
    server_name $DOMAIN;
    
    root /var/www/4word;
    index index.html;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    location / {
        try_files \$uri \$uri/ =404;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Logging
    access_log /var/log/nginx/4word-access.log;
    error_log /var/log/nginx/4word-error.log;
}
NGINXCONF

echo "✅ Nginx config created: nginx-4word.conf"

# ============================================
# Step 3: Deploy files
# ============================================
echo ""
echo "📁 Step 3: Deploying files..."

# Create web directory
sudo mkdir -p /var/www/4word

# Copy files
sudo cp -r production-ready/* /var/www/4word/

# Set permissions
sudo chown -R www-data:www-data /var/www/4word
sudo chmod -R 755 /var/www/4word

echo "✅ Files deployed to /var/www/4word"

# ============================================
# Step 4: Configure Nginx
# ============================================
echo ""
echo "⚙️  Step 4: Configuring Nginx..."

# Copy nginx config
sudo cp nginx-4word.conf /etc/nginx/sites-available/4word

# Enable site
sudo ln -sf /etc/nginx/sites-available/4word /etc/nginx/sites-enabled/4word

# Remove default site if exists
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx config
echo ""
echo "Testing Nginx configuration..."
if sudo nginx -t; then
    echo "✅ Nginx config is valid"
else
    echo "❌ Nginx config has errors!"
    exit 1
fi

# Reload nginx
sudo systemctl reload nginx || sudo systemctl restart nginx

echo "✅ Nginx configured and reloaded"

# ============================================
# Step 5: Configure firewall
# ============================================
echo ""
echo "🔥 Step 5: Configuring firewall..."

if command -v ufw &> /dev/null; then
    sudo ufw allow 'Nginx Full'
    sudo ufw allow OpenSSH
    echo "✅ Firewall configured"
else
    echo "⚠️  UFW not installed, skipping firewall setup"
fi

# ============================================
# Step 6: Summary
# ============================================
echo ""
echo "═══════════════════════════════════════"
echo "✅ DEPLOYMENT COMPLETE!"
echo "═══════════════════════════════════════"
echo ""
echo "🌐 Your 4Word app is now live at:"
echo "   http://$DOMAIN/quick-test.html"
echo ""
echo "📊 Test the deployment:"
echo "   curl -I http://$DOMAIN/quick-test.html"
echo ""
echo "⚠️  IMPORTANT: This is HTTP only (not secure)"
echo ""
echo "Next steps:"
echo "  1. Test: http://$DOMAIN/quick-test.html"
echo "  2. Set up HTTPS (recommended):"
echo "     Run: sudo ./setup-https.sh"
echo ""

# Create HTTPS setup script
cat > setup-https.sh << 'HTTPSSCRIPT'
#!/bin/bash

echo "🔒 Setting up HTTPS with Let's Encrypt..."

# Check if domain is set
if [ -z "$1" ]; then
    echo "Usage: sudo ./setup-https.sh yourdomain.com"
    exit 1
fi

DOMAIN=$1

# Install certbot
echo "Installing Certbot..."
sudo apt update
sudo apt install certbot python3-certbot-nginx -y

# Get certificate
echo ""
echo "Obtaining SSL certificate..."
sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN

# Test renewal
echo ""
echo "Testing auto-renewal..."
sudo certbot renew --dry-run

echo ""
echo "✅ HTTPS setup complete!"
echo "Your site is now available at: https://$DOMAIN"
echo ""
echo "Certificate will auto-renew. Check with:"
echo "  sudo certbot renew --dry-run"
HTTPSSCRIPT

chmod +x setup-https.sh

echo "📝 Created setup-https.sh for later HTTPS setup"
echo ""
