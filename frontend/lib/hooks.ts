import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  productsApi,
  categoriesApi,
  inventoryApi,
  financeApi,
  priceScraperApi,
} from './api'

// ─── Categories (rarely change → long staleTime) ───

export function useCategories(includeInactive?: boolean) {
  return useQuery({
    queryKey: ['categories', { includeInactive }],
    queryFn: () => categoriesApi.getAll(includeInactive).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  })
}

// ─── Products ───

export function useProducts(params?: Record<string, any>) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => productsApi.getAll(params).then((r) => r.data),
  })
}

export function useProduct(id: number) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: () => productsApi.getById(id).then((r) => r.data),
    enabled: !!id,
  })
}

// ─── Inventory ───

export function useInventorySummary() {
  return useQuery({
    queryKey: ['inventory', 'summary'],
    queryFn: () => inventoryApi.getSummary().then((r) => r.data),
  })
}

export function useInventoryByCategory() {
  return useQuery({
    queryKey: ['inventory', 'byCategory'],
    queryFn: () => inventoryApi.getByCategory().then((r) => r.data),
  })
}

export function useInventoryByStockStatus() {
  return useQuery({
    queryKey: ['inventory', 'byStockStatus'],
    queryFn: () => inventoryApi.getByStockStatus().then((r) => r.data),
  })
}

export function useEmptyCategories() {
  return useQuery({
    queryKey: ['inventory', 'emptyCategories'],
    queryFn: () => inventoryApi.getEmptyCategories().then((r) => r.data),
  })
}

export function useDailyLog(days: number = 30) {
  return useQuery({
    queryKey: ['inventory', 'dailyLog', days],
    queryFn: () => inventoryApi.getDailyLog(days).then((r) => r.data),
  })
}

export function useSoldProducts() {
  return useQuery({
    queryKey: ['inventory', 'soldProducts'],
    queryFn: () => inventoryApi.getSoldProducts().then((r) => r.data),
  })
}

// ─── Finance ───

export function useFinanceSummary(params?: Record<string, any>) {
  return useQuery({
    queryKey: ['finance', 'summary', params],
    queryFn: () => financeApi.getSummary(params).then((r) => r.data),
  })
}

// ─── AI Price Results ───

export function useAiPriceResults() {
  return useQuery({
    queryKey: ['aiPriceResults'],
    queryFn: () => priceScraperApi.getResults().then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  })
}

// ─── Invalidation helper ───

export function useInvalidate() {
  const qc = useQueryClient()
  return {
    products: () => qc.invalidateQueries({ queryKey: ['products'] }),
    inventory: () => qc.invalidateQueries({ queryKey: ['inventory'] }),
    categories: () => qc.invalidateQueries({ queryKey: ['categories'] }),
    all: () => qc.invalidateQueries(),
  }
}
