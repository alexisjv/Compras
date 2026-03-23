import { v4 as uuidv4 } from 'uuid';
import { catalog } from './catalog';

const DB_KEY = 'eventify_db';

const getDB = () => {
  try {
    const s = localStorage.getItem(DB_KEY);
    return s ? JSON.parse(s) : { users: [], offers: [], savedLists: [] };
  } catch {
    return { users: [], offers: [], savedLists: [] };
  }
};
const setDB = (db) => localStorage.setItem(DB_KEY, JSON.stringify(db));

// Haversine distance in km
const haversine = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ─── AUTH ────────────────────────────────────────────────────────────────────

export const registerUser = (data) => {
  const db = getDB();
  if (db.users.find(u => u.email === data.email)) {
    throw new Error('El email ya está registrado');
  }
  const user = {
    id: uuidv4(),
    name: data.name,
    email: data.email,
    password: data.password,
    role: data.role,
    premium: false,
    ...(data.role === 'commerce' && {
      cuit: data.cuit,
      businessName: data.businessName,
      address: data.address,
      lat: parseFloat(data.lat),
      lng: parseFloat(data.lng),
    }),
    createdAt: new Date().toISOString(),
  };
  db.users.push(user);
  setDB(db);
  const { password: _, ...safe } = user;
  return { user: safe, token: user.id };
};

export const loginUser = (email, password) => {
  const db = getDB();
  const user = db.users.find(u => u.email === email && u.password === password);
  if (!user) throw new Error('Email o contraseña incorrectos');
  const { password: _, ...safe } = user;
  return { user: safe, token: user.id };
};

// ─── OFFERS ──────────────────────────────────────────────────────────────────

export const getActiveOffers = () => {
  const db = getDB();
  const now = new Date();
  return db.offers.filter(o => !o.expiresAt || new Date(o.expiresAt) > now);
};

export const getCommerceOffers = (userId) => {
  return getDB().offers.filter(o => o.userId === userId);
};

export const createOffer = (data) => {
  const db = getDB();
  const user = db.users.find(u => u.id === data.userId);
  if (!user || user.role !== 'commerce') throw new Error('Solo los comercios pueden publicar ofertas');
  if (!user.lat || !user.lng) throw new Error('El comercio no tiene ubicación configurada');

  const now = new Date();
  const activeCount = db.offers.filter(
    o => o.userId === data.userId && (!o.expiresAt || new Date(o.expiresAt) > now),
  ).length;
  if (!user.premium && activeCount >= 5) throw new Error('Límite del plan gratuito: 5 ofertas activas');

  const offer = {
    id: uuidv4(),
    userId: data.userId,
    productName: data.productName,
    price: parseFloat(data.price),
    description: data.description || '',
    brand: data.brand || '',
    expiresAt: data.expiresAt || null,
    lat: user.lat,
    lng: user.lng,
    commerceName: user.businessName,
    address: user.address,
    createdAt: new Date().toISOString(),
  };
  db.offers.push(offer);
  setDB(db);
  return offer;
};

export const deleteOffer = (id, userId) => {
  const db = getDB();
  const offer = db.offers.find(o => o.id === id);
  if (!offer) throw new Error('Oferta no encontrada');
  if (offer.userId !== userId) throw new Error('Sin permiso');
  db.offers = db.offers.filter(o => o.id !== id);
  setDB(db);
};

// ─── SHOPPING LIST ───────────────────────────────────────────────────────────

export const generateShoppingList = ({ selections, guests, userLat, userLng, radius }) => {
  // Build product list with quantities
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
      shoppingList.push({ name: productName, quantity: qty, unit: p.unit, category: p.category, emoji: p.emoji });
    }
  }

  // Get nearby active offers
  const now = new Date();
  const db = getDB();
  const nearbyOffers = db.offers
    .filter(o => !o.expiresAt || new Date(o.expiresAt) > now)
    .map(o => ({ ...o, distance: haversine(userLat, userLng, o.lat, o.lng) }))
    .filter(o => o.distance <= radius);

  const productNames = new Set(shoppingList.map(p => p.name.toLowerCase()));

  // List A: cheapest per product, tie-break by distance
  const listA = shoppingList.map(item => {
    const matches = nearbyOffers
      .filter(o => o.productName.toLowerCase() === item.name.toLowerCase())
      .sort((a, b) => a.price - b.price || a.distance - b.distance);
    return { ...item, offer: matches[0] || null };
  });

  // List B: greedy minimum stops (set cover)
  const storeMap = {};
  nearbyOffers.forEach(o => {
    if (!productNames.has(o.productName.toLowerCase())) return;
    if (!storeMap[o.userId]) {
      storeMap[o.userId] = { userId: o.userId, commerceName: o.commerceName, address: o.address, lat: o.lat, lng: o.lng, distance: o.distance, offers: {} };
    }
    const store = storeMap[o.userId];
    const key = o.productName.toLowerCase();
    if (!store.offers[key] || o.price < store.offers[key].price) store.offers[key] = o;
  });

  const stores = Object.values(storeMap).sort((a, b) => {
    const ac = Object.keys(a.offers).length, bc = Object.keys(b.offers).length;
    return bc - ac || a.distance - b.distance;
  });

  const covered = new Set();
  const listB = [];
  for (const store of stores) {
    const newOffers = Object.values(store.offers).filter(o => !covered.has(o.productName.toLowerCase()));
    if (newOffers.length > 0) {
      newOffers.forEach(o => covered.add(o.productName.toLowerCase()));
      const stopTotal = newOffers.reduce((sum, o) => {
        const item = shoppingList.find(p => p.name.toLowerCase() === o.productName.toLowerCase());
        return sum + (item ? o.price * item.quantity : 0);
      }, 0);
      listB.push({ ...store, offers: newOffers, stopTotal });
    }
  }

  const uncoveredProducts = shoppingList.filter(p => !covered.has(p.name.toLowerCase()));
  const totalA = listA.reduce((sum, i) => i.offer ? sum + i.offer.price * i.quantity : sum, 0);
  const totalB = listB.reduce((sum, s) => sum + s.stopTotal, 0);

  return { shoppingList, listA, listB, uncoveredProducts, totalA, totalB };
};

// ─── SAVED LISTS ─────────────────────────────────────────────────────────────

export const saveList = ({ userId, title, list }) => {
  const db = getDB();
  const saved = { id: uuidv4(), userId, title, list, createdAt: new Date().toISOString() };
  db.savedLists.push(saved);
  setDB(db);
  return saved;
};

export const getSavedLists = (userId) => {
  return getDB().savedLists.filter(l => l.userId === userId);
};
