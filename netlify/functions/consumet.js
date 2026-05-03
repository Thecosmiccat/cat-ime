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

    // Step 1: Search for anime
    const searchUrl = `https://api.consumet.org/anime/gogoanime/${encodeURIComponent(animeTitle)}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (!searchData.results || searchData.results.length === 0) {
      return {
        statusCode: 404,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Anime not found' })
      };
    }

    // Step 2: Get anime info
    const animeId = searchData.results[0].id;
    const infoUrl = `https://api.consumet.org/anime/gogoanime/info/${encodeURIComponent(animeId)}`;
    const infoRes = await fetch(infoUrl);
    const infoData = await infoRes.json();

    if (!infoData.episodes || infoData.episodes.length === 0) {
      return {
        statusCode: 404,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'No episodes found' })
      };
    }

    // Step 3: Get streaming links
    const episodeIndex = Math.min(epNum - 1, infoData.episodes.length - 1);
    const episodeId = infoData.episodes[episodeIndex].id;
    const watchUrl = `https://api.consumet.org/anime/gogoanime/watch/${encodeURIComponent(episodeId)}`;
    const watchRes = await fetch(watchUrl);
    const watchData = await watchRes.json();

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(watchData)
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: e.message })
    };
  }
};
