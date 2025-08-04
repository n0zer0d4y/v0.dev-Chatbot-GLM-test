"use client"

import { useState, useEffect, useCallback } from "react"

interface ChatSettings {
  apiKey: string
  modelName: string
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: number
}

export default function BigModelChatbot() {
  const [activeTab, setActiveTab] = useState<"chat" | "settings">("settings")
  const [settings, setSettings] = useState<ChatSettings>({
    apiKey: "",
    modelName: "glm-4-plus",
  })
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [settingsSaved, setSettingsSaved] = useState(false)

  // Isolated error handler
  const handleError = useCallback((error: any, context: string) => {
    console.error(`Error in ${context}:`, error)
    // Don't let any errors bubble up
    return null
  }, [])

  // Load settings safely
  useEffect(() => {
    try {
      const savedSettings = localStorage?.getItem?.("bigmodel-chat-settings")
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings)
        setSettings(parsed)
        setSettingsSaved(true)
      }
    } catch (error) {
      handleError(error, "loadSettings")
    }
  }, [handleError])

  const saveSettings = useCallback(async () => {
    try {
      localStorage?.setItem?.("bigmodel-chat-settings", JSON.stringify(settings))
      setSettingsSaved(true)
      setTestResult({ success: true, message: "Settings saved!" })
      setTimeout(() => setTestResult(null), 2000)
    } catch (error) {
      handleError(error, "saveSettings")
      setTestResult({ success: false, message: "Failed to save" })
    }
  }, [settings, handleError])

  const testConnection = useCallback(async () => {
    if (!settings.apiKey.trim()) {
      setTestResult({ success: false, message: "Enter API key first" })
      return
    }

    setIsTestingConnection(true)
    setTestResult(null)

    try {
      const response = await fetch("/api/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })

      const result = await response.json()
      setTestResult({
        success: response.ok,
        message: response.ok ? "Connection works!" : result.error || "Failed",
      })
    } catch (error) {
      handleError(error, "testConnection")
      setTestResult({ success: false, message: "Network error" })
    } finally {
      setIsTestingConnection(false)
    }
  }, [settings, handleError])

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading || !settingsSaved) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "",
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, assistantMessage])

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          ...settings,
        }),
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const reader = response.body?.getReader()
      if (!reader) throw new Error("No response stream")

      const decoder = new TextDecoder()
      let fullResponse = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        fullResponse += chunk

        setMessages((prev) =>
          prev.map((msg) => (msg.id === assistantMessage.id ? { ...msg, content: fullResponse } : msg)),
        )
      }
    } catch (error) {
      handleError(error, "sendMessage")
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessage.id ? { ...msg, content: "Error: Please check your settings" } : msg,
        ),
      )
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, settingsSaved, messages, settings, handleError])

  const clearChat = useCallback(() => {
    setMessages([])
  }, [])

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">BigModel API Tester</h1>

        {/* Tab Navigation */}
        <div className="flex bg-white rounded-lg shadow-sm mb-6 p-1">
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex-1 py-2 px-4 rounded-md transition-colors ${
              activeTab === "settings" ? "bg-blue-500 text-white" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            ⚙️ Settings
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex-1 py-2 px-4 rounded-md transition-colors ${
              activeTab === "chat" ? "bg-blue-500 text-white" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            💬 Chat
          </button>
        </div>

        {/* Settings Panel */}
        {activeTab === "settings" && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">API Configuration</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
                <input
                  type="password"
                  placeholder="Enter your BigModel API key"
                  value={settings.apiKey}
                  onChange={(e) => {
                    setSettings((prev) => ({ ...prev, apiKey: e.target.value }))
                    setSettingsSaved(false)
                    setTestResult(null)
                  }}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                <select
                  value={settings.modelName}
                  onChange={(e) => {
                    setSettings((prev) => ({ ...prev, modelName: e.target.value }))
                    setSettingsSaved(false)
                    setTestResult(null)
                  }}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="glm-4-plus">GLM-4-Plus (Flagship)</option>
                  <option value="glm-4-0520">GLM-4-0520</option>
                  <option value="glm-4-long">GLM-4-Long</option>
                  <option value="glm-4-flash">GLM-4-Flash</option>
                  <option value="glm-4">GLM-4</option>
                </select>
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-md ${
                    testResult.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}
                >
                  {testResult.message}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={saveSettings}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  💾 Save Settings
                </button>
                <button
                  onClick={testConnection}
                  disabled={isTestingConnection}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  {isTestingConnection ? "🔄 Testing..." : "🧪 Test Connection"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Chat Panel */}
        {activeTab === "chat" && (
          <div className="bg-white rounded-lg shadow-sm flex flex-col h-[70vh]">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">Chat with {settings.modelName}</h2>
              <div className="flex gap-2">
                <button
                  onClick={clearChat}
                  className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  🗑️ Clear
                </button>
                {!settingsSaved && <span className="text-sm text-orange-600">⚠️ Configure settings first</span>}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-gray-500 mt-8">
                  <div className="text-4xl mb-4">💬</div>
                  <p>Start a conversation with the AI</p>
                  <p className="text-sm">Configure your API settings first</p>
                </div>
              )}

              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.role === "user" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-200 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                      Thinking...
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t">
              <div className="flex gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 p-2 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  disabled={!settingsSaved || !settings.apiKey}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                />
                <button
                  onClick={sendMessage}
                  disabled={isLoading || !settingsSaved || !settings.apiKey || !input.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  📤 Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
