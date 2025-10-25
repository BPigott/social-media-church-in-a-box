// Simple test to verify Google Translate API access
const testTranslation = async () => {
  try {
    // Test with a simple Spanish translation
    const response = await fetch('https://translation.googleapis.com/v3/projects/YOUR_PROJECT_ID/locations/global:translateText', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer YOUR_ACCESS_TOKEN`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: ['Hello world'],
        sourceLanguageCode: 'en',
        targetLanguageCode: 'es',
        mimeType: 'text/plain',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Translation API error:', response.status, errorText);
      return;
    }

    const data = await response.json();
    console.log('Translation result:', data);
  } catch (error) {
    console.error('Test error:', error);
  }
};

console.log('This is a test file to verify Google Translate API access');
console.log('You need to replace YOUR_PROJECT_ID and YOUR_ACCESS_TOKEN with actual values');
