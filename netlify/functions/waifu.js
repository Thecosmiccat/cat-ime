// Fallback anime image URLs
const fallbackImages = [
  'https://i.imgur.com/8QmQhKj.jpg',
  'https://i.imgur.com/4NZh8zF.jpg',
  'https://i.imgur.com/3QZQZJL.jpg',
  'https://i.imgur.com/7Y8hZJQ.jpg',
  'https://i.imgur.com/5Y8hZJQ.jpg'
];

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: ''
    };
  }

  try {
    const res = await fetch('https://api.waifu.pics/sfw/waifu');
    
    // Check if response is OK
    if (!res.ok) {
      console.log('Waifu.pics returned status:', res.status);
      // Return fallback image
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          url: fallbackImages[Math.floor(Math.random() * fallbackImages.length)],
          fallback: true 
        })
      };
    }
    
    const text = await res.text();
    
    // Try to parse as JSON
    try {
      const data = JSON.parse(text);
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      };
    } catch (parseError) {
      console.log('Waifu.pics returned non-JSON:', text.substring(0, 100));
      // Return fallback image
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          url: fallbackImages[Math.floor(Math.random() * fallbackImages.length)],
          fallback: true 
        })
      };
    }
  } catch (e) {
    console.error('Waifu function error:', e);
    // Return fallback image on any error
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        url: fallbackImages[Math.floor(Math.random() * fallbackImages.length)],
        fallback: true,
        error: e.message
      })
    };
  }
};
