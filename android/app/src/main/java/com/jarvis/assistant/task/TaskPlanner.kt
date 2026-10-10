package com.jarvis.assistant.task

import com.jarvis.assistant.automation.IntentRouter
import com.jarvis.assistant.model.ActionRiskLevel
import com.jarvis.assistant.model.ExecutionResult
import com.jarvis.assistant.model.JarvisAction
import com.jarvis.assistant.model.JarvisActionPlan
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

class TaskPlanner(private val intentRouter: IntentRouter) {

    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())
    private var activeJob: Job? = null

    private val _currentExecutingAction = MutableStateFlow<JarvisAction?>(null)
    val currentExecutingAction: StateFlow<JarvisAction?> = _currentExecutingAction

    private val _executionLogs = MutableStateFlow<List<String>>(emptyList())
    val executionLogs: StateFlow<List<String>> = _executionLogs

    fun log(message: String) {
        _executionLogs.value = _executionLogs.value + "[${System.currentTimeMillis() % 100000}] $message"
    }

    /**
     * Executes multi-step plan sequentially with confirmation checkpoints and timeouts.
     */
    fun executePlan(
        plan: JarvisActionPlan,
        onRequireConfirmation: (JarvisAction, String) -> Unit,
        onComplete: (Boolean, String) -> Unit
    ) {
        cancelCurrentTask()

        activeJob = scope.launch {
            log("Executing Action Plan (${plan.actions.size} tasks)")
            var allSucceeded = true
            var finalMessage = plan.spokenResponse

            for ((index, action) in plan.actions.withIndex()) {
                _currentExecutingAction.value = action
                log("Task ${index + 1}/${plan.actions.size}: ${action.type} -> ${action.target}")

                // High risk check requires confirmation
                if (action.requiresConfirmation || action.riskLevel == ActionRiskLevel.HIGH) {
                    val prompt = if (action.confirmationPrompt.isNotBlank()) {
                        action.confirmationPrompt
                    } else {
                        "Sir, confirm execution of ${action.type} for ${action.target}?"
                    }
                    onRequireConfirmation(action, prompt)
                    return@launch
                }

                // Execute with safe timeout
                try {
                    val result = withTimeout(6000L) {
                        intentRouter.routeAndExecute(action)
                    }

                    when (result) {
                        is ExecutionResult.Success -> {
                            log("Task ${index + 1} Succeeded: ${result.message}")
                            finalMessage = result.message
                        }
                        is ExecutionResult.Failure -> {
                            log("Task ${index + 1} Failed: ${result.error}")
                            allSucceeded = false
                            finalMessage = "Sir, step ${index + 1} failed: ${result.error}"
                            break
                        }
                        is ExecutionResult.AwaitingConfirmation -> {
                            onRequireConfirmation(result.action, result.prompt)
                            return@launch
                        }
                    }
                } catch (e: TimeoutCancellationException) {
                    log("Task ${index + 1} Timed out.")
                    allSucceeded = false
                    finalMessage = "Task timed out during execution, Sir."
                    break
                }

                delay(300) // Brief pause between multi-step tasks
            }

            _currentExecutingAction.value = null
            onComplete(allSucceeded, finalMessage)
        }
    }

    /**
     * Resumes an action after user confirms.
     */
    fun executeConfirmedAction(action: JarvisAction, onComplete: (Boolean, String) -> Unit) {
        scope.launch {
            log("Executing Confirmed Action: ${action.type}")
            val result = intentRouter.routeAndExecute(action.copy(requiresConfirmation = false))
            when (result) {
                is ExecutionResult.Success -> {
                    log("Action Success: ${result.message}")
                    onComplete(true, result.message)
                }
                is ExecutionResult.Failure -> {
                    log("Action Failed: ${result.error}")
                    onComplete(false, result.error)
                }
                else -> onComplete(false, "Unknown confirmation state")
            }
        }
    }

    fun cancelCurrentTask() {
        activeJob?.cancel()
        activeJob = null
        _currentExecutingAction.value = null
        log("Ongoing task cancelled.")
    }
}
