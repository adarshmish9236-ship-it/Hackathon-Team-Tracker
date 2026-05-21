// Built-in fetch

async function test() {
  try {
    const res = await fetch('http://localhost:5173/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'test_user_' + Date.now(),
        email: 'test_' + Date.now() + '@example.com',
        password: 'password123',
        full_name: 'Test User'
      })
    });
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', data);
  } catch (err) {
    console.error('Error:', err);
  }
}
test();
