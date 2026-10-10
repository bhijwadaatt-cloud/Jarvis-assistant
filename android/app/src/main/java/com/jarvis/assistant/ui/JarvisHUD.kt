package com.jarvis.assistant.ui

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.MicOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.jarvis.assistant.model.JarvisAction
import kotlinx.coroutines.flow.StateFlow

@Composable
fun JarvisHUD(
    isListening: StateFlow<Boolean>,
    isSpeaking: StateFlow<Boolean>,
    rmsLevel: StateFlow<Float>,
    transcript: StateFlow<String>,
    statusText: StateFlow<String>,
    executionLogs: StateFlow<List<String>>,
    pendingConfirmation: StateFlow<Pair<JarvisAction, String>?>,
    onMicClick: () -> Unit,
    onCancelClick: () -> Unit,
    onConfirmAction: (JarvisAction) -> Unit,
    onDismissConfirmation: () -> Unit
) {
    val listening by isListening.collectAsState()
    val speaking by isSpeaking.collectAsState()
    val rms by rmsLevel.collectAsState()
    val currentTranscript by transcript.collectAsState()
    val status by statusText.collectAsState()
    val logs by executionLogs.collectAsState()
    val confirmation by pendingConfirmation.collectAsState()

    val cyanGlow = Color(0xFF00E5FF)
    val darkBg = Color(0xFF030712)
    val cardBg = Color(0xFF0F172A)

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = darkBg
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            // Top Status Bar
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "J.A.R.V.I.S. MARK-VII",
                    color = cyanGlow,
                    fontSize = 14.sp,
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = status,
                    color = if (listening) Color(0xFF10B981) else Color.Gray,
                    fontSize = 11.sp,
                    fontFamily = FontFamily.Monospace
                )
            }

            // Center: Animated Arc Reactor with Audio Waveform
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center,
                modifier = Modifier.padding(vertical = 24.dp)
            ) {
                ArcReactorCore(
                    isListening = listening,
                    isSpeaking = speaking,
                    rmsLevel = rms
                )

                Spacer(modifier = Modifier.height(24.dp))

                // Waveform Audio Bars
                AudioWaveformDisplay(
                    isListening = listening,
                    rmsLevel = rms
                )

                Spacer(modifier = Modifier.height(16.dp))

                // Live Transcript
                if (currentTranscript.isNotBlank() || listening) {
                    Text(
                        text = if (currentTranscript.isNotBlank()) "\"$currentTranscript\"" else "Listening for directive...",
                        color = Color.White,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Medium,
                        textAlign = TextAlign.Center,
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 24.dp)
                    )
                }
            }

            // Bottom Section: Execution Console & Controls
            Column(
                modifier = Modifier.fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Task Console Log Window
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(130.dp)
                        .background(cardBg, RoundedCornerShape(16.dp))
                        .border(1.dp, cyanGlow.copy(alpha = 0.3f), RoundedCornerShape(16.dp))
                        .padding(12.dp)
                ) {
                    LazyColumn(
                        reverseLayout = true,
                        modifier = Modifier.fillMaxSize()
                    ) {
                        items(logs.reversed()) { logEntry ->
                            Text(
                                text = "> $logEntry",
                                color = cyanGlow.copy(alpha = 0.85f),
                                fontSize = 11.sp,
                                fontFamily = FontFamily.Monospace
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))

                // Action Buttons
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Cancel Button
                    IconButton(
                        onClick = onCancelClick,
                        modifier = Modifier
                            .size(54.dp)
                            .background(Color(0xFF1F2937), CircleShape)
                            .border(1.dp, Color.Gray.copy(alpha = 0.4f), CircleShape)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "Cancel Task",
                            tint = Color.LightGray
                        )
                    }

                    // Main Push-To-Talk Microphone Button
                    IconButton(
                        onClick = onMicClick,
                        modifier = Modifier
                            .size(76.dp)
                            .background(
                                Brush.radialGradient(
                                    listOf(cyanGlow.copy(alpha = 0.9f), Color(0xFF0284C7))
                                ),
                                CircleShape
                            )
                            .border(2.dp, cyanGlow, CircleShape)
                    ) {
                        Icon(
                            imageVector = if (listening) Icons.Default.Mic else Icons.Default.MicOff,
                            contentDescription = "Voice Directive",
                            tint = Color.Black,
                            modifier = Modifier.size(36.dp)
                        )
                    }
                }
            }
        }

        // Confirmation Alert Dialog for High-Risk Actions
        confirmation?.let { (action, prompt) ->
            AlertDialog(
                onDismissRequest = onDismissConfirmation,
                title = {
                    Text(
                        text = "JARVIS VERIFICATION REQUIRED",
                        color = cyanGlow,
                        fontFamily = FontFamily.Monospace,
                        fontSize = 14.sp
                    )
                },
                text = {
                    Text(text = prompt, color = Color.White)
                },
                confirmButton = {
                    Button(
                        onClick = { onConfirmAction(action) },
                        colors = ButtonDefaults.buttonColors(containerColor = cyanGlow)
                    ) {
                        Text(text = "AUTHORIZE", color = Color.Black, fontWeight = FontWeight.Bold)
                    }
                },
                dismissButton = {
                    TextButton(onClick = onDismissConfirmation) {
                        Text(text = "ABORT", color = Color.LightGray)
                    }
                },
                containerColor = cardBg,
                shape = RoundedCornerShape(20.dp)
            )
        }
    }
}

@Composable
fun ArcReactorCore(isListening: Boolean, isSpeaking: Boolean, rmsLevel: Float) {
    val infiniteTransition = rememberInfiniteTransition(label = "ArcPulse")
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = if (isListening) 1.15f else 1.05f,
        animationSpec = infiniteRepeatable(
            animation = tween(800, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "Pulse"
    )

    val audioFactor = 1f + (rmsLevel / 30f).coerceIn(0f, 0.4f)

    Box(
        modifier = Modifier
            .size(160.dp)
            .scale(pulseScale * audioFactor)
            .clip(CircleShape)
            .background(
                Brush.radialGradient(
                    colors = listOf(
                        Color(0xFF00E5FF).copy(alpha = 0.35f),
                        Color(0xFF0284C7).copy(alpha = 0.15f),
                        Color.Transparent
                    )
                )
            )
            .border(2.dp, Color(0xFF00E5FF).copy(alpha = 0.8f), CircleShape),
        contentAlignment = Alignment.Center
    ) {
        Box(
            modifier = Modifier
                .size(90.dp)
                .clip(CircleShape)
                .background(Color(0xFF030712))
                .border(2.dp, Color(0xFF38BDF8), CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Box(
                modifier = Modifier
                    .size(45.dp)
                    .clip(CircleShape)
                    .background(
                        if (isListening) Color(0xFF10B981)
                        else if (isSpeaking) Color(0xFF38BDF8)
                        else Color(0xFF00E5FF)
                    )
            )
        }
    }
}

@Composable
fun AudioWaveformDisplay(isListening: Boolean, rmsLevel: Float) {
    Row(
        horizontalArrangement = Arrangement.spacedBy(6.dp),
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier.height(30.dp)
    ) {
        val barCount = 7
        for (i in 0 until barCount) {
            val baseHeight = if (isListening) (rmsLevel * (i + 1) * 1.5f).coerceIn(4f, 28f) else 4f
            Box(
                modifier = Modifier
                    .width(4.dp)
                    .height(baseHeight.dp)
                    .clip(RoundedCornerShape(2.dp))
                    .background(Color(0xFF00E5FF))
            )
        }
    }
}
