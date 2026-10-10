package com.jarvis.assistant.service

import android.content.ComponentName
import android.content.Context
import android.os.Bundle
import android.service.voice.VoiceInteractionService
import android.service.voice.VoiceInteractionSession
import android.service.voice.VoiceInteractionSessionService
import android.util.Log

/**
 * System Assistant integration allowing Jarvis to be set as the default
 * Android Assistant in Settings -> Default Apps -> Digital Assistant app.
 */
class JarvisAssistantService : VoiceInteractionService() {

    override fun onReady() {
        super.onReady()
        Log.i("JarvisAssistantService", "Jarvis default assistant service is ready.")
    }

    companion object {
        fun isJarvisDefaultAssistant(context: Context): Boolean {
            return isActiveService(
                context,
                ComponentName(context, JarvisAssistantService::class.java)
            )
        }
    }
}

class JarvisInteractionSessionService : VoiceInteractionSessionService() {
    override fun onNewSession(args: Bundle?): VoiceInteractionSession {
        return JarvisInteractionSession(this)
    }
}

class JarvisInteractionSession(context: Context) : VoiceInteractionSession(context) {
    override fun onShow(args: Bundle?, showFlags: Int) {
        super.onShow(args, showFlags)
        // Show assistant UI or start voice capture when triggered via home button hold / power button
        Log.i("JarvisSession", "Jarvis Assistant session shown with flags: $showFlags")
    }
}
