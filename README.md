# Bazar Admin Panel

Vue 3 + Vuetify 3 + Pinia asosidagi admin panel.

## O'rnatish

```bash
npm install
```

## Ishga tushirish

```bash
# .env fayl yarating
cp .env.example .env
# VITE_API_URL ni o'zingizning backend manziliga o'zgartiring

npm run dev
```

## Build

```bash
npm run build
```

## Sahifalar

| Yo'l | Sahifa |
|---|---|
| `/dashboard` | Bosh sahifa — statistika, oxirgi buyurtmalar |
| `/orders` | Buyurtmalar ro'yxati + filtrlash |
| `/orders/:id` | Buyurtma tafsilotlari, holat o'zgartirish, kuryer tayinlash |
| `/products` | Mahsulotlar CRUD |
| `/categories` | Kategoriyalar CRUD |
| `/customers` | Mijozlar ro'yxati |
| `/customers/:id` | Mijoz profili + buyurtmalar tarixi |
| `/users` | Admin/kuryer foydalanuvchilar CRUD |
| `/discounts` | Chegirmalar CRUD |
| `/coupons` | Kuponlar CRUD |
| `/delivery-zones` | Yetkazib berish zonalari CRUD |
| `/settings` | Tizim sozlamalari |

## API sozlash

`src/api/index.js` faylida barcha API endpointlar mavjud.  
Backend URL ni `.env` faylidagi `VITE_API_URL` o'zgaruvchisi orqali belgilang.

Agar backend boshqa portda bo'lsa, `vite.config.js` dagi proxy sozlamasini o'zgartiring:
```js
proxy: {
  '/admin-api': {
    target: 'http://localhost:8000',
    changeOrigin: true,
  },
}
```
