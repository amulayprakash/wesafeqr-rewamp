import api, { isBackendConfigured } from './api'

// ─── Lost & Found Item Service ────────────────────────────────────────────────
// Calls the WeSafe backend on Render.
// All functions throw if VITE_BACKEND_URL is not set.

function assertBackend() {
  if (!isBackendConfigured()) {
    throw new Error('BACKEND_NOT_CONFIGURED')
  }
}

/**
 * Fetch all items belonging to the authenticated user.
 * GET /api/items
 */
export async function getUserItems() {
  assertBackend()
  const { data } = await api.get('/api/items')
  return data?.items ?? data ?? []
}

/**
 * Create a new item.
 * POST /api/items
 */
export async function createItem(payload) {
  assertBackend()
  const { data } = await api.post('/api/items', payload)
  return data
}

/**
 * Toggle item status between 'secured' and 'lost'.
 * PATCH /api/items/:itemId/status
 */
export async function toggleItemStatus(itemId, status) {
  assertBackend()
  const { data } = await api.patch(`/api/items/${itemId}/status`, { status })
  return data
}

/**
 * Update item details.
 * PATCH /api/items/:itemId
 */
export async function updateItem(itemId, payload) {
  assertBackend()
  const { data } = await api.patch(`/api/items/${itemId}`, payload)
  return data
}

/**
 * Delete an item.
 * DELETE /api/items/:itemId
 */
export async function deleteItem(itemId) {
  assertBackend()
  await api.delete(`/api/items/${itemId}`)
}
