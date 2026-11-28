#!/bin/bash
# PICARBOO — установка сайта на любой VPS с Ubuntu 22.04/24.04 (FirstVDS, Timeweb, Aeza, Hetzner…).
# Запуск на сервере под root:
#   curl -fsSL https://raw.githubusercontent.com/maximb9k-star/picarboo-site/main/deploy/install.sh -o install.sh && bash install.sh
# Скрипт спросит пароль для админки (его видите только вы). Повторный запуск безопасен: .env и база сохраняются.
# Необязательно: DEPLOY_KEY='ssh-ed25519 AAAA…' bash install.sh — добавит ключ для удалённого обслуживания.
set -euo pipefail
REPO='https://github.com/maximb9k-star/picarboo-site.git'
DIR=/opt/picarboo

if [ "$(id -u)" -ne 0 ]; then echo 'Запустите от root: sudo bash install.sh'; exit 1; fi

# Пароль админки — только при первой установке
if [ ! -f "$DIR/.env" ]; then
  if [ -z "${ADMIN_PASSWORD:-}" ]; then
    while true; do
      read -rsp 'Придумайте пароль для админки (от 10 символов): ' ADMIN_PASSWORD < /dev/tty; echo
      read -rsp 'Повторите пароль: ' P2 < /dev/tty; echo
      if [ "${#ADMIN_PASSWORD}" -ge 10 ] && [ "$ADMIN_PASSWORD" = "$P2" ]; then break; fi
      echo 'Пароли не совпадают или короче 10 символов, попробуйте ещё раз.'
    done
  fi
fi

exec > >(tee -a /var/log/picarboo-install.log) 2>&1
set -x

# Ключ для обслуживания (если передан)
if [ -n "${DEPLOY_KEY:-}" ]; then
  mkdir -p /root/.ssh && chmod 700 /root/.ssh
  grep -qF "$DEPLOY_KEY" /root/.ssh/authorized_keys 2>/dev/null || echo "$DEPLOY_KEY" >> /root/.ssh/authorized_keys
  chmod 600 /root/.ssh/authorized_keys
fi

# Порты 80/443, если включён фаервол
if command -v ufw >/dev/null && ufw status | grep -q 'Status: active'; then ufw allow 80/tcp; ufw allow 443/tcp; fi
iptables -C INPUT -p tcp -m multiport --dports 80,443 -j ACCEPT 2>/dev/null || iptables -I INPUT -p tcp -m multiport --dports 80,443 -j ACCEPT || true

# Подкачка: сборка сайта требует ~2 ГБ памяти
if [ ! -f /swapfile ]; then
  fallocate -l 4G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# Docker, git, автообновления безопасности системы
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y git curl openssl unattended-upgrades fail2ban
command -v docker >/dev/null || curl -fsSL https://get.docker.com | sh
systemctl enable --now docker
systemctl enable --now fail2ban || true

# Код сайта
if [ -d "$DIR/.git" ]; then
  git -C "$DIR" fetch -q origin main && git -C "$DIR" reset -q --hard origin/main
else
  until git clone "$REPO" "$DIR"; do sleep 15; done
fi
cd "$DIR"

# Адрес по умолчанию: <IP через дефисы>.sslip.io (свой домен подключается в админке)
if [ ! -f .env ]; then
  IP=$(curl -fsS4 https://api.ipify.org || curl -fsS4 https://ifconfig.me)
  DOMAIN="$(echo "$IP" | tr . -).sslip.io"
  set +x
  umask 077
  cat > .env <<ENV
DOMAIN=$DOMAIN
POSTGRES_PASSWORD=$(openssl rand -hex 24)
ADMIN_PASSWORD=$ADMIN_PASSWORD
SESSION_SECRET=$(openssl rand -hex 32)
ENV
  set -x
fi

docker compose up -d --build

# Автообновление: раз в 10 минут проверяем GitHub и пересобираем, если есть изменения
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

# Ежедневная резервная копия базы (хранится 14 дней) в /opt/picarboo-backups
mkdir -p /opt/picarboo-backups
cat > /usr/local/bin/picarboo-backup <<'BAK'
#!/bin/bash
cd /opt/picarboo || exit 0
docker compose exec -T db pg_dump -U picarboo picarboo | gzip > /opt/picarboo-backups/picarboo-$(date +%F).sql.gz
find /opt/picarboo-backups -name '*.sql.gz' -mtime +14 -delete
BAK
chmod +x /usr/local/bin/picarboo-backup
echo '30 4 * * * root /usr/local/bin/picarboo-backup' > /etc/cron.d/picarboo-backup

set +x
echo
echo "================================================================"
echo " PICARBOO установлен: https://$(grep '^DOMAIN=' .env | cut -d= -f2)"
echo " Админка:             https://$(grep '^DOMAIN=' .env | cut -d= -f2)/admin"
echo " Каталог заполняется в фоне: первые машины — через 5–10 минут."
echo "================================================================"
