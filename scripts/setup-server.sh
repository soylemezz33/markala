#!/bin/bash
# Markala — Hetzner VPS bootstrap script
# Ubuntu 24.04 LTS (önerilen) için.
# Kullanım:
#   curl -fsSL https://raw.githubusercontent.com/soylemezz33/markala/main/scripts/setup-server.sh | sudo bash
# Veya:
#   ssh root@VPS_IP
#   wget https://raw.githubusercontent.com/.../setup-server.sh
#   chmod +x setup-server.sh && sudo ./setup-server.sh

set -euo pipefail

if [[ $EUID -ne 0 ]]; then
   echo "❌ Bu script root olarak çalıştırılmalı (sudo)"
   exit 1
fi

DEPLOY_USER="markala"
DEPLOY_DIR="/opt/markala"

echo "═════════════════════════════════════════════"
echo "  Markala VPS Setup — Ubuntu 24.04"
echo "═════════════════════════════════════════════"

# 1. System update
echo "→ Sistem güncelleniyor..."
apt update -qq && apt upgrade -y -qq

# 2. Temel araçlar
echo "→ Temel araçlar kuruluyor..."
apt install -y -qq \
    ca-certificates curl gnupg lsb-release \
    git ufw fail2ban htop vim wget \
    unattended-upgrades

# 3. Türkçe locale + zaman dilimi
echo "→ Locale ve zaman dilimi ayarlanıyor..."
timedatectl set-timezone Europe/Istanbul
locale-gen tr_TR.UTF-8

# 4. Docker + Docker Compose
if ! command -v docker &>/dev/null; then
    echo "→ Docker kuruluyor..."
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
      > /etc/apt/sources.list.d/docker.list
    apt update -qq
    apt install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    systemctl enable --now docker
fi

# 5. Deploy user
if ! id -u $DEPLOY_USER &>/dev/null; then
    echo "→ Deploy user ($DEPLOY_USER) oluşturuluyor..."
    useradd -m -s /bin/bash $DEPLOY_USER
    usermod -aG docker $DEPLOY_USER
fi

# 6. Deploy klasörü
echo "→ Deploy klasörü hazırlanıyor: $DEPLOY_DIR"
mkdir -p $DEPLOY_DIR/{nginx/ssl,nginx/conf.d,backups,scripts}
chown -R $DEPLOY_USER:$DEPLOY_USER $DEPLOY_DIR

# 7. Firewall (UFW)
echo "→ Firewall ayarlanıyor..."
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# 8. Fail2ban (SSH brute force koruma)
echo "→ Fail2ban ayarlanıyor..."
cat > /etc/fail2ban/jail.local <<EOF
[sshd]
enabled = true
port = ssh
maxretry = 3
bantime = 3600
findtime = 600
EOF
systemctl enable --now fail2ban
systemctl restart fail2ban

# 9. SSH hardening
echo "→ SSH güvenlik ayarları..."
sed -i 's/^#*PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/^#*PubkeyAuthentication.*/PubkeyAuthentication yes/' /etc/ssh/sshd_config
echo "ClientAliveInterval 300" >> /etc/ssh/sshd_config
echo "ClientAliveCountMax 2" >> /etc/ssh/sshd_config

# 10. Otomatik güvenlik güncellemeleri
echo "→ Otomatik güvenlik güncellemeleri aktive ediliyor..."
dpkg-reconfigure --priority=low unattended-upgrades

# 11. Swap (8GB sistemler için 4GB swap)
if [ ! -f /swapfile ] && [ $(free -m | awk '/^Mem:/{print $2}') -lt 16384 ]; then
    echo "→ 4GB swap oluşturuluyor..."
    fallocate -l 4G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile >/dev/null
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    sysctl vm.swappiness=10 >/dev/null
    echo 'vm.swappiness=10' >> /etc/sysctl.conf
fi

# 12. Docker log rotation
cat > /etc/docker/daemon.json <<EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF
systemctl restart docker

echo ""
echo "═════════════════════════════════════════════"
echo "  ✅ Server hazır!"
echo "═════════════════════════════════════════════"
echo ""
echo "Sıradaki adımlar:"
echo "  1. Deploy user için SSH key ekle:"
echo "     mkdir -p /home/$DEPLOY_USER/.ssh && chmod 700 /home/$DEPLOY_USER/.ssh"
echo "     # Public key'i /home/$DEPLOY_USER/.ssh/authorized_keys'e koy"
echo "     chown -R $DEPLOY_USER:$DEPLOY_USER /home/$DEPLOY_USER/.ssh"
echo ""
echo "  2. SSH'ı yeniden başlat: systemctl restart ssh"
echo ""
echo "  3. Cloudflare Origin Certificate'ı $DEPLOY_DIR/nginx/ssl/'a koy:"
echo "     - markala.com.tr.pem"
echo "     - markala.com.tr.key"
echo ""
echo "  4. .env.production dosyasını $DEPLOY_DIR/'a koy"
echo ""
echo "  5. Deploy'u başlat:"
echo "     su - $DEPLOY_USER"
echo "     cd $DEPLOY_DIR"
echo "     git clone https://github.com/soylemezz33/markala.git ."
echo "     docker compose -f docker-compose.production.yml up -d"
echo ""
