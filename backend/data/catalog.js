export const catalog = {
  // CARNES
  'Vacío': { unit: 'kg', perPerson: 0.3, category: 'Carnes', emoji: '🥩' },
  'Chorizo': { unit: 'unidades', perPerson: 1, category: 'Carnes', emoji: '🌭' },
  'Morcilla': { unit: 'unidades', perPerson: 0.5, category: 'Carnes', emoji: '🌭' },
  'Costillas': { unit: 'kg', perPerson: 0.25, category: 'Carnes', emoji: '🍖' },
  'Pollo': { unit: 'kg', perPerson: 0.3, category: 'Carnes', emoji: '🍗' },
  'Entraña': { unit: 'kg', perPerson: 0.25, category: 'Carnes', emoji: '🥩' },
  'Asado de tira': { unit: 'kg', perPerson: 0.3, category: 'Carnes', emoji: '🥩' },

  // BEBIDAS
  'Gaseosa': { unit: 'litros', perPerson: 0.5, category: 'Bebidas', emoji: '🥤' },
  'Cerveza': { unit: 'litros', perPerson: 0.75, category: 'Bebidas', emoji: '🍺' },
  'Vino': { unit: 'litros', perPerson: 0.25, category: 'Bebidas', emoji: '🍷' },
  'Agua': { unit: 'litros', perPerson: 0.5, category: 'Bebidas', emoji: '💧' },
  'Jugo': { unit: 'litros', perPerson: 0.3, category: 'Bebidas', emoji: '🍹' },
  'Fernet': { unit: 'litros', perPerson: 0.1, category: 'Bebidas', emoji: '🥃' },

  // SNACKS
  'Papas fritas': { unit: 'gr', perPerson: 75, category: 'Snacks', emoji: '🍟' },
  'Maníes': { unit: 'gr', perPerson: 50, category: 'Snacks', emoji: '🥜' },
  'Aceitunas': { unit: 'gr', perPerson: 30, category: 'Snacks', emoji: '🫒' },
  'Queso': { unit: 'gr', perPerson: 80, category: 'Snacks', emoji: '🧀' },
  'Fiambre': { unit: 'gr', perPerson: 80, category: 'Snacks', emoji: '🍖' },

  // ACOMPAÑAMIENTOS
  'Pan': { unit: 'unidades', perPerson: 2, category: 'Acompañamientos', emoji: '🍞' },
  'Ensalada mixta': { unit: 'gr', perPerson: 150, category: 'Acompañamientos', emoji: '🥗' },
  'Papas al horno': { unit: 'kg', perPerson: 0.2, category: 'Acompañamientos', emoji: '🥔' },
  'Chimichurri': { unit: 'gr', perPerson: 20, category: 'Acompañamientos', emoji: '🌿' },
  'Carbón': { unit: 'kg', perEvent: 3, perPerson: 0, category: 'Acompañamientos', emoji: '⚫' },
  'Sal': { unit: 'gr', perPerson: 10, category: 'Acompañamientos', emoji: '🧂' },

  // POSTRES
  'Torta': { unit: 'gr', perPerson: 120, category: 'Postres', emoji: '🎂' },
  'Helado': { unit: 'gr', perPerson: 150, category: 'Postres', emoji: '🍦' },
  'Budín de pan': { unit: 'gr', perPerson: 100, category: 'Postres', emoji: '🍮' },
  'Alfajores': { unit: 'unidades', perPerson: 1, category: 'Postres', emoji: '🍪' },
};

export const eventPresets = {
  asado: {
    label: 'Asado',
    emoji: '🔥',
    description: 'El clásico argentino',
    defaultSelections: {
      Carnes: ['Vacío', 'Chorizo', 'Morcilla'],
      Bebidas: ['Cerveza', 'Gaseosa', 'Agua'],
      Acompañamientos: ['Pan', 'Ensalada mixta', 'Chimichurri', 'Carbón'],
      Snacks: ['Maníes', 'Aceitunas'],
    },
  },
  cumpleanos: {
    label: 'Cumpleaños',
    emoji: '🎂',
    description: 'Para celebrar en grande',
    defaultSelections: {
      Snacks: ['Papas fritas', 'Maníes', 'Queso', 'Fiambre'],
      Bebidas: ['Gaseosa', 'Agua', 'Vino', 'Jugo'],
      Postres: ['Torta', 'Helado', 'Alfajores'],
      Acompañamientos: ['Pan'],
    },
  },
  reunion: {
    label: 'Reunión',
    emoji: '👥',
    description: 'Juntada casual',
    defaultSelections: {
      Snacks: ['Papas fritas', 'Maníes', 'Queso'],
      Bebidas: ['Cerveza', 'Gaseosa', 'Agua', 'Fernet'],
      Acompañamientos: ['Pan'],
    },
  },
  fiesta: {
    label: 'Fiesta',
    emoji: '🎉',
    description: 'A full toda la noche',
    defaultSelections: {
      Snacks: ['Papas fritas', 'Maníes', 'Aceitunas', 'Queso', 'Fiambre'],
      Bebidas: ['Cerveza', 'Gaseosa', 'Vino', 'Fernet', 'Agua'],
      Postres: ['Alfajores'],
      Acompañamientos: ['Pan'],
    },
  },
  infantil: {
    label: 'Infantil',
    emoji: '🎈',
    description: 'Diversión para los más chicos',
    defaultSelections: {
      Snacks: ['Papas fritas', 'Maníes'],
      Bebidas: ['Gaseosa', 'Jugo', 'Agua'],
      Postres: ['Torta', 'Helado', 'Alfajores'],
    },
  },
};

export const categoryIcons = {
  Carnes: '🥩',
  Bebidas: '🍺',
  Snacks: '🍟',
  Acompañamientos: '🍞',
  Postres: '🍰',
};
