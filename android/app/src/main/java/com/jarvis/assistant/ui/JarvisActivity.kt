package com.jarvis.assistant.ui

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.jarvis.assistant.automation.*
import com.jarvis.assistant.gemini.GeminiManager
import com.jarvis.assistant.model.JarvisAction
import com.jarvis.assistant.service.JarvisForegroundService
import com.jarvis.assistant.speech.SpeechRecognitionManager
import com.jarvis.assistant.task.TaskPlanner
import com.jarvis.assistant.wakeword.WakeWordManager
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.launch

class JarvisActivity : ComponentActivity() {

    private lateinit var appLauncher: AppLauncher
    private lateinit var contactsManager: ContactsManager
    private lateinit var callingManager: CallingManager
    private lateinit var messagingManager: MessagingManager
    private lateinit var deviceControlManager: DeviceControlManager
    private lateinit var intentRouter: IntentRouter
    private lateinit var taskPlanner: TaskPlanner
    private lateinit var geminiManager: GeminiManager
    private lateinit var speechManager: SpeechRecognitionManager
    private lateinit var wakeWordManager: WakeWordManager

    private val pendingConfirmationAction = MutableStateFlow<Pair<JarvisAction, String>?>(null)
    private val assistantStatus = MutableStateFlow("STANDBY // READY")

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        if (permissions[Manifest.permission.RECORD_AUDIO] == true) {
            wakeWordManager.startListening()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Initialize Core Components
        appLauncher = AppLauncher(this)
        contactsManager = ContactsManager(this)
        callingManager = CallingManager(this)
        messagingManager = MessagingManager(this)
        deviceControlManager = DeviceControlManager(this)

        intentRouter = IntentRouter(
            this,
            appLauncher,
            contactsManager,
            callingManager,
            messagingManager,
            deviceControlManager
        )

        taskPlanner = TaskPlanner(intentRouter)
        geminiManager = GeminiManager(com.jarvis.assistant.BuildConfig.GEMINI_API_KEY)

        speechManager = SpeechRecognitionManager(this) { spokenDirective ->
            processUserDirective(spokenDirective)
        }

        wakeWordManager = WakeWordManager(this)
        wakeWordManager.setOnWakeWordListener {
            assistantStatus.value = "HOTWORD DETECTED // LISTENING"
            speechManager.startListening()
        }

        checkAndRequestPermissions()

        setContent {
            JarvisHUD(
                isListening = speechManager.isListening,
                isSpeaking = speechManager.isSpeaking,
                rmsLevel = speechManager.rmsLevel,
                transcript = speechManager.currentTranscript,
                statusText = assistantStatus,
                executionLogs = taskPlanner.executionLogs,
                pendingConfirmation = pendingConfirmationAction,
                onMicClick = {
                    if (speechManager.isListening.value) {
                        speechManager.stopListening()
                        assistantStatus.value = "STANDBY"
                    } else {
                        assistantStatus.value = "LISTENING FOR DIRECTIVE..."
                        speechManager.startListening()
                    }
                },
                onCancelClick = {
                    taskPlanner.cancelCurrentTask()
                    assistantStatus.value = "TASK CANCELLED"
                },
                onConfirmAction = { action ->
                    pendingConfirmationAction.value = null
                    taskPlanner.executeConfirmedAction(action) { success, msg ->
                        assistantStatus.value = if (success) "DIRECTIVE COMPLETE" else "TASK FAILED"
                        speechManager.speak(msg)
                    }
                },
                onDismissConfirmation = {
                    pendingConfirmationAction.value = null
                    assistantStatus.value = "CONFIRMATION DISMISSED"
                }
            )
        }
    }

    private fun processUserDirective(command: String) {
        if (command.isBlank()) return

        assistantStatus.value = "ANALYZING DIRECTIVE..."
        lifecycleScope.launch {
            val batteryInfo = deviceControlManager.getBatteryStatus()
            val plan = geminiManager.parseUserDirective(command, "Battery: $batteryInfo")

            assistantStatus.value = "EXECUTING PLAN (${plan.actions.size} TASKS)"
            taskPlanner.executePlan(
                plan = plan,
                onRequireConfirmation = { action, prompt ->
                    pendingConfirmationAction.value = Pair(action, prompt)
                    speechManager.speak(prompt)
                },
                onComplete = { success, finalMsg ->
                    assistantStatus.value = if (success) "ACTION COMPLETED" else "ACTION INCOMPLETE"
                    speechManager.speak(finalMsg)
                }
            )
        }
    }

    private fun checkAndRequestPermissions() {
        val permissions = mutableListOf(
            Manifest.permission.RECORD_AUDIO,
            Manifest.permission.READ_CONTACTS,
            Manifest.permission.CALL_PHONE,
            Manifest.permission.CAMERA
        )
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            permissions.add(Manifest.permission.POST_NOTIFICATIONS)
        }

        val missing = permissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }

        if (missing.isNotEmpty()) {
            permissionLauncher.launch(missing.toTypedArray())
        } else {
            wakeWordManager.startListening()
            startForegroundVoiceService()
        }
    }

    private fun startForegroundVoiceService() {
        val serviceIntent = Intent(this, JarvisForegroundService::class.java).apply {
            action = JarvisForegroundService.ACTION_START
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent)
        } else {
            startService(serviceIntent)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        speechManager.destroy()
        wakeWordManager.stopListening()
    }
}
