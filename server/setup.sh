#!/bin/bash

# اسکریپت راه‌اندازی سرور تله‌پرامپتر
# این اسکریپت به صورت خودکار وابستگی‌ها را نصب می‌کند و سرور را در حالت مناسب اجرا می‌کند

# رنگ‌ها برای خروجی زیباتر
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== راه‌اندازی سرور تله‌پرامپتر ===${NC}"
echo -e "${YELLOW}نصب وابستگی‌ها و راه‌اندازی سرور...${NC}"

# بررسی وجود Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}خطا: Node.js نصب نشده است.${NC}"
    echo "لطفاً ابتدا Node.js نسخه 16 یا بالاتر را نصب کنید."
    exit 1
fi

# بررسی نسخه Node.js
NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo -e "${RED}خطا: نسخه Node.js باید 16 یا بالاتر باشد.${NC}"
    echo "نسخه فعلی: $(node -v)"
    exit 1
fi

# تشخیص محیط اجرا
ENV="development"
if [ "$1" == "prod" ] || [ "$1" == "production" ]; then
    ENV="production"
fi

# نصب وابستگی‌ها
echo -e "${YELLOW}در حال نصب وابستگی‌های سرور...${NC}"
npm install

# تشخیص آدرس IP محلی
IP_ADDRESS=$(hostname -I | awk '{print $1}')
if [ -z "$IP_ADDRESS" ]; then
    IP_ADDRESS="127.0.0.1"
fi

echo -e "${GREEN}نصب وابستگی‌ها با موفقیت انجام شد.${NC}"
echo -e "${YELLOW}در حال راه‌اندازی سرور در محیط ${ENV}...${NC}"

if [ "$ENV" == "production" ]; then
    echo -e "${BLUE}اجرای سرور در حالت تولید (production)${NC}"
    echo -e "${YELLOW}برای توقف سرور، کلید‌های Ctrl+C را فشار دهید${NC}"
    echo -e "${GREEN}آدرس سرور: http://${IP_ADDRESS}:4444${NC}"
    NODE_ENV=production npm start
else
    echo -e "${BLUE}اجرای سرور در حالت توسعه (development)${NC}"
    echo -e "${YELLOW}برای توقف سرور، کلید‌های Ctrl+C را فشار دهید${NC}"
    echo -e "${GREEN}آدرس سرور: http://${IP_ADDRESS}:4444${NC}"
    npm run dev
fi 