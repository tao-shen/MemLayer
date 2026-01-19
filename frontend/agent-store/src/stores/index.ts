import { create } from 'zustand';
import { Agent, Category, FilterOptions, SortOption, User } from '../types';
import { agents, categories } from '../data/mockData';

// 搜索和筛选 Store
interface SearchState {
  query: string;
  selectedCategory: string | null;
  selectedSubcategory: string | null;
  filters: FilterOptions;
  sort: SortOption;
  results: Agent[];
  isLoading: boolean;
  setQuery: (query: string) => void;
  setCategory: (category: string | null) => void;
  setSubcategory: (subcategory: string | null) => void;
  setFilters: (filters: Partial<FilterOptions>) => void;
  setSort: (sort: SortOption) => void;
  search: () => void;
  clearFilters: () => void;
}

const defaultFilters: FilterOptions = {
  categories: [],
  priceRange: [0, 10000],
  deliveryTime: null,
  sellerLevel: [],
  rating: null,
};

export const useSearchStore = create<SearchState>((set, get) => ({
  query: '',
  selectedCategory: null,
  selectedSubcategory: null,
  filters: defaultFilters,
  sort: 'recommended',
  results: agents,
  isLoading: false,
  
  setQuery: (query) => {
    set({ query });
    get().search();
  },
  
  setCategory: (category) => {
    set({ selectedCategory: category, selectedSubcategory: null });
    get().search();
  },
  
  setSubcategory: (subcategory) => {
    set({ selectedSubcategory: subcategory });
    get().search();
  },
  
  setFilters: (filters) => {
    set({ filters: { ...get().filters, ...filters } });
    get().search();
  },
  
  setSort: (sort) => {
    set({ sort });
    get().search();
  },
  
  search: () => {
    const { query, selectedCategory, selectedSubcategory, filters, sort } = get();
    set({ isLoading: true });
    
    let results = [...agents];
    
    // 文字搜索
    if (query) {
      const lowercaseQuery = query.toLowerCase();
      results = results.filter(a => 
        a.title.toLowerCase().includes(lowercaseQuery) ||
        a.description.toLowerCase().includes(lowercaseQuery) ||
        a.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
      );
    }
    
    // 分类筛选
    if (selectedCategory) {
      results = results.filter(a => a.category.slug === selectedCategory);
    }
    
    // 子分类筛选
    if (selectedSubcategory) {
      results = results.filter(a => 
        a.category.subcategories.some(s => s.slug === selectedSubcategory)
      );
    }
    
    // 价格筛选
    if (filters.priceRange) {
      results = results.filter(a => 
        a.pricing.startingPrice >= filters.priceRange[0] &&
        a.pricing.startingPrice <= filters.priceRange[1]
      );
    }
    
    // 交付时间筛选
    if (filters.deliveryTime) {
      results = results.filter(a => a.deliveryTime <= filters.deliveryTime!);
    }
    
    // 评分筛选
    if (filters.rating) {
      results = results.filter(a => a.rating >= filters.rating!);
    }
    
    // 排序
    switch (sort) {
      case 'bestselling':
        results.sort((a, b) => b.orderCount - a.orderCount);
        break;
      case 'newest':
        results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'price_low':
        results.sort((a, b) => a.pricing.startingPrice - b.pricing.startingPrice);
        break;
      case 'price_high':
        results.sort((a, b) => b.pricing.startingPrice - a.pricing.startingPrice);
        break;
      default:
        // recommended - 按评分和订单数综合排序
        results.sort((a, b) => (b.rating * b.orderCount) - (a.rating * a.orderCount));
    }
    
    set({ results, isLoading: false });
  },
  
  clearFilters: () => {
    set({ 
      filters: defaultFilters, 
      selectedCategory: null, 
      selectedSubcategory: null,
      query: '',
      sort: 'recommended'
    });
    get().search();
  },
}));

// 用户 Store
interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  favorites: string[];
  login: (user: User) => void;
  logout: () => void;
  toggleFavorite: (agentId: string) => void;
  isFavorite: (agentId: string) => boolean;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  favorites: [],
  
  login: (user) => set({ user, isAuthenticated: true, favorites: user.favorites }),
  
  logout: () => set({ user: null, isAuthenticated: false, favorites: [] }),
  
  toggleFavorite: (agentId) => {
    const { favorites } = get();
    const newFavorites = favorites.includes(agentId)
      ? favorites.filter(id => id !== agentId)
      : [...favorites, agentId];
    set({ favorites: newFavorites });
  },
  
  isFavorite: (agentId) => get().favorites.includes(agentId),
}));

// 购物车 Store
interface CartItem {
  agentId: string;
  packageId: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (agentId: string, packageId: string) => void;
  removeItem: (agentId: string, packageId: string) => void;
  clearCart: () => void;
  getTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  
  addItem: (agentId, packageId) => {
    const { items } = get();
    const existingItem = items.find(
      item => item.agentId === agentId && item.packageId === packageId
    );
    
    if (existingItem) {
      set({
        items: items.map(item =>
          item.agentId === agentId && item.packageId === packageId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ),
      });
    } else {
      set({ items: [...items, { agentId, packageId, quantity: 1 }] });
    }
  },
  
  removeItem: (agentId, packageId) => {
    set({
      items: get().items.filter(
        item => !(item.agentId === agentId && item.packageId === packageId)
      ),
    });
  },
  
  clearCart: () => set({ items: [] }),
  
  getTotal: () => {
    const { items } = get();
    return items.reduce((total, item) => {
      const agent = agents.find(a => a.id === item.agentId);
      const pkg = agent?.packages.find(p => p.id === item.packageId);
      return total + (pkg?.price || 0) * item.quantity;
    }, 0);
  },
}));

// UI Store
interface UIState {
  isMobileMenuOpen: boolean;
  isSearchOpen: boolean;
  isLoginModalOpen: boolean;
  toggleMobileMenu: () => void;
  toggleSearch: () => void;
  openLoginModal: () => void;
  closeLoginModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isMobileMenuOpen: false,
  isSearchOpen: false,
  isLoginModalOpen: false,
  
  toggleMobileMenu: () => set(state => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  toggleSearch: () => set(state => ({ isSearchOpen: !state.isSearchOpen })),
  openLoginModal: () => set({ isLoginModalOpen: true }),
  closeLoginModal: () => set({ isLoginModalOpen: false }),
}));

// Categories Store
interface CategoriesState {
  categories: Category[];
  getCategory: (slug: string) => Category | undefined;
}

export const useCategoriesStore = create<CategoriesState>(() => ({
  categories,
  getCategory: (slug) => categories.find(c => c.slug === slug),
}));
