/**
 * Google Cloud Translation API v3 Helper
 * Translates text using service account authentication
 */

interface ServiceAccountCredentials {
  project_id: string;
  private_key: string;
  client_email: string;
}

interface TranslationV3Response {
  translations: Array<{
    translatedText: string;
    detectedLanguageCode?: string;
  }>;
}

/**
 * Creates a JWT token for Google Cloud API authentication
 */
async function createJWT(credentials: ServiceAccountCredentials): Promise<string> {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-translation',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600, // 1 hour expiration
  };

  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  // Import the private key
  const privateKey = credentials.private_key.replace(/\\n/g, '\n');
  console.log('=== DEBUG: Private Key Processing ===');
  console.log('Original private key length:', credentials.private_key.length);
  console.log('Processed private key length:', privateKey.length);
  console.log('Has BEGIN marker:', privateKey.includes('-----BEGIN PRIVATE KEY-----'));
  console.log('Has END marker:', privateKey.includes('-----END PRIVATE KEY-----'));
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(privateKey),
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );

  // Sign the JWT
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(signatureInput)
  );

  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return `${signatureInput}.${encodedSignature}`;
}

/**
 * Converts PEM format to ArrayBuffer
 */
function pemToArrayBuffer(pem: string): ArrayBuffer {
  const pemContents = pem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');
  const binaryString = atob(pemContents);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Gets an access token using the service account JWT
 */
async function getAccessToken(credentials: ServiceAccountCredentials): Promise<string> {
  const jwt = await createJWT(credentials);

  console.log('=== DEBUG: OAuth Request ===');
  console.log('Client Email:', credentials.client_email);
  console.log('Project ID:', credentials.project_id);
  console.log('JWT Length:', jwt.length);
  console.log('JWT Preview:', jwt.substring(0, 100) + '...');

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('=== DEBUG: Token fetch error ===');
    console.error('Status:', response.status);
    console.error('Error response:', error);
    throw new Error(`Failed to get access token: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Gets service account credentials from environment
 */
function getServiceAccountCredentials(): ServiceAccountCredentials {
  const credentialsJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');

  console.log('=== DEBUG: Service Account Check ===');
  console.log('GOOGLE_SERVICE_ACCOUNT_JSON exists:', !!credentialsJson);
  console.log('Length:', credentialsJson?.length || 0);

  if (!credentialsJson) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON not configured');
  }

  try {
    const credentials = JSON.parse(credentialsJson);

    console.log('=== DEBUG: Parsed Credentials ===');
    console.log('Has project_id:', !!credentials.project_id);
    console.log('Has private_key:', !!credentials.private_key);
    console.log('Has client_email:', !!credentials.client_email);
    console.log('Project ID:', credentials.project_id);
    console.log('Client Email:', credentials.client_email);

    if (!credentials.project_id || !credentials.private_key || !credentials.client_email) {
      throw new Error('Invalid service account credentials format');
    }

    return credentials;
  } catch (error) {
    console.error('Error parsing service account credentials:', error);
    throw new Error('Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON');
  }
}

/**
 * Languages where hashtags should remain in English due to platform compatibility
 */
const HASHTAG_ENGLISH_LANGUAGES = ['zh', 'zh-TW', 'ja', 'ko', 'ar'];

/**
 * Extracts hashtags from text
 */
function extractHashtags(text: string): string[] {
  const hashtagRegex = /#[\w\u00c0-\u017f\u0400-\u04ff\u0590-\u05ff\u0600-\u06ff\u4e00-\u9fff\uac00-\ud7af]+/g;
  return text.match(hashtagRegex) || [];
}

/**
 * Processes hashtags based on target language
 */
function processHashtags(text: string, targetLanguage: string, translatedHashtags: Map<string, string> = new Map()): string {
  if (HASHTAG_ENGLISH_LANGUAGES.includes(targetLanguage)) {
    // For these languages, keep hashtags in English
    return text;
  }

  // For other languages, replace hashtags with translated versions if available
  let processedText = text;
  for (const [original, translated] of translatedHashtags.entries()) {
    processedText = processedText.replace(new RegExp(original.replace('#', '\\#'), 'g'), translated);
  }

  return processedText;
}

/**
 * Translates hashtags separately if the language supports it
 */
async function translateHashtagsIfSupported(
  hashtags: string[],
  targetLanguage: string,
  sourceLanguage: string,
  credentials: ServiceAccountCredentials,
  accessToken: string
): Promise<Map<string, string>> {
  const hashtagTranslations = new Map<string, string>();

  if (HASHTAG_ENGLISH_LANGUAGES.includes(targetLanguage) || hashtags.length === 0) {
    return hashtagTranslations;
  }

  try {
    // Remove # and translate just the text part
    const hashtagTexts = hashtags.map(tag => tag.substring(1));
    const projectId = credentials.project_id;
    const url = `https://translation.googleapis.com/v3/projects/${projectId}/locations/global:translateText`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: hashtagTexts,
        sourceLanguageCode: sourceLanguage,
        targetLanguageCode: targetLanguage,
        mimeType: 'text/plain',
      }),
    });

    if (response.ok) {
      const data: TranslationV3Response = await response.json();
      
      if (data.translations && data.translations.length === hashtags.length) {
        hashtags.forEach((originalTag, index) => {
          const translatedText = data.translations[index].translatedText;
          // Clean up translated text and reconstruct hashtag
          const cleanTranslatedText = translatedText.replace(/[^a-zA-Z0-9\u00c0-\u017f\u0400-\u04ff\u0590-\u05ff\u0600-\u06ff\u4e00-\u9fff\uac00-\ud7af]/g, '');
          if (cleanTranslatedText) {
            hashtagTranslations.set(originalTag, `#${cleanTranslatedText}`);
          }
        });
      }
    }
  } catch (error) {
    console.log('Hashtag translation failed, keeping original hashtags:', error);
  }

  return hashtagTranslations;
}

/**
 * Translates text using Google Cloud Translation API v3
 * @param text - The text to translate
 * @param targetLanguage - The target language code (e.g., 'es', 'fr', 'fa')
 * @param sourceLanguage - The source language code (default: 'en')
 * @returns The translated text
 */
export async function translateText(
  text: string,
  targetLanguage: string,
  sourceLanguage: string = 'en'
): Promise<string> {
  // If target language is the same as source, return original text
  if (targetLanguage === sourceLanguage) {
    return text;
  }

  try {
    const credentials = getServiceAccountCredentials();
    const accessToken = await getAccessToken(credentials);
    const projectId = credentials.project_id;

    // Extract hashtags before translation
    const hashtags = extractHashtags(text);

    // API v3 endpoint
    const url = `https://translation.googleapis.com/v3/projects/${projectId}/locations/global:translateText`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [text],
        sourceLanguageCode: sourceLanguage,
        targetLanguageCode: targetLanguage,
        mimeType: 'text/plain',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Translate API v3 error:', response.status, errorText);
      throw new Error(`Translation API error: ${response.status}`);
    }

    const data: TranslationV3Response = await response.json();

    if (!data.translations?.[0]?.translatedText) {
      throw new Error('No translation returned from API');
    }

    let translatedText = data.translations[0].translatedText;

    // Handle hashtag translation based on language
    if (hashtags.length > 0) {
      const hashtagTranslations = await translateHashtagsIfSupported(
        hashtags,
        targetLanguage,
        sourceLanguage,
        credentials,
        accessToken
      );
      translatedText = processHashtags(translatedText, targetLanguage, hashtagTranslations);
    }

    return translatedText;
  } catch (error) {
    console.error('Translation error:', error);
    throw new Error(`Failed to translate text: ${(error as Error).message}`);
  }
}

/**
 * Translates an array of texts
 * @param texts - Array of texts to translate
 * @param targetLanguage - The target language code
 * @param sourceLanguage - The source language code (default: 'en')
 * @returns Array of translated texts
 */
export async function translateMultiple(
  texts: string[],
  targetLanguage: string,
  sourceLanguage: string = 'en'
): Promise<string[]> {
  if (targetLanguage === sourceLanguage) {
    return texts;
  }

  try {
    const credentials = getServiceAccountCredentials();
    const accessToken = await getAccessToken(credentials);
    const projectId = credentials.project_id;

    // Extract all hashtags from all texts
    const allHashtags = new Set<string>();
    texts.forEach(text => {
      const hashtags = extractHashtags(text);
      hashtags.forEach(tag => allHashtags.add(tag));
    });

    // API v3 endpoint - can handle multiple texts in one request
    const url = `https://translation.googleapis.com/v3/projects/${projectId}/locations/global:translateText`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: texts,
        sourceLanguageCode: sourceLanguage,
        targetLanguageCode: targetLanguage,
        mimeType: 'text/plain',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Translate API v3 error:', response.status, errorText);
      throw new Error(`Translation API error: ${response.status}`);
    }

    const data: TranslationV3Response = await response.json();

    if (!data.translations || data.translations.length === 0) {
      throw new Error('No translations returned from API');
    }

    // Handle hashtag translations for all texts
    let hashtagTranslations = new Map<string, string>();
    if (allHashtags.size > 0) {
      hashtagTranslations = await translateHashtagsIfSupported(
        Array.from(allHashtags),
        targetLanguage,
        sourceLanguage,
        credentials,
        accessToken
      );
    }

    return data.translations.map(translation => {
      let translatedText = translation.translatedText;
      if (allHashtags.size > 0) {
        translatedText = processHashtags(translatedText, targetLanguage, hashtagTranslations);
      }
      return translatedText;
    });
  } catch (error) {
    console.error('Translation error:', error);
    throw new Error(`Failed to translate texts: ${(error as Error).message}`);
  }
}
