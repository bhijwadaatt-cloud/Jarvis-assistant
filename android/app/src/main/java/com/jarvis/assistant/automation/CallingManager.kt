package com.jarvis.assistant.automation

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import androidx.core.content.ContextCompat

class CallingManager(private val context: Context) {

    fun hasDirectCallPermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            context,
            android.Manifest.permission.CALL_PHONE
        ) == PackageManager.PERMISSION_GRANTED
    }

    /**
     * Opens dialer with the phone number filled in (Safe default, no special permission needed).
     */
    fun openDialer(phoneNumber: String): Boolean {
        return try {
            val cleanNumber = phoneNumber.replace(Regex("[^0-9+]"), "")
            val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:$cleanNumber")).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
            true
        } catch (e: Exception) {
            false
        }
    }

    /**
     * Initiates direct phone call if CALL_PHONE permission is granted.
     */
    fun initiateDirectCall(phoneNumber: String): Boolean {
        if (!hasDirectCallPermission()) {
            // Fallback to dialer if direct call permission not granted
            return openDialer(phoneNumber)
        }

        return try {
            val cleanNumber = phoneNumber.replace(Regex("[^0-9+]"), "")
            val intent = Intent(Intent.ACTION_CALL, Uri.parse("tel:$cleanNumber")).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
            true
        } catch (e: Exception) {
            openDialer(phoneNumber)
        }
    }
}
