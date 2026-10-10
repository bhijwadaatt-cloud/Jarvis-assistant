package com.jarvis.assistant.automation

import android.content.Context
import android.content.Intent
import android.net.Uri
import com.jarvis.assistant.model.ActionType
import com.jarvis.assistant.model.ExecutionResult
import com.jarvis.assistant.model.JarvisAction
import java.net.URLEncoder

class IntentRouter(
    private val context: Context,
    private val appLauncher: AppLauncher,
    private val contactsManager: ContactsManager,
    private val callingManager: CallingManager,
    private val messagingManager: MessagingManager,
    private val deviceControlManager: DeviceControlManager
) {

    /**
     * Executes validated single action and returns ExecutionResult.
     */
    fun routeAndExecute(action: JarvisAction): ExecutionResult {
        return when (action.type) {
            ActionType.LAUNCH_APP -> {
                val appName = action.payload["app"] ?: action.target
                val (success, message) = appLauncher.launchAppByName(appName)
                if (success) ExecutionResult.Success(message) else ExecutionResult.Failure(message)
            }

            ActionType.MAKE_CALL -> {
                val contactQuery = action.payload["contact"] ?: action.target
                val isDirect = action.payload["direct"] == "true"

                // Resolve contact
                val matches = contactsManager.findContactsByName(contactQuery)
                val targetNumber = if (matches.isNotEmpty()) {
                    matches[0].phoneNumber
                } else {
                    contactQuery.replace(Regex("[^0-9+]"), "")
                }

                if (targetNumber.isBlank()) {
                    return ExecutionResult.Failure("Contact '$contactQuery' not found in contacts list.")
                }

                val success = if (isDirect) {
                    callingManager.initiateDirectCall(targetNumber)
                } else {
                    callingManager.openDialer(targetNumber)
                }

                if (success) {
                    val displayName = if (matches.isNotEmpty()) matches[0].name else targetNumber
                    ExecutionResult.Success("Dialing $displayName on phone dialer, Sir.")
                } else {
                    ExecutionResult.Failure("Unable to engage phone dialer for $contactQuery.")
                }
            }

            ActionType.SEND_MESSAGE -> {
                val contactQuery = action.payload["contact"] ?: action.target
                val messageText = action.payload["message"] ?: "Hello from Jarvis"
                val platform = action.payload["platform"] ?: "whatsapp"

                val matches = contactsManager.findContactsByName(contactQuery)
                val targetNumber = if (matches.isNotEmpty()) matches[0].phoneNumber else contactQuery

                val success = if (platform == "whatsapp") {
                    messagingManager.stageWhatsAppMessage(targetNumber, messageText)
                } else {
                    messagingManager.stageSmsMessage(targetNumber, messageText)
                }

                if (success) {
                    ExecutionResult.Success("Opening $platform with staged message for $contactQuery, Sir.")
                } else {
                    ExecutionResult.Failure("Failed to dispatch $platform message composer.")
                }
            }

            ActionType.SEARCH_YOUTUBE -> {
                val query = action.payload["query"] ?: action.target
                val success = openYouTubeSearch(query)
                if (success) {
                    ExecutionResult.Success("Searching YouTube for '$query', Sir.")
                } else {
                    ExecutionResult.Failure("YouTube navigation could not be initialized.")
                }
            }

            ActionType.SEARCH_WEB -> {
                val query = action.payload["query"] ?: action.target
                val success = openWebSearch(query)
                if (success) {
                    ExecutionResult.Success("Searching Google for '$query', Sir.")
                } else {
                    ExecutionResult.Failure("Web browser search failed to launch.")
                }
            }

            ActionType.NAVIGATE_SOCIAL -> {
                val account = action.payload["target"] ?: action.target
                val success = openInstagramProfile(account)
                if (success) {
                    ExecutionResult.Success("Opening Instagram profile for $account, Sir.")
                } else {
                    ExecutionResult.Failure("Instagram navigation failed.")
                }
            }

            ActionType.DEVICE_CONTROL -> {
                val feature = action.payload["feature"] ?: action.target
                val state = action.payload["state"] ?: "on"

                when (feature.lowercase()) {
                    "flashlight", "torch" -> {
                        val (success, message) = deviceControlManager.setFlashlight(state == "on")
                        if (success) ExecutionResult.Success(message) else ExecutionResult.Failure(message)
                    }
                    "volume" -> {
                        val success = deviceControlManager.adjustVolume(state == "up")
                        if (success) ExecutionResult.Success("Media volume adjusted, Sir.")
                        else ExecutionResult.Failure("Volume adjustment failed.")
                    }
                    "wifi", "bluetooth", "display", "settings" -> {
                        val success = deviceControlManager.openSettingsPage(feature)
                        if (success) ExecutionResult.Success("Opening $feature configuration panel, Sir.")
                        else ExecutionResult.Failure("Failed to launch $feature settings.")
                    }
                    else -> ExecutionResult.Failure("Unsupported device control parameter.")
                }
            }

            ActionType.READ_STATUS -> {
                val type = action.payload["type"] ?: "battery"
                if (type == "battery") {
                    ExecutionResult.Success(deviceControlManager.getBatteryStatus())
                } else {
                    ExecutionResult.Success("System status is nominal, Sir.")
                }
            }

            ActionType.CLARIFICATION_REQUIRED -> {
                ExecutionResult.Failure(action.payload["question"] ?: "Clarification required.")
            }

            ActionType.UNKNOWN -> {
                ExecutionResult.Failure("Directive not recognized in allowed action list.")
            }
        }
    }

    private fun openYouTubeSearch(query: String): Boolean {
        val encodedQuery = URLEncoder.encode(query, "UTF-8")
        return try {
            val appIntent = Intent(Intent.ACTION_VIEW, Uri.parse("vnd.youtube:results?search_query=$encodedQuery")).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(appIntent)
            true
        } catch (e: Exception) {
            try {
                val webIntent = Intent(Intent.ACTION_VIEW, Uri.parse("https://www.youtube.com/results?search_query=$encodedQuery")).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                context.startActivity(webIntent)
                true
            } catch (ex: Exception) {
                false
            }
        }
    }

    private fun openWebSearch(query: String): Boolean {
        val encodedQuery = URLEncoder.encode(query, "UTF-8")
        return try {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://www.google.com/search?q=$encodedQuery")).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
            true
        } catch (e: Exception) {
            false
        }
    }

    private fun openInstagramProfile(username: String): Boolean {
        val cleanUser = username.removePrefix("@").trim()
        return try {
            val appIntent = Intent(Intent.ACTION_VIEW, Uri.parse("http://instagram.com/_u/$cleanUser")).apply {
                setPackage("com.instagram.android")
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(appIntent)
            true
        } catch (e: Exception) {
            try {
                val webIntent = Intent(Intent.ACTION_VIEW, Uri.parse("https://instagram.com/$cleanUser")).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                context.startActivity(webIntent)
                true
            } catch (ex: Exception) {
                false
            }
        }
    }
}
