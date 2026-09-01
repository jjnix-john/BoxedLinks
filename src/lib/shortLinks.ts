import { supabase } from './supabase'

/**
 * Generate a random short code (8 characters, alphanumeric)
 */
function generateShortCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/**
 * Create or retrieve a short link for a given file path
 */
export async function createShortLink(filePath: string): Promise<string> {
  try {
    // Get current user
    const { data: { session } } = await supabase.auth.getSession()
    const userId = session?.user?.id

    // Check if we already have a short link for this path
    const { data: existing } = await supabase
      .from('short_links')
      .select('short_code')
      .eq('file_path', filePath)
      .single()

    if (existing) {
      return `${window.location.origin}/s/${existing.short_code}`
    }

    // Generate a new short code
    let shortCode = generateShortCode()
    let attempts = 0
    const maxAttempts = 10

    // Ensure uniqueness
    while (attempts < maxAttempts) {
      const { data: conflict } = await supabase
        .from('short_links')
        .select('id')
        .eq('short_code', shortCode)
        .single()

      if (!conflict) break
      shortCode = generateShortCode()
      attempts++
    }

    if (attempts >= maxAttempts) {
      throw new Error('Failed to generate unique short code')
    }

    // Insert new short link
    const { error } = await supabase.from('short_links').insert([
      {
        short_code: shortCode,
        file_path: filePath,
        created_at: new Date().toISOString(),
        created_by: userId || null,
      },
    ])

    if (error) throw error

    return `${window.location.origin}/s/${shortCode}`
  } catch (err) {
    console.error('Error creating short link:', err)
    // Fallback: return the regular link if short link creation fails
    return `${window.location.origin}/view?path=${encodeURIComponent(filePath)}`
  }
}

/**
 * Resolve a short code to its full file path
 */
export async function resolveShortLink(shortCode: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('short_links')
      .select('file_path')
      .eq('short_code', shortCode)
      .single()

    if (error) {
      console.error('Error resolving short link:', error)
      return null
    }

    return data?.file_path ?? null
  } catch (err) {
    console.error('Error resolving short link:', err)
    return null
  }
}
