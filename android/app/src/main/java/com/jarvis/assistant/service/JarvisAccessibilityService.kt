package com.jarvis.assistant.service

import android.accessibilityservice.AccessibilityService
import android.os.Bundle
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

class JarvisAccessibilityService : AccessibilityService() {

    private val tag = "JarvisA11yService"

    companion object {
        var instance: JarvisAccessibilityService? = null
            private set

        val isServiceRunning: Boolean
            get() = instance != null
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        Log.i(tag, "Jarvis Accessibility Automation Service connected.")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        // Monitors screen state changes for requested automation tasks
    }

    override fun onInterrupt() {
        Log.w(tag, "Jarvis Accessibility Service interrupted.")
    }

    override fun onDestroy() {
        super.onDestroy()
        instance = null
    }

    /**
     * Types text into a targeted input field by searching visible view hierarchy.
     */
    fun typeTextIntoCurrentInput(textToType: String): Boolean {
        val rootNode = rootInActiveWindow ?: return false
        val editableNode = findEditableNode(rootNode)

        return if (editableNode != null) {
            val arguments = Bundle().apply {
                putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, textToType)
            }
            val success = editableNode.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, arguments)
            editableNode.recycle()
            success
        } else {
            false
        }
    }

    private fun findEditableNode(node: AccessibilityNodeInfo): AccessibilityNodeInfo? {
        if (node.isEditable) return node

        for (i in 0 until node.childCount) {
            val child = node.getChild(i) ?: continue
            val result = findEditableNode(child)
            if (result != null) return result
            child.recycle()
        }
        return null
    }

    /**
     * Clicks a button by visible text or content description (e.g. "Send", "Search").
     */
    fun clickButtonByText(buttonText: String): Boolean {
        val rootNode = rootInActiveWindow ?: return false
        val nodes = rootNode.findAccessibilityNodeInfosByText(buttonText)

        for (node in nodes) {
            if (node.isClickable) {
                val success = node.performAction(AccessibilityNodeInfo.ACTION_CLICK)
                node.recycle()
                return success
            }
            var parent = node.parent
            while (parent != null) {
                if (parent.isClickable) {
                    val success = parent.performAction(AccessibilityNodeInfo.ACTION_CLICK)
                    parent.recycle()
                    return success
                }
                parent = parent.parent
            }
            node.recycle()
        }
        return false
    }
}
