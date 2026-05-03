// Helper to safely parse JSON
async function safeJson(res, label) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error(`${label} - Not JSON:`, text.substring(0, 200));
    return { error: 'Invalid JSON response', raw: text.substring(0, 200) };
  }
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  try {
    const { animeTitle, epNum } = JSON.parse(event.body);

    if (!animeTitle || !epNum) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Missing animeTitle or epNum' })
      };
    }

    // Try 9anime provider (more stable than gogoanime)
    // Simplify title - remove subtitle after colon for better search
    const simpleTitle = animeTitle.split(':')[0].trim();
    
    // Step 1: Search for anime
    const searchUrl = `https://api.consumet.org/anime/9anime/${encodeURIComponent(simpleTitle)}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await safeJson(searchRes, 'search');

    console.log('9anime search:', searchData.results?.length || 0, 'results for', simpleTitle);

    if (!searchData.results || searchData.results.length === 0) {
      // Try full title as fallback
      console.log('Trying full title...');
      const fullSearchUrl = `https://api.consumet.org/anime/9anime/${encodeURIComponent(animeTitle)}`;
      const fullRes = await fetch(fullSearchUrl);
      const fullData = await safeJson(fullRes, 'search-full');
      
      if (fullData.results && fullData.results.length > 0) {
        return await get9animeStreams(fullData.results[0].id, epNum, animeTitle);
      }
      
      // Try animeunity as final fallback
      console.log('Trying animeunity...');
      const unitySearchUrl = `https://api.consumet.org/anime/animeunity/${encodeURIComponent(simpleTitle)}`;
      const unityRes = await fetch(unitySearchUrl);
      const unityData = await safeJson(unityRes, 'unity-search');
      
      if (!unityData.results || unityData.results.length === 0) {
        return {
          statusCode: 200,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ 
            debug: { 
              step: 'search', 
              originalTitle: animeTitle,
              simpleTitle,
              nineAnimeResults: searchData.results?.length || 0,
              unityResults: unityData.results?.length || 0
            },
            error: 'Anime not found on any provider' 
          })
        };
      }
      
      // Use animeunity
      return await getAnimeUnityStreams(unityData.results[0].id, epNum, animeTitle);
    }

    // Use 9anime
    return await get9animeStreams(searchData.results[0].id, epNum, animeTitle);
    
  } catch (e) {
    console.error('Function error:', e);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: e.message, stack: e.stack })
    };
  }
};

async function get9animeStreams(animeId, epNum, animeTitle) {
  // Step 2: Get anime info
  const infoUrl = `https://api.consumet.org/anime/9anime/info/${encodeURIComponent(animeId)}`;
  const infoRes = await fetch(infoUrl);
  const infoData = await safeJson(infoRes, '9anime-info');

  console.log('9anime episodes:', infoData.episodes?.length || 0);

  if (!infoData.episodes || infoData.episodes.length === 0) {
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        debug: { step: 'info', animeId, infoData },
        error: 'No episodes found on 9anime' 
      })
    };
  }

  // Step 3: Get streaming links
  const episodeIndex = Math.min(epNum - 1, infoData.episodes.length - 1);
  const episodeId = infoData.episodes[episodeIndex].id;
  const watchUrl = `https://api.consumet.org/anime/9anime/watch/${encodeURIComponent(episodeId)}`;
  const watchRes = await fetch(watchUrl);
  const watchData = await safeJson(watchRes, '9anime-watch');

  console.log('9anime watch data:', watchData.sources?.length || 0, 'sources');

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ...watchData,
      debug: {
        provider: '9anime',
        animeTitle,
        epNum,
        foundAnime: infoData.title,
        totalEpisodes: infoData.episodes.length,
        episodeId
      }
    })
  };
}

async function getAnimeUnityStreams(animeId, epNum, animeTitle) {
  // Get anime info from animeunity
  const infoUrl = `https://api.consumet.org/anime/animeunity/info/${encodeURIComponent(animeId)}`;
  const infoRes = await fetch(infoUrl);
  const infoData = await safeJson(infoRes, 'unity-info');

  console.log('animeunity episodes:', infoData.episodes?.length || 0);

  if (!infoData.episodes || infoData.episodes.length === 0) {
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        debug: { step: 'info', animeId, infoData },
        error: 'No episodes found on animeunity' 
      })
    };
  }

  // Get streaming links
  const episodeIndex = Math.min(epNum - 1, infoData.episodes.length - 1);
  const episodeId = infoData.episodes[episodeIndex].id;
  const watchUrl = `https://api.consumet.org/anime/animeunity/watch/${encodeURIComponent(episodeId)}`;
  const watchRes = await fetch(watchUrl);
  const watchData = await safeJson(watchRes, 'unity-watch');

  console.log('animeunity watch data:', watchData.sources?.length || 0, 'sources');

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ...watchData,
      debug: {
        provider: 'animeunity',
        animeTitle,
        epNum,
        foundAnime: infoData.title,
        totalEpisodes: infoData.episodes.length,
        episodeId
      }
    })
  };
}
