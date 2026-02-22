export type UserRole = 'client' | 'vendeur' | 'livreur' | 'admin';

export interface User {
  uid: string;
  email: string;
  phoneNumber: string;
  displayName: string;
  photoURL?: string | undefined; // Cloudinary URL
  role: UserRole;
  status: 'active' | 'suspended';
  vendorProfile?: {
    shopName: string;
    description: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    isOpen: boolean;
    rating: number;
    specialty: string[];
    imageUrl?: string | undefined;
  };
  driverProfile?: {
    vehicleType: 'moto' | 'velo' | 'voiture';
    vehiclePlate?: string;
    isAvailable: boolean;
    currentLocation?: {
      latitude: number;
      longitude: number;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientProfile extends User {
  role: 'client';
  defaultAddress?: string;
  favorites?: string[]; // IDs of vendors
}

export interface VendeurProfile extends User {
  role: 'vendeur';
  vendorProfile: {
    shopName: string;
    description: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    isOpen: boolean;
    rating: number;
    specialty: string[];
    imageUrl?: string | undefined; // Cloudinary URL
  };
}

export interface LivreurProfile extends User {
  role: 'livreur';
  driverProfile: {
    vehicleType: 'moto' | 'velo' | 'voiture';
    vehiclePlate?: string;
    isAvailable: boolean;
    currentLocation?: {
      latitude: number;
      longitude: number;
    };
  };
}
