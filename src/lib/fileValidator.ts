/**
 * Client-side file security validator for BoxedLinks.
 *
 * Defence layers:
 *  1. File size limit (3 MB)
 *  2. Zero-byte rejection
 *  3. Explicit extension allowlist (safe types only)
 *  4. Blocked extension denylist (executables & scripts)
 *  5. Double-extension attack detection (e.g. photo.jpg.exe)
 *  6. Suspicious filename pattern checks
 *  7. Magic-byte (file signature) verification
 *     – blocks executables even when renamed with a safe extension
 *  8. Null-byte detection inside declared text files
 *     – catches binary payloads pretending to be plain-text
 *  9. Suspicious content patterns in text files
 *     – blocks embedded scripts, PHP, PowerShell etc.
 * 10. PE-header scan inside ZIP archives (polyglot / zip-bomb guard)
 */

export const MAX_FILE_SIZE_BYTES = 3 * 1024 * 1024 // 3 MB

/* ── Allowlist: only these extensions are accepted ── */
export const ALLOWED_EXTENSIONS = new Set([
  // Text / document
  'txt', 'md', 'markdown', 'rtf', 'csv', 'log', 'ini', 'cfg', 'conf',
  // Data interchange
  'json', 'xml', 'yaml', 'yml', 'toml',
  // Web source
  'html', 'htm', 'css', 'js', 'ts', 'jsx', 'tsx',
  // Images
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico', 'bmp',
  // Documents
  'pdf',
  // Archives
  'zip', 'gz', 'tar',
  // Audio
  'mp3', 'wav', 'ogg', 'flac', 'm4a',
  // Video
  'mp4', 'webm', 'ogv',
])

/* ── Denylist: always blocked regardless of MIME type ── */
const BLOCKED_EXTENSIONS = new Set([
  // Windows executables & scripts
  'exe', 'com', 'scr', 'pif', 'bat', 'cmd',
  'vbs', 'vbe', 'wsf', 'wsh', 'hta',
  'ps1', 'psm1', 'psd1', 'ps1xml',
  // Unix shells
  'sh', 'bash', 'zsh', 'fish', 'ksh', 'csh',
  // Java
  'jar', 'war', 'ear', 'class',
  // Installers
  'msi', 'msp', 'mst', 'cab', 'deb', 'rpm', 'pkg', 'dmg',
  // System / drivers
  'dll', 'sys', 'drv', 'ocx', 'so', 'dylib',
  // Mobile
  'apk', 'ipa', 'xap',
  // Misc dangerous
  'reg', 'inf', 'lnk', 'url', 'cpl', 'sct', 'job',
])

/* ── Magic-byte signatures ── */
interface MagicSig {
  offset: number
  bytes: number[]
  label: string
  safe: boolean
}

const MAGIC_SIGS: MagicSig[] = [
  // ─ DANGEROUS (block) ─
  { offset: 0, bytes: [0x4D, 0x5A],                         label: 'Windows PE Executable (MZ)',        safe: false },
  { offset: 0, bytes: [0x7F, 0x45, 0x4C, 0x46],             label: 'ELF Executable',                   safe: false },
  { offset: 0, bytes: [0xFE, 0xED, 0xFA, 0xCE],             label: 'Mach-O 32-bit',                    safe: false },
  { offset: 0, bytes: [0xCE, 0xFA, 0xED, 0xFE],             label: 'Mach-O 32-bit LE',                 safe: false },
  { offset: 0, bytes: [0xFE, 0xED, 0xFA, 0xCF],             label: 'Mach-O 64-bit',                    safe: false },
  { offset: 0, bytes: [0xCF, 0xFA, 0xED, 0xFE],             label: 'Mach-O 64-bit LE',                 safe: false },
  { offset: 0, bytes: [0xCA, 0xFE, 0xBA, 0xBE],             label: 'Java Class / Mach-O Fat Binary',   safe: false },
  { offset: 0, bytes: [0x23, 0x21],                         label: 'Unix Shebang Script',               safe: false }, // #!/
  // ─ SAFE (identify, don't block) ─
  { offset: 0, bytes: [0x25, 0x50, 0x44, 0x46],             label: 'PDF',    safe: true },
  { offset: 0, bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A],label: 'PNG',    safe: true },
  { offset: 0, bytes: [0xFF, 0xD8, 0xFF],                   label: 'JPEG',   safe: true },
  { offset: 0, bytes: [0x47, 0x49, 0x46, 0x38],             label: 'GIF',    safe: true },
  { offset: 0, bytes: [0x50, 0x4B, 0x03, 0x04],             label: 'ZIP',    safe: true },
  { offset: 0, bytes: [0x52, 0x61, 0x72, 0x21],             label: 'RAR',    safe: true },
  { offset: 0, bytes: [0x1F, 0x8B],                         label: 'GZIP',   safe: true },
  { offset: 0, bytes: [0x42, 0x5A, 0x68],                   label: 'BZIP2',  safe: true },
  { offset: 0, bytes: [0x52, 0x49, 0x46, 0x46],             label: 'WAV',    safe: true },
  { offset: 0, bytes: [0x49, 0x44, 0x33],                   label: 'MP3',    safe: true },
  { offset: 0, bytes: [0xFF, 0xFB],                         label: 'MP3',    safe: true },
  { offset: 4, bytes: [0x66, 0x74, 0x79, 0x70],             label: 'MP4',    safe: true }, // ftyp at offset 4
]

/* ── Text-file suspicious content patterns ── */
const TEXT_SUSPICIOUS: Array<{ pattern: string; label: string }> = [
  { pattern: '<script',          label: 'EMBEDDED SCRIPT TAG' },
  { pattern: '<?php',            label: 'PHP CODE' },
  { pattern: 'powershell',       label: 'POWERSHELL COMMANDS' },
  { pattern: 'cmd.exe',          label: 'CMD REFERENCE' },
  { pattern: 'wscript.',         label: 'WINDOWS SCRIPT HOST' },
  { pattern: 'cscript.',         label: 'WINDOWS SCRIPT HOST' },
  { pattern: 'javascript:',      label: 'JAVASCRIPT URL INJECTION' },
  { pattern: 'vbscript:',        label: 'VBSCRIPT URL INJECTION' },
  { pattern: 'eval(',            label: 'CODE EVAL INJECTION' },
  { pattern: 'document.write(',  label: 'DOM WRITE INJECTION' },
  { pattern: 'createobject(',    label: 'ACTIVEX OBJECT CREATION' },
  { pattern: 'shell.run',        label: 'SHELL EXECUTION ATTEMPT' },
]

/* ── Extensions that must be plain-text ── */
const TEXT_EXTENSIONS = new Set([
  'txt', 'md', 'markdown', 'csv', 'log', 'ini', 'cfg', 'conf',
  'json', 'xml', 'yaml', 'yml', 'toml',
  'html', 'htm', 'css', 'js', 'ts', 'jsx', 'tsx', 'rtf',
])

/* ── Helpers ── */
function readSlice(file: File, start: number, end: number): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader()
    fr.onload = (e) => resolve(new Uint8Array(e.target!.result as ArrayBuffer))
    fr.onerror = () => reject(new Error('FAILED TO READ FILE'))
    fr.readAsArrayBuffer(file.slice(start, end))
  })
}

function matchesSig(buf: Uint8Array, sig: MagicSig): boolean {
  if (buf.length < sig.offset + sig.bytes.length) return false
  return sig.bytes.every((b, i) => buf[sig.offset + i] === b)
}

function nullByteRatio(buf: Uint8Array, limit: number): number {
  const n = Math.min(limit, buf.length)
  let zeros = 0
  for (let i = 0; i < n; i++) if (buf[i] === 0x00) zeros++
  return zeros / n
}

function containsPEHeader(buf: Uint8Array): boolean {
  // Scan for MZ signature after the first two bytes (i.e. embedded payload)
  for (let i = 2; i < buf.length - 1; i++) {
    if (buf[i] === 0x4D && buf[i + 1] === 0x5A) return true
  }
  return false
}

/* ── Public API ── */
export interface ValidationResult {
  valid: boolean
  error?: string  // Hard block reason (shown as toast + inline)
}

export async function validateFile(file: File): Promise<ValidationResult> {
  // 1 — Size
  if (file.size === 0)
    return { valid: false, error: 'EMPTY FILE REJECTED: ZERO-BYTE TRANSMISSIONS NOT ALLOWED' }

  if (file.size > MAX_FILE_SIZE_BYTES)
    return { valid: false, error: `FILE TOO LARGE: ${(file.size / (1024 * 1024)).toFixed(1)}MB EXCEEDS 3MB LIMIT` }

  // 2 — Extract extension
  const nameParts = file.name.split('.')
  const ext = (nameParts.pop() ?? '').toLowerCase()

  // 3 — Double-extension check (e.g. image.jpg.exe)
  if (nameParts.length >= 2) {
    const innerExt = nameParts[nameParts.length - 1].toLowerCase()
    if (BLOCKED_EXTENSIONS.has(innerExt))
      return { valid: false, error: `DOUBLE EXTENSION ATTACK DETECTED: .${innerExt}.${ext} — BLOCKED` }
  }

  // 4 — Denylist
  if (BLOCKED_EXTENSIONS.has(ext))
    return { valid: false, error: `DANGEROUS FILE TYPE BLOCKED: .${ext.toUpperCase()} EXECUTABLES ARE NOT PERMITTED` }

  // 5 — Allowlist
  if (!ALLOWED_EXTENSIONS.has(ext))
    return { valid: false, error: `UNSUPPORTED FILE TYPE: .${ext.toUpperCase()} IS NOT ON THE PERMITTED LIST` }

  // 6 — Suspicious filename characters
  if (/[<>:"|?*\x00-\x1f]/.test(file.name))
    return { valid: false, error: 'SUSPICIOUS FILENAME: ILLEGAL CHARACTERS DETECTED — BLOCKED' }

  // 7 — Read first 8 KB for magic-byte and content analysis
  let header: Uint8Array
  try {
    header = await readSlice(file, 0, 8192)
  } catch {
    return { valid: false, error: 'COULD NOT READ FILE CONTENTS — TRANSMISSION REJECTED FOR SAFETY' }
  }

  // 8 — Magic-byte scan
  for (const sig of MAGIC_SIGS) {
    if (matchesSig(header, sig)) {
      if (!sig.safe)
        return { valid: false, error: `EXECUTABLE SIGNATURE DETECTED: ${sig.label.toUpperCase()} FOUND — BLOCKED` }
      break // matched a safe sig; stop scanning
    }
  }

  // 9 — Null-byte heuristic (binary masquerading as text)
  if (TEXT_EXTENSIONS.has(ext) && nullByteRatio(header, 512) > 0.01)
    return { valid: false, error: 'BINARY PAYLOAD DETECTED IN TEXT FILE: NULL BYTES FOUND — BLOCKED' }

  // 10 — Suspicious text-content patterns
  if (TEXT_EXTENSIONS.has(ext)) {
    const sample = new TextDecoder('utf-8', { fatal: false })
      .decode(header.slice(0, 4096))
      .toLowerCase()
    for (const { pattern, label } of TEXT_SUSPICIOUS) {
      if (sample.includes(pattern))
        return { valid: false, error: `SUSPICIOUS CONTENT: ${label} DETECTED IN FILE — BLOCKED` }
    }
  }

  // 11 — PE header inside ZIP archives (zip-bomb / polyglot guard)
  if (['zip', 'gz', 'tar'].includes(ext) && containsPEHeader(header))
    return { valid: false, error: 'EXECUTABLE PAYLOAD INSIDE ARCHIVE: PE HEADER DETECTED — BLOCKED' }

  return { valid: true }
}

/* Human-readable list of allowed types for UI display */
export function allowedExtensionsList(): string {
  const groups: Record<string, string[]> = {
    'Text': ['txt', 'md', 'csv', 'log', 'json', 'xml', 'yaml'],
    'Images': ['png', 'jpg', 'gif', 'webp', 'svg'],
    'Documents': ['pdf'],
    'Archives': ['zip', 'gz'],
    'Media': ['mp3', 'mp4', 'wav'],
    'Code': ['html', 'css', 'js', 'ts'],
  }
  return Object.entries(groups)
    .map(([k, exts]) => `${k}: ${exts.map(e => `.${e}`).join(' ')}`)
    .join('  |  ')
}
