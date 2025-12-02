import { useState } from 'react';

export default function Home() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Tell me what you want to buy and your budget. I’ll find the cheapest good option online.' },
  ]);
  const [products, setProducts] = useState([]);

  const sendMessage = async (e) => {
    e.preventDefault();
    const userMessage = input.trim();
    if (!userMessage) return;
    setMessages([...messages, { sender: 'user', text: userMessage }, { sender: 'bot', text: 'Let me check prices for you...' }]);
    setInput('');
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev.slice(0, prev.length - 1), { sender: 'bot', text: data.reply }]);
      setProducts(data.products || []);
    } catch (err) {
      setMessages((prev) => [...prev.slice(0, prev.length - 1), { sender: 'bot', text: 'Sorry, something went wrong.' }]);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>AI Price Seeker</h1>
      <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '12px', height: '300px', overflowY: 'auto', marginBottom: '10px' }}>
        {messages.map((msg, index) => (
          <div key={index} style={{ marginBottom: '8px' }}>
            <strong>{msg.sender === 'user' ? 'You:' : 'AI:'}</strong> <span>{msg.text}</span>
          </div>
        ))}
        {products.map((p, index) => (
          <div key={`product-${index}`} style={{ border: '1px solid #eee', borderRadius: '6px', padding: '8px', marginBottom: '6px' }}>
            <div style={{ fontWeight: '600' }}>{p.title}</div>
            <div>${p.price?.toFixed(2)} from {p.merchant}</div>
            <a href={p.url} target="_blank" rel="noopener noreferrer">View on {p.merchant}</a>
          </div>
        ))}
      </div>
      <form onSubmit={sendMessage} style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Example: warm slippers under $40"
          style={{ flex: 1, padding: '8px', fontSize: '16px', borderRadius: '6px', border: '1px solid #ccc' }}
        />
        <button type="submit" style={{ padding: '8px 12px', fontSize: '16px', borderRadius: '6px', border: 'none', background: '#000', color: '#fff', cursor: 'pointer' }}>Send</button>
      </form>
    </div>
  );
}
