package com.jarvis.assistant.automation

import android.content.Context
import android.content.Intent
import android.net.Uri
import java.net.URLEncoder

class MessagingManager(private val context: Context) {

    /**
     * Stages WhatsApp message for contact or phone number.
     */
    fun stageWhatsAppMessage(phoneNumber: String, messageText: String): Boolean {
        val cleanNumber = phoneNumber.replace(Regex("[^0-9]"), "")
        val encodedMessage = URLEncoder.encode(messageText, "UTF-8")

        return try {
            val uri = if (cleanNumber.isNotBlank()) {
                Uri.parse("https://wa.me/$cleanNumber?text=$encodedMessage")
            } else {
                Uri.parse("https://wa.me/?text=$encodedMessage")
            }
            val intent = Intent(Intent.ACTION_VIEW, uri).apply {
                setPackage("com.whatsapp")
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
            true
        } catch (e: Exception) {
            // WhatsApp app not present, try general browser fallback
            try {
                val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse("https://wa.me/$cleanNumber?text=$encodedMessage")).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                context.startActivity(browserIntent)
                true
            } catch (ex: Exception) {
                false
            }
        }
    }

    /**
     * Prepares native SMS message.
     */
    fun stageSmsMessage(phoneNumber: String, messageText: String): Boolean {
        val cleanNumber = phoneNumber.replace(Regex("[^0-9+]"), "")
        return try {
            val uri = Uri.parse("smsto:$cleanNumber")
            val intent = Intent(Intent.ACTION_SENDTO, uri).apply {
                putExtra("sms_body", messageText)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
            true
        } catch (e: Exception) {
            false
        }
    }
}
