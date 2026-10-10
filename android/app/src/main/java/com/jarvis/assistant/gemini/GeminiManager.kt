package com.jarvis.assistant.gemini

import android.util.Log
import com.google.ai.client.generativeai.GenerativeModel
import com.google.ai.client.generativeai.type.content
import com.jarvis.assistant.model.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject

class GeminiManager(private val apiKey: String) {

    private val tag = "GeminiManager"
    private var generativeModel: GenerativeModel? = null

    init {
        if (apiKey.isNotBlank()) {
            generativeModel = GenerativeModel(
                modelName = "gemini-1.5-flash",
                apiKey = apiKey
            )
        }
    }

    /**
     * Parses the user's spoken directive into a validated, structured JarvisActionPlan.
     */
    suspend fun parseUserDirective(
        prompt: String,
        contextInfo: String = ""
    ): JarvisActionPlan = withContext(Dispatchers.IO) {
        if (generativeModel == null) {
            return@withContext fallbackIntentParser(prompt)
        }

        val systemPrompt = """
            You are J.A.R.V.I.S., an elite Android Voice Assistant. Convert user directives into structured JSON actions.
            Available Action Types:
            - LAUNCH_APP: payload: {"app": "<package or app name>"}
            - MAKE_CALL: payload: {"contact": "<name>", "phone": "<optional number>", "direct": "true|false"}
            - SEND_MESSAGE: payload: {"contact": "<name>", "message": "<text>", "platform": "whatsapp|sms"}
            - SEARCH_YOUTUBE: payload: {"query": "<search terms>"}
            - SEARCH_WEB: payload: {"query": "<search terms>"}
            - NAVIGATE_SOCIAL: payload: {"platform": "instagram", "target": "<username or post>"}
            - DEVICE_CONTROL: payload: {"feature": "flashlight|bluetooth|wifi|volume|battery", "state": "on|off|up|down"}
            - READ_STATUS: payload: {"type": "battery|time|date"}
            - CLARIFICATION_REQUIRED: payload: {"question": "<question>"}

            Output JSON only in this format:
            {
              "spokenResponse": "<Polite Jarvis vocal response, e.g. 'Opening YouTube right away, Sir.'>",
              "actions": [
                {
                  "type": "<ACTION_TYPE>",
                  "target": "<target name>",
                  "payload": { ... },
                  "requiresConfirmation": false
                }
              ]
            }
            User context: $contextInfo
        """.trimIndent()

        try {
            val response = generativeModel?.generateContent(
                content {
                    text("$systemPrompt\n\nUser command: \"$prompt\"")
                }
            )

            val rawJson = cleanJsonResponse(response?.text ?: "{}")
            return@withContext parseJsonToActionPlan(prompt, rawJson)
        } catch (e: Exception) {
            Log.w(tag, "Gemini API unavailable or rate limited, engaging local rule engine: ${e.message}")
            return@withContext fallbackIntentParser(prompt)
        }
    }

    private fun cleanJsonResponse(raw: String): String {
        return raw.trim()
            .removePrefix("```json")
            .removePrefix("```")
            .removeSuffix("```")
            .trim()
    }

    private fun parseJsonToActionPlan(prompt: String, jsonStr: String): JarvisActionPlan {
        return try {
            val root = JSONObject(jsonStr)
            val spokenResponse = root.optString("spokenResponse", "Understood, Sir. Executing command.")
            val actionsArray = root.optJSONArray("actions") ?: JSONArray()
            val actionList = mutableListOf<JarvisAction>()

            for (i in 0 until actionsArray.length()) {
                val actObj = actionsArray.getJSONObject(i)
                val typeStr = actObj.optString("type", "UNKNOWN")
                val target = actObj.optString("target", "")
                val requiresConfirm = actObj.optBoolean("requiresConfirmation", false)

                val payloadObj = actObj.optJSONObject("payload")
                val payloadMap = mutableMapOf<String, String>()
                payloadObj?.keys()?.forEach { key ->
                    payloadMap[key] = payloadObj.optString(key)
                }

                val actionType = try {
                    ActionType.valueOf(typeStr)
                } catch (e: Exception) {
                    ActionType.UNKNOWN
                }

                val risk = when (actionType) {
                    ActionType.MAKE_CALL -> if (payloadMap["direct"] == "true") ActionRiskLevel.HIGH else ActionRiskLevel.MEDIUM
                    ActionType.SEND_MESSAGE -> ActionRiskLevel.HIGH
                    else -> ActionRiskLevel.LOW
                }

                actionList.add(
                    JarvisAction(
                        type = actionType,
                        target = target,
                        payload = payloadMap,
                        riskLevel = risk,
                        requiresConfirmation = requiresConfirm || risk == ActionRiskLevel.HIGH
                    )
                )
            }

            JarvisActionPlan(
                prompt = prompt,
                spokenResponse = spokenResponse,
                actions = actionList,
                isMultiStep = actionList.size > 1
            )
        } catch (e: Exception) {
            Log.e(tag, "Error parsing Gemini JSON: ${e.message}")
            fallbackIntentParser(prompt)
        }
    }

    /**
     * Local deterministic fallback rule engine that functions with zero internet or API quota.
     */
    fun fallbackIntentParser(prompt: String): JarvisActionPlan {
        val lower = prompt.lowercase().trim()
        val actions = mutableListOf<JarvisAction>()
        var spokenResponse = "Directive received, Sir."

        when {
            // Calling
            lower.contains("call ") || lower.contains("phone ") || lower.contains("dial ") -> {
                val contactName = lower.replace(Regex(".*?(?:call|phone|dial)\\s+"), "").replace("ko call lagao", "").trim()
                actions.add(
                    JarvisAction(
                        type = ActionType.MAKE_CALL,
                        target = contactName,
                        payload = mapOf("contact" to contactName, "direct" to "false"),
                        riskLevel = ActionRiskLevel.MEDIUM
                    )
                )
                spokenResponse = "Locating $contactName in contacts to initiate dialer, Sir."
            }

            // WhatsApp / SMS
            lower.contains("whatsapp") || lower.contains("message") || lower.contains("sms") -> {
                val platform = if (lower.contains("whatsapp")) "whatsapp" else "sms"
                val contactName = lower.replace(Regex(".*?(?:to|for)\\s+"), "").split(" ")[0].trim()
                actions.add(
                    JarvisAction(
                        type = ActionType.SEND_MESSAGE,
                        target = contactName,
                        payload = mapOf("contact" to contactName, "platform" to platform, "message" to "Hello from Jarvis"),
                        riskLevel = ActionRiskLevel.HIGH,
                        requiresConfirmation = true,
                        confirmationPrompt = "Prepare message for $contactName?"
                    )
                )
                spokenResponse = "Opening $platform composer for $contactName, Sir."
            }

            // YouTube Search
            lower.contains("youtube") -> {
                val query = lower.replace(Regex(".*?(?:youtube|search)\\s+(?:for\\s+)?"), "").trim()
                actions.add(
                    JarvisAction(
                        type = ActionType.SEARCH_YOUTUBE,
                        target = query,
                        payload = mapOf("query" to query)
                    )
                )
                spokenResponse = if (query.isNotBlank()) "Searching YouTube for $query, Sir." else "Opening YouTube, Sir."
            }

            // Instagram / Social
            lower.contains("instagram") -> {
                val account = lower.replace(Regex(".*?(?:instagram|search|account)\\s+"), "").trim()
                actions.add(
                    JarvisAction(
                        type = ActionType.NAVIGATE_SOCIAL,
                        target = account,
                        payload = mapOf("platform" to "instagram", "target" to account)
                    )
                )
                spokenResponse = "Accessing Instagram profile navigation, Sir."
            }

            // Flashlight / Torch
            lower.contains("flashlight") || lower.contains("torch") || lower.contains("light") -> {
                val state = if (lower.contains("off") || lower.contains("band")) "off" else "on"
                actions.add(
                    JarvisAction(
                        type = ActionType.DEVICE_CONTROL,
                        target = "flashlight",
                        payload = mapOf("feature" to "flashlight", "state" to state)
                    )
                )
                spokenResponse = "Flashlight engaged: $state, Sir."
            }

            // Battery / Status
            lower.contains("battery") || lower.contains("charge") || lower.contains("power") -> {
                actions.add(
                    JarvisAction(
                        type = ActionType.READ_STATUS,
                        target = "battery",
                        payload = mapOf("type" to "battery")
                    )
                )
                spokenResponse = "Analyzing device power reserves and telemetry, Sir."
            }

            // Launch App
            lower.contains("open ") || lower.contains("launch ") || lower.contains("kholo") -> {
                val appName = lower.replace(Regex(".*?(?:open|launch|start|kholo)\\s+"), "").trim()
                actions.add(
                    JarvisAction(
                        type = ActionType.LAUNCH_APP,
                        target = appName,
                        payload = mapOf("app" to appName)
                    )
                )
                spokenResponse = "Opening $appName, Sir."
            }

            // Web Search
            lower.contains("search ") || lower.contains("google ") -> {
                val query = lower.replace(Regex(".*?(?:search|google)\\s+(?:for\\s+)?"), "").trim()
                actions.add(
                    JarvisAction(
                        type = ActionType.SEARCH_WEB,
                        target = query,
                        payload = mapOf("query" to query)
                    )
                )
                spokenResponse = "Executing Google web inquiry for $query, Sir."
            }

            else -> {
                spokenResponse = "Sir, monitoring your instructions. Ready for application controls, calling, or device operations."
            }
        }

        return JarvisActionPlan(prompt = prompt, spokenResponse = spokenResponse, actions = actions)
    }
}
