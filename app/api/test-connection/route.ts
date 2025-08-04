export async function POST(req: Request) {
  console.log("Test connection API called")

  try {
    const { apiKey, modelName } = await req.json()
    console.log("Testing connection with model:", modelName)

    if (!apiKey) {
      console.error("No API key provided")
      return Response.json({ error: "API key is required" }, { status: 400 })
    }

    console.log("Making test request to BigModel API...")

    // Direct API call to BigModel
    const response = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName || "glm-4-plus",
        messages: [
          {
            role: "user",
            content: "Hello! Please respond with 'Connection successful' to test the API.",
          },
        ],
        temperature: 0.7,
        max_tokens: 50,
      }),
    })

    console.log("Test API response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("BigModel API error:", errorText)

      let errorMessage = "Connection failed"
      if (response.status === 401) {
        errorMessage = "Invalid API key"
      } else if (response.status === 404) {
        errorMessage = "Model not found"
      } else if (response.status === 429) {
        errorMessage = "Rate limit exceeded"
      }

      return Response.json({ error: errorMessage }, { status: 400 })
    }

    const result = await response.json()
    const content = result.choices?.[0]?.message?.content || "No response"
    console.log("Test successful, response:", content)

    return Response.json({
      success: true,
      message: "Connection successful!",
      response: content,
    })
  } catch (error: any) {
    console.error("Test connection error:", error)
    return Response.json({ error: "Network error occurred" }, { status: 400 })
  }
}
