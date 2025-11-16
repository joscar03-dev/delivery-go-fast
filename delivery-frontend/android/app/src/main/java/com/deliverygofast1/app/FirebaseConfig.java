package com.deliverygofast1.app;

import android.app.Application;
import com.google.firebase.FirebaseApp;
import android.util.Log;

public class FirebaseConfig {
    private static final String TAG = "FirebaseConfig";

    public static void initialize(Application application) {
        try {
            if (FirebaseApp.getApps(application).isEmpty()) {
                FirebaseApp.initializeApp(application);
                Log.d(TAG, "✅ Firebase inicializado correctamente");
            } else {
                Log.d(TAG, "✅ Firebase ya estaba inicializado");
            }
        } catch (Exception e) {
            Log.e(TAG, "❌ Error al inicializar Firebase: " + e.getMessage(), e);
        }
    }
}
