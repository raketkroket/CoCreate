export { query, getDb, initDb } from './sqlite.js'

export const disconnect = async () => {
  if (pool) {
    await pool.end()
  }
}
