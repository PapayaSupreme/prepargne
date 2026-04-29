const path = require("path")
const dotenv = require("dotenv")

dotenv.config({ path: path.resolve(__dirname, "../../.env") })

const openrouterApi = process.env.OPENROUTER_API
const openrouterModel = process.env.OPENROUTER_MODEL || "nvidia/nemotron-3-super-120b-a12b:free"

const moneyFormatter = new Intl.NumberFormat("fr-FR", {
	style: "currency",
	currency: "EUR"
})

const formatCurrency = (value) => moneyFormatter.format(Number(value) || 0)

const buildChatPrompt = (question, context = {}) => {
	const baseInstructions = [
		"You are a friendly financial literacy assistant for a budgeting app.",
		"Answer in the same language as the user when possible.",
		"Use the uploaded transaction context when relevant and never invent numbers that are not in the context.",
		"If the user asks about the uploaded data, ground the answer in the summary and recent transactions.",
		"If the user asks a general financial literacy question, give practical educational advice.",
		"Keep the answer concise, helpful, and actionable."
	].join(" ")

	return {
		prompt: baseInstructions,
		messages: [
			{ role: "system", content: baseInstructions },
			{
				role: "user",
				content: `User question: ${question}\n\nUploaded data context:\n${buildDataDigest(context)}`
			}
		]
	}
}

const buildDataDigest = (context = {}) => {
	const summary = context.summary || {}
	const categories = Array.isArray(context.spendingByCategory) ? context.spendingByCategory : []
	const days = Array.isArray(context.spendingByDay) ? context.spendingByDay : []
	const recentTransactions = Array.isArray(context.recentTransactions) ? context.recentTransactions : []

	const categoryDigest = categories.slice(0, 5).map((item) => `${item.category}: ${formatCurrency(item.total)}`).join("; ") || "No spending categories available."
	const dayDigest = days.slice(0, 5).map((item) => `${item.date}: ${formatCurrency(item.total)}`).join("; ") || "No daily spending totals available."
	const recentDigest = recentTransactions.slice(0, 5).map((item) => `${item.dateOp || "n/a"} · ${item.label || "Unnamed"} · ${item.category || "Uncategorized"} · ${formatCurrency(Math.abs(item.amount || 0))}`).join("\n") || "No recent transactions available."

	return [
		`Uploaded data available: ${context.hasUploadedData ? "yes" : "no"}`,
		`Total transactions: ${summary.totalTransactions ?? 0}`,
		`Spending transactions: ${summary.spendingTransactionCount ?? 0}`,
		`Total spending: ${formatCurrency(summary.totalSpending || 0)}`,
		`Average daily spending: ${formatCurrency(summary.averageDailySpending || 0)}`,
		`Biggest spending: ${summary.biggestSpending ? `${summary.biggestSpending.label} (${formatCurrency(summary.biggestSpending.amount)})` : "n/a"}`,
		`Top categories: ${categoryDigest}`,
		`Daily totals: ${dayDigest}`,
		`Recent transactions:\n${recentDigest}`
	].join("\n")
}

const buildFallbackAnswer = (question, context = {}) => {
	const summary = context.summary || {}
	const parts = []

	if (context.hasUploadedData) {
		parts.push(
			`From your uploaded data, your total spending is ${formatCurrency(summary.totalSpending || 0)} across ${summary.spendingTransactionCount || 0} spending transactions.`,
			summary.biggestSpending
				? `Your biggest expense is ${summary.biggestSpending.label} for ${formatCurrency(summary.biggestSpending.amount)}.`
				: "I could not find a biggest expense yet.",
			Array.isArray(context.spendingByCategory) && context.spendingByCategory.length > 0
				? `The main spending categories are ${context.spendingByCategory.slice(0, 3).map((item) => `${item.category} (${formatCurrency(item.total)})`).join(", ")}.`
				: "No spending categories were available in the imported data."
		)
	}

	const lowerQuestion = question.toLowerCase()
	if (lowerQuestion.includes("budget") || lowerQuestion.includes("save")) {
		parts.push("A simple budgeting rule is to separate needs, wants, and savings, then automate a transfer to savings on payday.")
	} else if (lowerQuestion.includes("debt") || lowerQuestion.includes("loan")) {
		parts.push("For debt, focus on high-interest balances first, keep minimum payments current, and avoid taking on new expensive credit if possible.")
	} else {
		parts.push("Good financial literacy basics include tracking recurring expenses, building an emergency fund, and reviewing spending categories every month.")
	}

	return parts.join("\n\n")
}

const readOpenRouterStream = async (response, onToken) => {
	const reader = response.body?.getReader()
	if (!reader) {
		const text = await response.text()
		return { answer: text.trim(), usage: null }
	}

	const decoder = new TextDecoder()
	let buffer = ""
	let answer = ""
	let usage = null

	while (true) {
		const { value, done } = await reader.read()
		if (done) {
			break
		}

		buffer += decoder.decode(value, { stream: true })
		const events = buffer.split(/\n\n/)
		buffer = events.pop() || ""

		for (const event of events) {
			const lines = event.split(/\n/)
			for (const line of lines) {
				const trimmed = line.trim()
				if (!trimmed.startsWith("data:")) {
					continue
				}

				const data = trimmed.slice(5).trim()
				if (!data || data === "[DONE]") {
					continue
				}

				let payload = null
				try {
					payload = JSON.parse(data)
				} catch {
					continue
				}

				const content = payload?.choices?.[0]?.delta?.content
				if (content) {
					answer += content
					if (typeof onToken === "function") {
						onToken(content)
					}
				}

				if (payload?.usage) {
					usage = payload.usage
				}
			}
		}
	}

	return { answer, usage }
}

const streamAnswer = async ({ question, context = {}, onToken } = {}) => {
	const { messages } = buildChatPrompt(question, context)

	if (!openrouterApi || typeof fetch !== "function") {
		console.log("[Chatbot] Fallback triggered: openrouterApi =", !!openrouterApi, "fetch available =", typeof fetch !== "undefined")
		const answer = buildFallbackAnswer(question, context)
		if (typeof onToken === "function") {
			onToken(answer)
		}

		return {
			answer,
			source: "fallback"
		}
	}

	let response
	try {
		response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${openrouterApi}`,
				"Content-Type": "application/json",
				"HTTP-Referer": process.env.OPENROUTER_REFERER || "http://localhost:5173",
				"X-Title": process.env.OPENROUTER_APP_NAME || "Prepargne"
			},
			body: JSON.stringify({
				model: openrouterModel,
				messages,
				stream: true
			})
		})
	} catch (error) {
		console.error("[Chatbot] Fetch error:", error instanceof Error ? error.message : error)
		const answer = buildFallbackAnswer(question, context)
		if (typeof onToken === "function") {
			onToken(answer)
		}

		return {
			answer,
			source: "fallback",
			error: error instanceof Error ? error.message : "Unexpected chatbot error"
		}
	}

	if (!response.ok) {
		console.log("[Chatbot] OpenRouter HTTP error:", response.status, response.statusText)
		const payload = await response.json().catch(() => ({}))
		console.log("[Chatbot] OpenRouter error payload:", payload)
		const answer = buildFallbackAnswer(question, context)
		if (typeof onToken === "function") {
			onToken(answer)
		}

		return {
			answer,
			source: "fallback",
			error: payload?.error?.message || payload?.message || response.statusText || "OpenRouter request failed."
		}
	}

	const streamed = await readOpenRouterStream(response, onToken)
	const answer = streamed.answer.trim()

	if (!answer) {
		const fallbackAnswer = buildFallbackAnswer(question, context)
		if (typeof onToken === "function") {
			onToken(fallbackAnswer)
		}

		return {
			answer: fallbackAnswer,
			source: "fallback",
			error: "OpenRouter returned an empty response."
		}
	}

	return {
		answer,
		source: "openrouter",
		usage: streamed.usage || null
	}
}

const generateAnswer = async ({ question, context = {} }) => {
	return streamAnswer({ question, context })
}

const testOpenRouterConnection = async () => {
	console.log("[Test] openrouterApi loaded:", !!openrouterApi)
	console.log("[Test] fetch available:", typeof fetch !== "undefined")

	if (!openrouterApi) {
		return {
			success: false,
			error: "OPENROUTER_API key not found in environment variables"
		}
	}

	try {
		const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${openrouterApi}`,
				"Content-Type": "application/json",
				"HTTP-Referer": process.env.OPENROUTER_REFERER || "http://localhost:5173",
				"X-Title": process.env.OPENROUTER_APP_NAME || "Prepargne"
			},
			body: JSON.stringify({
				model: openrouterModel,
				messages: [
					{
						role: "user",
						content: "Say 'Hello, I am working!' and nothing else."
					}
				],
				stream: false
			})
		})

		const payload = await response.json()

		if (!response.ok) {
			return {
				success: false,
				status: response.status,
				error: payload?.error?.message || payload?.message || response.statusText
			}
		}

		if (!payload?.choices?.[0]?.message?.content) {
			return {
				success: false,
				error: "No content in OpenRouter response",
				payload: JSON.stringify(payload).substring(0, 200)
			}
		}

		return {
			success: true,
			message: "OpenRouter API is working correctly!",
			response: payload.choices[0].message.content,
			model: openrouterModel
		}
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : String(error)
		}
	}
}

module.exports = {
	generateAnswer,
	streamAnswer,
	buildDataDigest,
	buildChatPrompt,
	buildFallbackAnswer,
	testOpenRouterConnection
}
