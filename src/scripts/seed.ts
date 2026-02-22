import { db } from '../config/firebase';
import { UserRole } from '../models/user.model';

const categories = [
  { id: 'cat_riz', name: 'Riz', iconUrl: 'https://cdn-icons-png.flaticon.com/512/1047/1047640.png' },
  { id: 'cat_haricot', name: 'Haricots', iconUrl: 'https://cdn-icons-png.flaticon.com/512/1047/1047629.png' },
  { id: 'cat_boisson', name: 'Boissons', iconUrl: 'https://cdn-icons-png.flaticon.com/512/2405/2405479.png' },
  { id: 'cat_acc', name: 'Accompagnements', iconUrl: 'https://cdn-icons-png.flaticon.com/512/1047/1047633.png' },
];

const vendors = [
  {
    uid: 'vendeur_1',
    email: 'maman.ayimolou@test.com',
    displayName: 'Maman Ayimolou',
    phoneNumber: '+22890000001',
    role: 'vendeur' as UserRole,
    status: 'active' as const,
    photoURL: 'https://i.pravatar.cc/150?img=47',
    vendorProfile: {
      shopName: 'Le Palais de l\'Ayimolou',
      description: 'L\'Ayimolou le plus savoureux du quartier depuis 15 ans.',
      coordinates: { latitude: 6.137, longitude: 1.212 },
      isOpen: true,
      rating: 4.8,
      specialty: ['Riz', 'Haricots'],
      imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=2070&auto=format&fit=crop',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    uid: 'vendeur_2',
    email: 'chez.assou@test.com',
    displayName: 'Assou Ayimolou',
    phoneNumber: '+22890000002',
    role: 'vendeur' as UserRole,
    status: 'active' as const,
    photoURL: 'https://i.pravatar.cc/150?img=32',
    vendorProfile: {
      shopName: 'Spécialiste Haricots Assou',
      description: 'Découvrez notre mélange secret de haricots rouges.',
      coordinates: { latitude: 6.145, longitude: 1.234 },
      isOpen: true,
      rating: 4.5,
      specialty: ['Haricots'],
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=2080&auto=format&fit=crop',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const drivers = [
  {
    uid: 'driver_1',
    email: 'kodjo.livreur@test.com',
    displayName: 'Kodjo Livreur',
    phoneNumber: '+22891000001',
    role: 'livreur' as UserRole,
    status: 'active' as const,
    photoURL: 'https://i.pravatar.cc/150?img=11',
    driverProfile: {
      vehicleType: 'moto',
      isAvailable: true,
      currentLocation: { latitude: 6.138, longitude: 1.220 },
      rating: 4.9,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const clients = [
  {
    uid: 'client_1',
    email: 'test.user@test.com',
    displayName: 'Test User Client',
    role: 'client' as UserRole,
    status: 'active' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const products = [
  // Produits pour Maman Ayimolou
  { vendorId: 'vendeur_1', categoryId: 'cat_riz', name: 'Ayimolou Simple', description: 'Portion généreuse de riz mélangé aux haricots.', price: 300, isAvailable: true },
  { vendorId: 'vendeur_1', categoryId: 'cat_riz', name: 'Ayimolou + Oeuf', description: 'Notre Ayimolou classique avec un oeuf dur.', price: 500, isAvailable: true },
  { vendorId: 'vendeur_1', categoryId: 'cat_acc', name: 'Poisson Frit', description: 'Accompagnement poisson croustillant.', price: 400, isAvailable: true },
  { vendorId: 'vendeur_1', categoryId: 'cat_boisson', name: 'Bissap Frais', description: 'Jus de fleurs d\'hibiscus fait maison.', price: 200, isAvailable: true },
  
  // Produits pour Assou
  { vendorId: 'vendeur_2', categoryId: 'cat_haricot', name: 'Haricots Spécial', description: 'Haricots rouges fondants cuits à l\'étouffée.', price: 400, isAvailable: true },
  { vendorId: 'vendeur_2', categoryId: 'cat_acc', name: 'Gali', description: 'Semoule de manioc pour accompagner vos haricots.', price: 100, isAvailable: true },
  { vendorId: 'vendeur_2', categoryId: 'cat_boisson', name: 'Limonade Naturelle', description: 'Citronnade fraîche peu sucrée.', price: 300, isAvailable: true },
];

const seed = async () => {
  console.log('--- Starting Seed Process ---');

  // Seed Categories
  console.log('Seeding categories...');
  for (const cat of categories) {
    await db.collection('categories').doc(cat.id).set(cat);
  }

  // Seed Vendors
  console.log('Seeding vendors...');
  for (const vendor of vendors) {
    await db.collection('users').doc(vendor.uid).set(vendor);
  }

  // Seed Drivers
  console.log('Seeding drivers...');
  for (const driver of drivers) {
    await db.collection('users').doc(driver.uid).set(driver);
  }

  // Seed Clients
  console.log('Seeding clients...');
  for (const client of clients) {
    await db.collection('users').doc(client.uid).set(client);
  }

  // Seed Products
  console.log('Seeding products...');
  for (const prod of products) {
    // On laisse Firestore générer un ID auto pour les produits pour en avoir plusieurs
    await db.collection('products').add({ 
      ...prod, 
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  console.log('--- Seed Finished Successfully! ---');
  process.exit(0);
};

seed().catch((err) => {
  console.error('Error during seed:', err);
  process.exit(1);
});
