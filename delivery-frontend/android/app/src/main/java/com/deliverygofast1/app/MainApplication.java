package com.deliverygofast1.app;

import android.app.Application;
import com.google.firebase.FirebaseApp;
import android.util.Log;

public class MainApplication extends Application {
    private static final String TAG = "MainApplication";

    @Override
    public void onCreate() {
        super.onCreate();
        
        // Inicializar Firebase
        try {
            FirebaseApp.initializeApp(this);
            Log.d(TAG, "✅ Firebase inicializado en Application.onCreate()");
        } catch (Exception e) {
            Log.e(TAG, "❌ Error al inicializar Firebase: " + e.getMessage(), e);
        }
    }
}
