async function test() {
  try {
    const res = await fetch('https://api.xiaomimimo.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'authorization': 'Bearer ***REMOVED***',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'mimo-v2.5-pro',
        max_tokens: 100,
        messages: [{role: 'user', content: 'Hello'}]
      })
    });
    console.log(res.status, await res.text());
  } catch (e) {
    console.error(e);
  }
}
test();
