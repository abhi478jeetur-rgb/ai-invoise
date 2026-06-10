const url = 'https://api.xiaomimimo.com/v1/chat/completions';
const key = '***REMOVED***';
fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
  body: JSON.stringify({
    model: 'mimo-v2.5-pro',
    messages: [{ role: 'user', content: 'Test JSON format: { "subject": "test", "body": "test" }' }],
    temperature: 0.4,
    max_tokens: 1000
  })
}).then(r => r.json()).then(r => console.log(r.choices[0].message.content)).catch(console.error);
