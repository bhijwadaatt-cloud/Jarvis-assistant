package com.jarvis.assistant.model

enum class ActionRiskLevel {
    LOW,        // Direct execution (e.g., launch app, search web, check battery)
    MEDIUM,     // Staged execution (e.g., open dialer, stage WhatsApp message)
    HIGH        // Requires explicit confirmation (e.g., direct call, send message, sensitive setting)
}

enum class ActionType {
    LAUNCH_APP,
    MAKE_CALL,
    SEND_MESSAGE,
    SEARCH_YOUTUBE,
    SEARCH_WEB,
    NAVIGATE_SOCIAL,
    DEVICE_CONTROL,
    READ_STATUS,
    CLARIFICATION_REQUIRED,
    UNKNOWN
}

data class JarvisAction(
    val id: String = java.util.UUID.randomUUID().toString(),
    val type: ActionType,
    val target: String = "",
    val payload: Map<String, String> = emptyMap(),
    val riskLevel: ActionRiskLevel = ActionRiskLevel.LOW,
    val requiresConfirmation: Boolean = false,
    val confirmationPrompt: String = ""
)

data class JarvisActionPlan(
    val prompt: String,
    val spokenResponse: String,
    val actions: List<JarvisAction> = emptyList(),
    val isMultiStep: Boolean = false,
    val clarificationQuestion: String? = null
)

sealed class ExecutionResult {
    data class Success(val message: String, val details: String = "") : ExecutionResult()
    data class Failure(val error: String, val isRecoverable: Boolean = false) : ExecutionResult()
    data class AwaitingConfirmation(val action: JarvisAction, val prompt: String) : ExecutionResult()
}
