import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';

async function test() {
  try {
    const anthropic = createAnthropic({
      apiKey: 'sk-s4khsp60uuk46scdu55cdaklfnrxldhqlw3m8uwo5mr377r8',
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
