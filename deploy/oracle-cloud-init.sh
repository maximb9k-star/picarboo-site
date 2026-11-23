#!/bin/bash
# PICARBOO — автоматическая установка сайта на Oracle Cloud (Ubuntu 22/24, ARM или x86).
# Вставьте этот скрипт целиком при создании сервера: Show advanced options → Management →
# Initialization script → Paste cloud-init script. Перед вставкой замените пароль админки ниже.
ADMIN_PASSWORD='ЗАМЕНИТЕ_НА_СВОЙ_ПАРОЛЬ'
REPO='https://github.com/maximb9k-star/picarboo-site.git'

set -eux
exec > >(tee -a /var/log/picarboo-install.log) 2>&1

# Порты 80/443 в фаерволе Ubuntu (в образах Oracle по умолчанию закрыты)
iptables -I INPUT 6 -p tcp -m multiport --dports 80,443 -m state --state NEW -j ACCEPT || true
netfilter-persistent save || true

# Подкачка на случай маленького сервера (сборка сайта требует ~2 ГБ памяти)
if [ ! -f /swapfile ]; then
  fallocate -l 4G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# Docker и git
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y git curl openssl
curl -fsSL https://get.docker.com | sh

# Код сайта
until git clone "$REPO" /opt/picarboo; do sleep 30; done
cd /opt/picarboo

# Адрес по умолчанию: <IP>.sslip.io — бесплатный адрес, указывающий на IP сервера (свой домен — из админки)
IP=$(curl -fsS https://api.ipify.org || curl -fsS https://ifconfig.me)
DOMAIN="$(echo "$IP" | tr . -).sslip.io"
if [ ! -f .env ]; then
  cat > .env <<ENV
DOMAIN=$DOMAIN
POSTGRES_PASSWORD=$(openssl rand -hex 24)
ADMIN_PASSWORD=$ADMIN_PASSWORD
SESSION_SECRET=$(openssl rand -hex 32)
ENV
  chmod 600 .env
fi

docker compose up -d --build

# Автообновление: раз в 10 минут проверяем GitHub и пересобираем, если есть новые изменения
cat > /usr/local/bin/picarboo-update <<'UPD'
#!/bin/bash
cd /opt/picarboo || exit 0
git fetch -q origin main || exit 0
if [ "$(git rev-parse HEAD)" != "$(git rev-parse origin/main)" ]; then
  git reset -q --hard origin/main
  docker compose up -d --build --remove-orphans
  docker image prune -f
fi
UPD
chmod +x /usr/local/bin/picarboo-update
echo '*/10 * * * * root /usr/local/bin/picarboo-update >> /var/log/picarboo-update.log 2>&1' > /etc/cron.d/picarboo

echo "PICARBOO установлен: https://$DOMAIN"
