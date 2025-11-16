interface AppConfig {
  apiBaseUrl: string
}

function validateEnv(): AppConfig {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

  if (!apiBaseUrl || apiBaseUrl.trim() === '') {
    throw new Error(
      'FATAL: VITE_API_BASE_URL environment variable is not configured. ' +
      'Please set VITE_API_BASE_URL in your .env file or build configuration. ' +
      'Example: VITE_API_BASE_URL=http://localhost:3001'
    )
  }

  try {
    new URL(apiBaseUrl)
  } catch {
    throw new Error(
      `FATAL: VITE_API_BASE_URL="${apiBaseUrl}" is not a valid URL. ` +
      'Please provide a valid HTTP/HTTPS URL. ' +
      'Example: VITE_API_BASE_URL=http://localhost:3001'
    )
  }

  return Object.freeze({ apiBaseUrl })
}

export const config = validateEnv()
