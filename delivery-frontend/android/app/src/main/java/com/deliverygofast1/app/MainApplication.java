package com.deliverygofast1.app;

import android.app.Application;
import com.google.firebase.FirebaseApp;
import com.google.firebase.appcheck.FirebaseAppCheck;
import com.google.firebase.appcheck.playintegrity.PlayIntegrityAppCheckProviderFactory;
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
            
            // Inicializar App Check con Play Integrity
            FirebaseAppCheck firebaseAppCheck = FirebaseAppCheck.getInstance();
            firebaseAppCheck.installAppCheckProviderFactory(
                PlayIntegrityAppCheckProviderFactory.getInstance()
            );
            Log.d(TAG, "✅ Firebase App Check inicializado con Play Integrity");
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Error al inicializar Firebase/App Check: " + e.getMessage(), e);
        }
    }
}
