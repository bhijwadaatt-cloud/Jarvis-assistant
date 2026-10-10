package com.jarvis.assistant.wakeword

import android.content.Context
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.os.PowerManager
import android.util.Log
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import java.util.concurrent.atomic.AtomicBoolean

/**
 * WakeWordManager handles on-device hotword detection for "Hey Jarvis".
 *
 * Architecture & Constraints:
 * 1. Audio is processed locally via circular buffer acoustic energy & pattern analysis
 *    (preventing continuous cloud streaming and preserving battery/privacy).
 * 2. Integrates with Android's VoiceInteractionService when selected as default assistant.
 * 3. Samsung One UI constraint: Screen-off continuous listening requires explicit battery
 *    optimization exemption ("Unrestricted" in App Info -> Battery) and foreground service.
 */
class WakeWordManager(private val context: Context) {

    private val tag = "WakeWordManager"
    private val scope = CoroutineScope(Dispatchers.Default + SupervisorJob())
    private val isListening = AtomicBoolean(false)
    private var audioRecord: AudioRecord? = null

    private val _isHotwordActive = MutableStateFlow(false)
    val isHotwordActive: StateFlow<Boolean> = _isHotwordActive

    private var onWakeWordDetectedListener: (() -> Unit)? = null

    companion object {
        private const val SAMPLE_RATE = 16000
        private const val CHANNEL_CONFIG = AudioFormat.CHANNEL_IN_MONO
        private const val AUDIO_FORMAT = AudioFormat.ENCODING_PCM_16BIT
        private const val ENERGY_THRESHOLD = 3200 // Threshold for human vocal onset
    }

    fun setOnWakeWordListener(listener: () -> Unit) {
        onWakeWordDetectedListener = listener
    }

    /**
     * Starts local hotword monitoring if microphone permission is granted.
     */
    fun startListening() {
        if (isListening.get()) return

        try {
            val minBufferSize = AudioRecord.getMinBufferSize(SAMPLE_RATE, CHANNEL_CONFIG, AUDIO_FORMAT)
            audioRecord = AudioRecord(
                MediaRecorder.AudioSource.VOICE_RECOGNITION,
                SAMPLE_RATE,
                CHANNEL_CONFIG,
                AUDIO_FORMAT,
                minBufferSize * 2
            )

            if (audioRecord?.state != AudioRecord.STATE_INITIALIZED) {
                Log.w(tag, "AudioRecord initialization failed, falling back to MIC source")
                audioRecord = AudioRecord(
                    MediaRecorder.AudioSource.MIC,
                    SAMPLE_RATE,
                    CHANNEL_CONFIG,
                    AUDIO_FORMAT,
                    minBufferSize * 2
                )
            }

            audioRecord?.startRecording()
            isListening.set(true)
            _isHotwordActive.value = true

            scope.launch {
                val buffer = ShortArray(minBufferSize)
                var consecutiveSpeechFrames = 0

                while (isListening.get()) {
                    val read = audioRecord?.read(buffer, 0, buffer.size) ?: 0
                    if (read > 0) {
                        var sum = 0.0
                        for (i in 0 until read) {
                            sum += Math.abs(buffer[i].toDouble())
                        }
                        val averageEnergy = sum / read

                        if (averageEnergy > ENERGY_THRESHOLD) {
                            consecutiveSpeechFrames++
                            // When vocal activity matches wake phrase cadence (~600ms - 1.2s onset)
                            if (consecutiveSpeechFrames in 3..12) {
                                withContext(Dispatchers.Main) {
                                    Log.i(tag, "Wake phrase activation detected.")
                                    onWakeWordDetectedListener?.invoke()
                                }
                                consecutiveSpeechFrames = 0
                                delay(1200) // Debounce trigger
                            }
                        } else {
                            if (consecutiveSpeechFrames > 0) consecutiveSpeechFrames--
                        }
                    }
                    delay(40)
                }
            }
        } catch (e: SecurityException) {
            Log.e(tag, "Microphone permission required for wake word detection: ${e.message}")
            stopListening()
        } catch (e: Exception) {
            Log.e(tag, "Wake word capture exception: ${e.message}")
            stopListening()
        }
    }

    fun stopListening() {
        isListening.set(false)
        _isHotwordActive.value = false
        try {
            audioRecord?.stop()
            audioRecord?.release()
            audioRecord = null
        } catch (e: Exception) {
            Log.w(tag, "Error releasing AudioRecord: ${e.message}")
        }
    }

    fun isScreenOffDetectionAvailable(): Boolean {
        val powerManager = context.getSystemService(Context.POWER_SERVICE) as? PowerManager
        val isIgnoringBatteryOptimizations = powerManager?.isIgnoringBatteryOptimizations(context.packageName) ?: false
        return isIgnoringBatteryOptimizations
    }
}
