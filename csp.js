const policies = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://maps.googleapis.com'],
  'child-src': ["'self'"],
  'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  'img-src': [
    "'self'",
    'https://raw.githubusercontent.com',
    process.env.NEXT_PUBLIC_SERVER_URL || '' // Allow dynamic domain
  ],
  'font-src': ["'self'"],
  'frame-src': ["'self'"],
  'connect-src': ["'self'", 'https://maps.googleapis.com']
}

module.exports = Object.entries(policies)
  .map(([key, value]) => {
    if (Array.isArray(value)) {
      return `${key} ${value.join(' ')}`
    }
    return ''
  })
  .join('; ')
