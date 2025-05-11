export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { action, userMessage, savedItemId } = req.body;
    console.log(userMessage);
    const apiKey = process.env.GUMLOOP_API_KEY;
    const userId = process.env.GUMLOOP_USER_ID;

    if (!apiKey || !userId) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    if (action !== 'process' || !userMessage) {
      return res.status(400).json({ error: 'Invalid request parameters' });
    }

    const startResponse = await fetch('https://api.gumloop.com/api/v1/start_pipeline', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: userId,
        saved_item_id: savedItemId,
        pipeline_inputs: [{
          input_name: "chatbot_message",
          value: userMessage
        }]
      })
    });

    const startData = await startResponse.json();
    if (!startResponse.ok) {
      return res.status(startResponse.status).json({
        error: 'Failed to start pipeline',
        details: startData.error || 'Unknown error'
      });
    }

    const runId = startData.run_id;
    console.log('Run ID:', runId);

    if (!runId) {
      return res.status(500).json({ error: 'Failed to get run ID' });
    }

    const maxAttempts = 15;
    const initialDelay = 500;
    let attempts = 0;
    let result = null;

    while (attempts < maxAttempts) {
      attempts++;
      const delay = Math.min(initialDelay * Math.pow(1.5, attempts), 3000);
      await new Promise(resolve => setTimeout(resolve, delay));

      const checkResponse = await fetch(`https://api.gumloop.com/api/v1/get_pl_run?run_id=${runId}&user_id=${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const checkData = await checkResponse.json();
      console.log('Check response:', checkData);

      if (!checkResponse.ok) continue;

      if (checkData.state === 'DONE' && checkData.outputs && checkData.outputs.output) {
        result = checkData.outputs.output;
        break;
      } else if (checkData.state === 'FAILED') {
        return res.status(500).json({
          error: 'Pipeline execution failed',
          details: checkData.error || checkData.message
        });
      }
    }

    if (!result) {
      return res.status(504).json({ error: 'Pipeline timeout' });
    }

    return res.status(200).json({
      output: result,
      status: 'completed'
    });

  } catch (error) {
    console.error('Unhandled error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
