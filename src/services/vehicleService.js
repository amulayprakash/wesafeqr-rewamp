import api, { isBackendConfigured } from './api'

// ─── Vehicle (ZIDDIQR) Service ────────────────────────────────────────────────
// Calls the WeSafe backend on Render.

function assertBackend() {
  if (!isBackendConfigured()) {
    throw new Error('BACKEND_NOT_CONFIGURED')
  }
}

/**
 * Fetch all vehicles belonging to the authenticated user.
 * GET /api/vehicles
 */
export async function getUserVehicles() {
  assertBackend()
  const { data } = await api.get('/api/vehicles')
  return data?.vehicles ?? data ?? []
}

/**
 * Register a new vehicle.
 * POST /api/vehicles
 */
export async function createVehicle(payload) {
  assertBackend()
  const { data } = await api.post('/api/vehicles', payload)
  return data
}

/**
 * Update vehicle settings (status, allowCalls, allowMessages, etc.)
 * PATCH /api/vehicles/:vehicleId
 */
export async function updateVehicle(vehicleId, payload) {
  assertBackend()
  const { data } = await api.patch(`/api/vehicles/${vehicleId}`, payload)
  return data
}

/**
 * Delete a vehicle.
 * DELETE /api/vehicles/:vehicleId
 */
export async function deleteVehicle(vehicleId) {
  assertBackend()
  await api.delete(`/api/vehicles/${vehicleId}`)
}
