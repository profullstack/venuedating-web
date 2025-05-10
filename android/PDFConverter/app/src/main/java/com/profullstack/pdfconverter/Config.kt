package com.profullstack.pdfconverter

import android.content.Context
import java.io.File
import java.io.FileInputStream
import java.util.Properties

object Config {
    // Default fallback URL
    private const val DEFAULT_API_BASE_URL = "https://profullstack.com/pdf"
    
    // Get API base URL from .env file
    fun getApiBaseUrl(context: Context): String {
        try {
            // Try to find the .env file in the project root
            // First, try to find it relative to the app's files directory
            val appDir = context.filesDir.parentFile?.parentFile?.parentFile?.parentFile?.parentFile
            val envFile = File(appDir, ".env")
            
            if (envFile.exists()) {
                return parseEnvFile(envFile)
            }
            
            // If not found, try to find it in external storage (for development)
            val externalDir = context.getExternalFilesDir(null)?.parentFile?.parentFile?.parentFile?.parentFile
            val externalEnvFile = File(externalDir, ".env")
            
            if (externalEnvFile.exists()) {
                return parseEnvFile(externalEnvFile)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        
        // Return default URL if .env file not found or error occurs
        return DEFAULT_API_BASE_URL
    }
    
    private fun parseEnvFile(envFile: File): String {
        val properties = Properties()
        FileInputStream(envFile).use { input ->
            properties.load(input)
        }
        
        // Get API_BASE_URL from properties
        val apiBaseUrl = properties.getProperty("API_BASE_URL")
        
        // Return the URL if found, otherwise return default
        return apiBaseUrl ?: DEFAULT_API_BASE_URL
    }
}