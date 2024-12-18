import { mongoDBService, Business } from '../services/mongodb';

const MOCK_BUSINESSES = [
  {
    name: 'Auto Servis Plus',
    category: 'Servisler',
    rating: 4.5,
    reviewCount: 128,
    address: 'Kadıköy, İstanbul',
    phone: '+90 555 123 4567',
    description: 'Profesyonel araç bakım ve onarım servisi. 20 yıllık tecrübe.',
    images: [
      'https://images.unsplash.com/photo-1486006920555-c77dcf18193c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=800&q=80',
    ],
    businessHours: [
      { day: 'Pazartesi', hours: '09:00 - 18:00', isOpen: true },
      { day: 'Salı', hours: '09:00 - 18:00', isOpen: true },
      { day: 'Çarşamba', hours: '09:00 - 18:00', isOpen: true },
      { day: 'Perşembe', hours: '09:00 - 18:00', isOpen: true },
      { day: 'Cuma', hours: '09:00 - 18:00', isOpen: true },
      { day: 'Cumartesi', hours: '10:00 - 15:00', isOpen: true },
      { day: 'Pazar', hours: 'Kapalı', isOpen: false },
    ],
    services: [
      { name: 'Yağ Değişimi', price: '₺400', description: 'Tam sentetik yağ ile değişim' },
      { name: 'Fren Bakımı', price: '₺300', description: 'Fren sistemi kontrolü ve bakımı' },
      { name: 'Genel Bakım', price: '₺800', description: 'Kapsamlı araç bakımı' },
    ],
    latitude: 40.983013,
    longitude: 29.028961,
  },
  {
    name: 'Usta Kaportacı',
    category: 'Kaportacılar',
    rating: 4.8,
    reviewCount: 95,
    address: 'Beşiktaş, İstanbul',
    phone: '+90 555 234 5678',
    description: 'Uzman kaporta ve boya işleri. Sigorta anlaşmalı servis.',
    images: [
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
    ],
    businessHours: [
      { day: 'Pazartesi', hours: '08:30 - 19:00', isOpen: true },
      { day: 'Salı', hours: '08:30 - 19:00', isOpen: true },
      { day: 'Çarşamba', hours: '08:30 - 19:00', isOpen: true },
      { day: 'Perşembe', hours: '08:30 - 19:00', isOpen: true },
      { day: 'Cuma', hours: '08:30 - 19:00', isOpen: true },
      { day: 'Cumartesi', hours: '09:00 - 17:00', isOpen: true },
      { day: 'Pazar', hours: 'Kapalı', isOpen: false },
    ],
    services: [
      { name: 'Kaporta Düzeltme', price: '₺1500', description: 'Hasarlı bölge onarımı' },
      { name: 'Boya', price: '₺2000', description: 'Parça boyama işlemi' },
      { name: 'Mini Onarım', price: '₺500', description: 'Küçük göçük ve çizik tamiri' },
    ],
    latitude: 41.042773,
    longitude: 29.006542,
  },
  {
    name: 'Lastik Dünyası',
    category: 'Lastikçiler',
    rating: 4.6,
    reviewCount: 156,
    address: 'Ümraniye, İstanbul',
    phone: '+90 555 345 6789',
    description: 'Her marka lastik satış ve servis. Balans, rot ayarı ve lastik depolama hizmetleri.',
    images: [
      'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&w=800&q=80',
    ],
    businessHours: [
      { day: 'Pazartesi', hours: '08:00 - 20:00', isOpen: true },
      { day: 'Salı', hours: '08:00 - 20:00', isOpen: true },
      { day: 'Çarşamba', hours: '08:00 - 20:00', isOpen: true },
      { day: 'Perşembe', hours: '08:00 - 20:00', isOpen: true },
      { day: 'Cuma', hours: '08:00 - 20:00', isOpen: true },
      { day: 'Cumartesi', hours: '09:00 - 18:00', isOpen: true },
      { day: 'Pazar', hours: '10:00 - 16:00', isOpen: true },
    ],
    services: [
      { name: 'Lastik Değişimi', price: '₺100', description: 'Lastik başına değişim ücreti' },
      { name: 'Balans Ayarı', price: '₺200', description: 'Rot balans ayarı' },
      { name: 'Lastik Depolama', price: '₺400', description: 'Sezonluk lastik depolama' },
    ],
    latitude: 41.016697,
    longitude: 29.121267,
  },
];

async function seedBusinesses() {
  try {
    // Connect to MongoDB
    await mongoDBService.connect();
    console.log('Connected to MongoDB');

    // Clear existing businesses
    await Business.deleteMany({});
    console.log('Cleared existing businesses');

    // Insert mock businesses
    const result = await Business.insertMany(MOCK_BUSINESSES);
    console.log(`Successfully inserted ${result.length} businesses`);

    // Disconnect from MongoDB
    await mongoDBService.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error seeding businesses:', error);
    process.exit(1);
  }
}

// Run the seeder
seedBusinesses(); 