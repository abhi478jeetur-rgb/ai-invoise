import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';

async function test() {
  try {
    const anthropic = createAnthropic({
      apiKey: '***REMOVED***',
      baseURL: 'https://api.xiaomimimo.com/v1'
    });
    
    const { text } = await generateText({
      model: anthropic('claude-3-5-sonnet-20241022'),
      prompt: 'Hello, what model are you?'
    });
    console.log('Success:', text);
  } catch (e) {
    console.error('Error:', e.message);
  }
}

test();
