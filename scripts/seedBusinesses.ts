import { mongoDBService, Business, Review } from '../services/mongodb';
import { COLLECTIONS } from '../backend/src/config/mongodb';
import { ObjectId } from 'mongodb';

const MOCK_USERS = [
  {
    _id: new ObjectId(),
    email: 'user1@example.com',
    fullName: 'John Doe',
    avatar: 'https://ui-avatars.com/api/?name=John+Doe',
  },
  {
    _id: new ObjectId(),
    email: 'user2@example.com',
    fullName: 'Jane Smith',
    avatar: 'https://ui-avatars.com/api/?name=Jane+Smith',
  },
  {
    _id: new ObjectId(),
    email: 'user3@example.com',
    fullName: 'Ali Yılmaz',
    avatar: 'https://ui-avatars.com/api/?name=Ali+Yilmaz',
  },
  {
    _id: new ObjectId(),
    email: 'user4@example.com',
    fullName: 'Ayşe Demir',
    avatar: 'https://ui-avatars.com/api/?name=Ayse+Demir',
  },
];

const createMockReviews = (businessId: string): Array<Omit<Review, '_id'>> => [
  {
    businessId,
    userId: MOCK_USERS[0]._id.toString(),
    rating: 5,
    comment: 'Harika bir servis! Çok profesyonel ve hızlı çalışıyorlar.',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    userName: MOCK_USERS[0].fullName,
    userAvatar: MOCK_USERS[0].avatar,
    likes: 3,
    isVerified: true,
  },
  {
    businessId,
    userId: MOCK_USERS[1]._id.toString(),
    rating: 4,
    comment: 'İyi bir deneyimdi. Fiyatlar biraz yüksek ama kaliteli iş yapıyorlar.',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
    userName: MOCK_USERS[1].fullName,
    userAvatar: MOCK_USERS[1].avatar,
    likes: 1,
    isVerified: true,
  },
  {
    businessId,
    userId: MOCK_USERS[2]._id.toString(),
    rating: 5,
    comment: 'Çok memnun kaldım. Özellikle ustalar çok ilgili ve işlerinde profesyoneller.',
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-02-10'),
    userName: MOCK_USERS[2].fullName,
    userAvatar: MOCK_USERS[2].avatar,
    likes: 2,
    isVerified: true,
  },
  {
    businessId,
    userId: MOCK_USERS[3]._id.toString(),
    rating: 3,
    comment: 'Ortalama bir hizmet. Biraz daha özenli olabilirlerdi.',
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-02-15'),
    userName: MOCK_USERS[3].fullName,
    userAvatar: MOCK_USERS[3].avatar,
    likes: 0,
    isVerified: true,
  },
];

const MOCK_BUSINESSES: Array<Omit<Business, '_id' | 'reviews'>> = [
  {
    ownerId: new ObjectId().toString(),
    name: 'Auto Servis Plus',
    category: 'Servisler',
    rating: 4.5,
    reviewCount: 4,
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
      { id: '1', name: 'Yağ Değişimi', price: '₺400', description: 'Tam sentetik yağ ile değişim' },
      { id: '2', name: 'Fren Bakımı', price: '₺300', description: 'Fren sistemi kontrolü ve bakımı' },
      { id: '3', name: 'Genel Bakım', price: '₺800', description: 'Kapsamlı araç bakımı' },
    ],
    latitude: 40.983013,
    longitude: 29.028961,
    createdAt: new Date(),
    updatedAt: new Date(),
    isVerified: true,
    averageRating: 4.5,
  },
  {
    ownerId: new ObjectId().toString(),
    name: 'Usta Kaportacı',
    category: 'Kaportacılar',
    rating: 4.8,
    reviewCount: 4,
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
      { id: '1', name: 'Kaporta Düzeltme', price: '₺1500', description: 'Hasarlı bölge onarımı' },
      { id: '2', name: 'Boya', price: '₺2000', description: 'Parça boyama işlemi' },
      { id: '3', name: 'Mini Onarım', price: '₺500', description: 'Küçük göçük ve çizik tamiri' },
    ],
    latitude: 41.042773,
    longitude: 29.006542,
    createdAt: new Date(),
    updatedAt: new Date(),
    isVerified: true,
    averageRating: 4.8,
  },
  {
    ownerId: new ObjectId().toString(),
    name: 'Lastik Dünyası',
    category: 'Lastikçiler',
    rating: 4.6,
    reviewCount: 4,
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
      { id: '1', name: 'Lastik Değişimi', price: '₺100', description: 'Lastik başına değişim ücreti' },
      { id: '2', name: 'Balans Ayarı', price: '₺200', description: 'Rot balans ayarı' },
      { id: '3', name: 'Lastik Depolama', price: '₺400', description: 'Sezonluk lastik depolama' },
    ],
    latitude: 41.016697,
    longitude: 29.121267,
    createdAt: new Date(),
    updatedAt: new Date(),
    isVerified: true,
    averageRating: 4.6,
  },
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoDBService.connect();
    const db = mongoDBService.getDb();
    if (!db) throw new Error('Database connection failed');

    console.log('Connected to MongoDB');

    // Clear existing collections
    await db.collection(COLLECTIONS.BUSINESSES).deleteMany({});
    await db.collection(COLLECTIONS.REVIEWS).deleteMany({});
    console.log('Cleared existing data');

    // Insert businesses
    const businessResult = await db.collection(COLLECTIONS.BUSINESSES).insertMany(MOCK_BUSINESSES);
    console.log(`Inserted ${Object.keys(businessResult.insertedIds).length} businesses`);

    // Insert reviews for each business
    let totalReviews = 0;
    for (const [index, id] of Object.values(businessResult.insertedIds).entries()) {
      const businessId = id.toString();
      const reviews = createMockReviews(businessId);
      await db.collection(COLLECTIONS.REVIEWS).insertMany(reviews);
      totalReviews += reviews.length;
      console.log(`Inserted ${reviews.length} reviews for business ${index + 1}`);
    }

    console.log(`Inserted total of ${totalReviews} reviews`);

    // Disconnect from MongoDB
    await mongoDBService.disconnect();
    console.log('Database seeding completed successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seeder
seedDatabase(); 