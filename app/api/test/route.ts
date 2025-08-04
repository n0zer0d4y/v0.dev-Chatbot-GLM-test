export async function POST(req: Request) {
  try {
    const { apiKey, modelName } = await req.json()

    if (!apiKey) {
      return Response.json({ error: "API key required" }, { status: 400 })
    }

    const response = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: [{ role: "user", content: "Hello! Say 'API test successful' to confirm." }],
        max_tokens: 50,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = "Connection failed"
      if (response.status === 401) errorMessage = "Invalid API key"
      else if (response.status === 404) errorMessage = "Model not found"
      else if (response.status === 429) errorMessage = "Rate limit exceeded"

      return Response.json({ error: errorMessage }, { status: 400 })
    }

    const result = await response.json()
    return Response.json({
      success: true,
      message: "Connection successful!",
      response: result.choices?.[0]?.message?.content || "Test completed",
    })
  } catch (error) {
    return Response.json({ error: "Network error" }, { status: 500 })
  }
}
