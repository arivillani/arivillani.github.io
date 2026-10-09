export const scania = {
  id: 'scania-metalsur-2014',
  type: 'bus',
  brand: 'Scania',
  body: 'Metalsur',
  year: 2014,
  seats: 43,
  seatType: 'Cama suite',
  fuel: 'Diésel',
  features: ['Cama suite', 'Gomas 70%', 'Excelente estado', 'Listo para trabajar'],
  price: { currency: 'USD', amount: 90000 },
  financing: true,
  tradeIn: true,
  status: 'disponible',
  featured: true,
  demo: false,
  images: ['img/units/scania-metalsur-2014/01-exterior.webp'],
};

export const unit = (overrides = {}) => ({ ...scania, ...overrides });
