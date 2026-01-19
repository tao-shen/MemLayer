// Agent 相关类型
export interface Agent {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  category: Category;
  subcategory: string;
  seller: Seller;
  pricing: Pricing;
  images: string[];
  thumbnail: string;
  tags: string[];
  rating: number;
  reviewCount: number;
  orderCount: number;
  deliveryTime: number; // in days
  features: string[];
  packages: Package[];
  faqs: FAQ[];
  createdAt: string;
  updatedAt: string;
  isProSeller: boolean;
  isTopRated: boolean;
  isFeatured: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  subcategories: Subcategory[];
  agentCount: number;
}

export interface Subcategory {
  id: string;
  name: string;
  slug: string;
  agentCount: number;
}

export interface Seller {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  level: SellerLevel;
  rating: number;
  reviewCount: number;
  responseTime: string;
  languages: string[];
  memberSince: string;
  lastDelivery: string;
  description: string;
  country: string;
  isOnline: boolean;
}

export type SellerLevel = 'new' | 'level1' | 'level2' | 'topRated';

export interface Pricing {
  startingPrice: number;
  currency: string;
}

export interface Package {
  id: string;
  name: 'basic' | 'standard' | 'premium';
  title: string;
  description: string;
  price: number;
  deliveryTime: number;
  revisions: number | 'unlimited';
  features: PackageFeature[];
}

export interface PackageFeature {
  name: string;
  included: boolean;
  value?: string | number;
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface Review {
  id: string;
  agentId: string;
  buyer: {
    id: string;
    username: string;
    avatar: string;
    country: string;
  };
  rating: number;
  comment: string;
  createdAt: string;
  sellerResponse?: {
    comment: string;
    createdAt: string;
  };
}

// 筛选和排序
export interface FilterOptions {
  categories: string[];
  priceRange: [number, number];
  deliveryTime: number | null;
  sellerLevel: SellerLevel[];
  rating: number | null;
}

export type SortOption = 
  | 'recommended' 
  | 'bestselling' 
  | 'newest' 
  | 'price_low' 
  | 'price_high';

// 搜索
export interface SearchParams {
  query: string;
  category?: string;
  subcategory?: string;
  filters?: FilterOptions;
  sort?: SortOption;
  page?: number;
  limit?: number;
}

export interface SearchResult {
  agents: Agent[];
  total: number;
  page: number;
  totalPages: number;
}

// 用户相关
export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar: string;
  isSeller: boolean;
  favorites: string[];
  createdAt: string;
}

// 订单
export interface Order {
  id: string;
  agentId: string;
  agent: Agent;
  package: Package;
  buyer: User;
  seller: Seller;
  status: OrderStatus;
  totalPrice: number;
  requirements: string;
  createdAt: string;
  deliveryDate: string;
  completedAt?: string;
}

export type OrderStatus = 
  | 'pending' 
  | 'in_progress' 
  | 'delivered' 
  | 'revision' 
  | 'completed' 
  | 'cancelled';
