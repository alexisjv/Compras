import express from 'express';
import cors from 'cors';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { catalog, eventPresets, categoryIcons } from './data/catalog.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, 'data');
const DB_PATH = join(DATA_DIR, 'db.json');

const initDB = () => ({ users: [], offers: [], savedLists: [] });

const readDB = () => {
  if (!existsSync(DB_PATH)) {
    const db = initDB();
    writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
    return db;
  }
  return JSON.parse(readFileSync(DB_PATH, 'utf-8'));
};

const writeDB = (db) => writeFileSync(DB_PATH, JSON.stringify(db, null, 2));

// Haversine distance in km
const haversine = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const app = express();
app.use(cors());
app.use(express.json());

// ─── AUTH ────────────────────────────────────────────────────────────────────

app.post('/api/auth/register', (req, res) => {
  const { name, email, password, role, cuit, businessName, address, lat, lng } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }
  const db = readDB();
  if (db.users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'El email ya está registrado' });
  }
  const user = {
    id: uuidv4(),
    name,
    email,
    password,
    role,
    premium: false,
    ...(role === 'commerce' && { cuit, businessName, address, lat: parseFloat(lat), lng: parseFloat(lng) }),
    createdAt: new Date().toISOString(),
  };
  db.users.push(user);
  writeDB(db);
  const { password: _, ...safe } = user;
  res.json({ user: safe, token: user.id });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const db = readDB();
  const user = db.users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ error: 'Email o contraseña incorrectos' });
  const { password: _, ...safe } = user;
  res.json({ user: safe, token: user.id });
});

// ─── CATALOG ─────────────────────────────────────────────────────────────────

app.get('/api/catalog', (_req, res) => {
  res.json({ catalog, eventPresets, categoryIcons });
});

// ─── OFFERS ──────────────────────────────────────────────────────────────────

app.get('/api/offers', (req, res) => {
  const db = readDB();
  const now = new Date();
  const active = db.offers.filter(o => !o.expiresAt || new Date(o.expiresAt) > now);
  res.json(active);
});

app.get('/api/offers/commerce/:userId', (req, res) => {
  const db = readDB();
  res.json(db.offers.filter(o => o.userId === req.params.userId));
});

app.post('/api/offers', (req, res) => {
  const { userId, productName, price, description, brand, expiresAt } = req.body;
  const db = readDB();

  const user = db.users.find(u => u.id === userId);
  if (!user || user.role !== 'commerce') {
    return res.status(403).json({ error: 'Solo los comercios pueden publicar ofertas' });
  }
  if (!user.lat || !user.lng) {
    return res.status(400).json({ error: 'El comercio no tiene ubicación configurada' });
  }

  const now = new Date();
  const activeOffers = db.offers.filter(
    o => o.userId === userId && (!o.expiresAt || new Date(o.expiresAt) > now),
  );
  if (!user.premium && activeOffers.length >= 5) {
    return res.status(403).json({ error: 'Límite del plan gratuito: 5 ofertas activas' });
  }

  const offer = {
    id: uuidv4(),
    userId,
    productName,
    price: parseFloat(price),
    description: description || '',
    brand: brand || '',
    expiresAt: expiresAt || null,
    lat: user.lat,
    lng: user.lng,
    commerceName: user.businessName,
    address: user.address,
    createdAt: new Date().toISOString(),
  };
  db.offers.push(offer);
  writeDB(db);
  res.json(offer);
});

app.delete('/api/offers/:id', (req, res) => {
  const { userId } = req.body;
  const db = readDB();
  const offer = db.offers.find(o => o.id === req.params.id);
  if (!offer) return res.status(404).json({ error: 'Oferta no encontrada' });
  if (offer.userId !== userId) return res.status(403).json({ error: 'Sin permiso' });
  db.offers = db.offers.filter(o => o.id !== req.params.id);
  writeDB(db);
  res.json({ success: true });
});

// ─── SHOPPING LIST GENERATOR ─────────────────────────────────────────────────

app.post('/api/shopping-list/generate', (req, res) => {
  const { selections, guests, userLat, userLng, radius } = req.body;
  if (!selections || !guests || userLat == null || userLng == null || !radius) {
    return res.status(400).json({ error: 'Parámetros incompletos' });
  }

  // Build shopping list
  const shoppingList = [];
  for (const [, products] of Object.entries(selections)) {
    for (const productName of products) {
      const p = catalog[productName];
      if (!p) continue;

      let qty;
      if (p.perEvent) {
        qty = p.perEvent;
      } else {
        qty = p.perPerson * guests;
        if (p.unit === 'kg') qty = Math.ceil(qty * 10) / 10;
        else if (p.unit === 'litros') qty = Math.ceil(qty * 2) / 2;
        else if (p.unit === 'gr') qty = Math.ceil(qty / 50) * 50;
        else qty = Math.ceil(qty);
      }

      shoppingList.push({
        name: productName,
        quantity: qty,
        unit: p.unit,
        category: p.category,
        emoji: p.emoji,
      });
    }
  }

  // Fetch active offers near location
  const db = readDB();
  const now = new Date();
  const nearbyOffers = db.offers
    .filter(o => !o.expiresAt || new Date(o.expiresAt) > now)
    .map(o => ({ ...o, distance: haversine(userLat, userLng, o.lat, o.lng) }))
    .filter(o => o.distance <= radius);

  const productNames = new Set(shoppingList.map(p => p.name.toLowerCase()));

  // List A: cheapest offer per product (tie-break: nearest)
  const listA = shoppingList.map(item => {
    const matches = nearbyOffers
      .filter(o => o.productName.toLowerCase() === item.name.toLowerCase())
      .sort((a, b) => a.price - b.price || a.distance - b.distance);
    return { ...item, offer: matches[0] || null };
  });

  // List B: minimum stops (greedy set cover by distance priority)
  const storeMap = {};
  nearbyOffers.forEach(o => {
    if (!productNames.has(o.productName.toLowerCase())) return;
    if (!storeMap[o.userId]) {
      storeMap[o.userId] = {
        userId: o.userId,
        commerceName: o.commerceName,
        address: o.address,
        lat: o.lat,
        lng: o.lng,
        distance: o.distance,
        offers: {},
      };
    }
    const store = storeMap[o.userId];
    const key = o.productName.toLowerCase();
    if (!store.offers[key] || o.price < store.offers[key].price) {
      store.offers[key] = o;
    }
  });

  const stores = Object.values(storeMap).sort((a, b) => {
    const aCount = Object.keys(a.offers).length;
    const bCount = Object.keys(b.offers).length;
    return bCount - aCount || a.distance - b.distance;
  });

  const covered = new Set();
  const listB = [];
  for (const store of stores) {
    const newOffers = Object.values(store.offers).filter(
      o => !covered.has(o.productName.toLowerCase()),
    );
    if (newOffers.length > 0) {
      newOffers.forEach(o => covered.add(o.productName.toLowerCase()));
      const total = newOffers.reduce((sum, o) => {
        const item = shoppingList.find(p => p.name.toLowerCase() === o.productName.toLowerCase());
        return sum + (item ? o.price * item.quantity : 0);
      }, 0);
      listB.push({ ...store, offers: newOffers, stopTotal: total });
    }
  }

  const uncovered = shoppingList.filter(p => !covered.has(p.name.toLowerCase()));

  // Totals
  const totalA = listA.reduce((sum, item) => {
    if (!item.offer) return sum;
    return sum + item.offer.price * item.quantity;
  }, 0);
  const totalB = listB.reduce((sum, stop) => sum + stop.stopTotal, 0);

  res.json({ shoppingList, listA, listB, uncoveredProducts: uncovered, totalA, totalB });
});

// ─── SAVED LISTS ─────────────────────────────────────────────────────────────

app.post('/api/saved-lists', (req, res) => {
  const { userId, title, list } = req.body;
  const db = readDB();
  const saved = { id: uuidv4(), userId, title, list, createdAt: new Date().toISOString() };
  db.savedLists.push(saved);
  writeDB(db);
  res.json(saved);
});

app.get('/api/saved-lists/:userId', (req, res) => {
  const db = readDB();
  res.json(db.savedLists.filter(l => l.userId === req.params.userId));
});

// ─── START ───────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅ Eventify API running on http://localhost:${PORT}`));
