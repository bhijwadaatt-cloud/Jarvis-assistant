package com.jarvis.assistant.automation

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.util.Log

class AppLauncher(private val context: Context) {

    private val tag = "AppLauncher"
    private val packageManager: PackageManager = context.packageManager

    // Common game and app package aliases for Samsung / Android
    private val wellKnownAliases = mapOf(
        "free fire" to listOf("com.dts.freefireth", "com.dts.freefiremax"),
        "free fire max" to listOf("com.dts.freefiremax", "com.dts.freefireth"),
        "pubg" to listOf("com.pubg.imobile", "com.tencent.ig"),
        "bgmi" to listOf("com.pubg.imobile"),
        "youtube" to listOf("com.google.android.youtube"),
        "whatsapp" to listOf("com.whatsapp"),
        "instagram" to listOf("com.instagram.android"),
        "chrome" to listOf("com.android.chrome"),
        "spotify" to listOf("com.spotify.music"),
        "maps" to listOf("com.google.android.apps.maps"),
        "settings" to listOf("com.android.settings"),
        "camera" to listOf("com.sec.android.app.camera", "com.android.camera2"),
        "calculator" to listOf("com.sec.android.app.popupcalculator", "com.google.android.calculator")
    )

    /**
     * Resolves spoken name and launches application.
     * Returns true if application launched, false otherwise.
     */
    fun launchAppByName(spokenName: String): Pair<Boolean, String> {
        val cleanName = spokenName.lowercase().trim()

        // 1. Check known alias map
        for ((alias, packages) in wellKnownAliases) {
            if (cleanName.contains(alias) || alias.contains(cleanName)) {
                for (pkg in packages) {
                    val intent = packageManager.getLaunchIntentForPackage(pkg)
                    if (intent != null) {
                        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                        context.startActivity(intent)
                        return Pair(true, "Launching $alias, Sir.")
                    }
                }
            }
        }

        // 2. Query installed launcher apps with fuzzy matching
        val intent = Intent(Intent.ACTION_MAIN, null).apply {
            addCategory(Intent.CATEGORY_LAUNCHER)
        }
        val resolveInfoList = packageManager.queryIntentActivities(intent, 0)

        var bestMatchPackage: String? = null
        var bestMatchLabel: String? = null

        for (resolveInfo in resolveInfoList) {
            val appLabel = resolveInfo.loadLabel(packageManager).toString().lowercase()
            val packageName = resolveInfo.activityInfo.packageName

            if (appLabel == cleanName || appLabel.contains(cleanName) || cleanName.contains(appLabel)) {
                bestMatchPackage = packageName
                bestMatchLabel = appLabel
                break
            }
        }

        if (bestMatchPackage != null) {
            val launchIntent = packageManager.getLaunchIntentForPackage(bestMatchPackage)
            if (launchIntent != null) {
                launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                context.startActivity(launchIntent)
                return Pair(true, "Opening $bestMatchLabel on your device, Sir.")
            }
        }

        // 3. Fallback: App not found, offer Google Play Store search
        openPlayStoreSearch(cleanName)
        return Pair(false, "Application '$spokenName' is not installed, opening Google Play Store search.")
    }

    private fun openPlayStoreSearch(query: String) {
        try {
            val storeIntent = Intent(Intent.ACTION_VIEW, Uri.parse("market://search?q=$query")).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(storeIntent)
        } catch (e: Exception) {
            val webIntent = Intent(Intent.ACTION_VIEW, Uri.parse("https://play.google.com/store/search?q=$query")).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(webIntent)
        }
    }
}
