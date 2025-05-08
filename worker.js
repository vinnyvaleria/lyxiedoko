async function getAccessToken(env) {
    const response = await fetch(
      `https://id.twitch.tv/oauth2/token?client_id=${env.CLIENT_ID}&client_secret=${env.CLIENT_SECRET}&grant_type=client_credentials`,
      {
        method: 'POST',
      }
    );
    const data = await response.json();
    return data.access_token;
  }
  
  async function getUserId(token, env) {
    const response = await fetch(
      `https://api.twitch.tv/helix/users?login=asagiame`,
      {
        headers: {
          'Client-ID': env.CLIENT_ID,
          'Authorization': `Bearer ${token}`
        }
      }
    );
    const data = await response.json();
    if (!data.data || data.data.length === 0) {
      throw new Error('User not found');
    }
    return data.data[0].id;
  }
  
  async function handleRequest(env) {
    try {
      const token = await getAccessToken(env);
      const userId = await getUserId(token, env);
      
      const response = await fetch(
        `https://api.twitch.tv/helix/videos?user_id=${userId}&type=archive&first=1&sort=time`,
        {
          headers: {
            'Client-ID': env.CLIENT_ID,
            'Authorization': `Bearer ${token}`
          }
        }
      );
      const data = await response.json();
      
      if (data.data.length > 0) {
        const streamDate = new Date(data.data[0].created_at);
        // Validate that the date is not in the future
        if (streamDate > new Date()) {
          throw new Error('Invalid stream date (future date detected)');
        }
        
        return new Response(JSON.stringify({ 
          lastStreamDate: data.data[0].created_at,
          title: data.data[0].title,  // Adding title for verification
          viewCount: data.data[0].view_count  // Adding view count for verification
        }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      } else {
        return new Response(JSON.stringify({ error: 'No recent streams found' }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
    } catch (error) {
      console.error('Error:', error);
      return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  }
  
  export default {
    async fetch(request, env, ctx) {
      return handleRequest(env);
    }
  };