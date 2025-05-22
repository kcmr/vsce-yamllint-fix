const SUPPORTED_LANGUAGES = ['yaml', 'yml', 'github-actions-workflow'] as const

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

/**
 * Checks if the given languageId is supported by the extension
 * @param languageId The languageId to check
 * @returns true if the languageId is supported, false otherwise
 */
export function isValidLanguage(languageId: string): languageId is SupportedLanguage {
  return SUPPORTED_LANGUAGES.includes(languageId as SupportedLanguage)
}
