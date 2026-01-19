import { Agent, Category, Seller, Review } from '../types';

// Categories - Empty for now
export const categories: Category[] = [];

// Sellers - Empty for now
export const sellers: Seller[] = [];

// Agents - Empty for now
export const agents: Agent[] = [];

// Reviews - Empty for now
export const reviews: Review[] = [];

// Helper functions
export const getFeaturedAgents = () => agents.filter(a => a.isFeatured);

export const getPopularAgents = () => [...agents].sort((a, b) => b.orderCount - a.orderCount);

export const getNewAgents = () => [...agents].sort((a, b) => 
  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
);

export const getAgentsByCategory = (categorySlug: string) => 
  agents.filter(a => a.category.slug === categorySlug);

export const searchAgents = (query: string) => {
  const lowercaseQuery = query.toLowerCase();
  return agents.filter(a => 
    a.title.toLowerCase().includes(lowercaseQuery) ||
    a.description.toLowerCase().includes(lowercaseQuery) ||
    a.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
  );
};
