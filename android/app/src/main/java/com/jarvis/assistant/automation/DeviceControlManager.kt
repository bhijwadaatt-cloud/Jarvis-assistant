package com.jarvis.assistant.automation

import android.content.Context
import android.content.Intent
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraManager
import android.media.AudioManager
import android.os.BatteryManager
import android.os.Build
import android.provider.MediaStore
import android.provider.Settings
import android.util.Log

class DeviceControlManager(private val context: Context) {

    private val tag = "DeviceControlManager"
    private val cameraManager = context.getSystemService(Context.CAMERA_SERVICE) as? CameraManager
    private val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as? AudioManager

    /**
     * Toggles hardware flashlight / torch via CameraManager.
     */
    fun setFlashlight(enabled: Boolean): Pair<Boolean, String> {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M || cameraManager == null) {
            return Pair(false, "Flashlight control is unsupported on this Android version.")
        }

        return try {
            val cameraId = cameraManager.cameraIdList.firstOrNull { id ->
                val characteristics = cameraManager.getCameraCharacteristics(id)
                characteristics.get(CameraCharacteristics.FLASH_INFO_AVAILABLE) == true
            }

            if (cameraId != null) {
                cameraManager.setTorchMode(cameraId, enabled)
                val state = if (enabled) "on" else "off"
                Pair(true, "Flashlight turned $state, Sir.")
            } else {
                Pair(false, "No compatible flashlight hardware discovered.")
            }
        } catch (e: Exception) {
            Log.e(tag, "Torch toggle error: ${e.message}")
            Pair(false, "Unable to adjust flashlight hardware: ${e.message}")
        }
    }

    /**
     * Reads battery telemetry.
     */
    fun getBatteryStatus(): String {
        val batteryManager = context.getSystemService(Context.BATTERY_SERVICE) as? BatteryManager
        val level = batteryManager?.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY) ?: -1
        val isCharging = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val status = batteryManager?.getIntProperty(BatteryManager.BATTERY_PROPERTY_STATUS)
            status == BatteryManager.BATTERY_STATUS_CHARGING || status == BatteryManager.BATTERY_STATUS_FULL
        } else false

        return if (level >= 0) {
            "Sir, current battery level is $level%${if (isCharging) ", and the device is currently charging." else "."}"
        } else {
            "Sir, device battery telemetry is unavailable."
        }
    }

    /**
     * Adjusts media volume.
     */
    fun adjustVolume(increase: Boolean): Boolean {
        val direction = if (increase) AudioManager.ADJUST_RAISE else AudioManager.ADJUST_LOWER
        return try {
            audioManager?.adjustStreamVolume(AudioManager.STREAM_MUSIC, direction, AudioManager.FLAG_SHOW_UI)
            true
        } catch (e: Exception) {
            false
        }
    }

    /**
     * Opens native settings pages.
     */
    fun openSettingsPage(page: String): Boolean {
        val action = when (page.lowercase()) {
            "wifi" -> Settings.ACTION_WIFI_SETTINGS
            "bluetooth" -> Settings.ACTION_BLUETOOTH_SETTINGS
            "display" -> Settings.ACTION_DISPLAY_SETTINGS
            "notifications" -> Settings.ACTION_NOTIFICATION_SETTINGS
            "accessibility" -> Settings.ACTION_ACCESSIBILITY_SETTINGS
            else -> Settings.ACTION_SETTINGS
        }

        return try {
            val intent = Intent(action).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
            true
        } catch (e: Exception) {
            false
        }
    }

    /**
     * Launches camera.
     */
    fun openCamera(): Boolean {
        return try {
            val intent = Intent(MediaStore.ACTION_IMAGE_CAPTURE).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
            true
        } catch (e: Exception) {
            false
        }
    }
}
