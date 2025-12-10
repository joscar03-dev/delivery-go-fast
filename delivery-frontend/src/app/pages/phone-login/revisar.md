Instrucciones para Gradle
|
UnityC++
tip:
¿Todavía usas la sintaxis buildscript para administrar complementos? Aprende a agregar complementos de Firebase con esa sintaxis.
Para que los SDK de Firebase puedan acceder a los valores de configuración de google-services.json, necesitas el complemento Gradle de los servicios de Google.

DSL de Kotlin (build.gradle.kts)

Groovy (build.gradle)
Agrega el complemento como una dependencia a tu archivo build.gradle de nivel de proyecto:

Archivo de Gradle de nivel de raíz (nivel de proyecto) (<project>/build.gradle):
plugins {
// ...

// Add the dependency for the Google services Gradle plugin
id 'com.google.gms.google-services' version '4.4.4' apply false

}
Luego, en el archivo build.gradle del módulo (nivel de la app), agrega el complemento google-services y cualquier SDK de Firebase que quieras usar en tu app:

Archivo de Gradle del módulo (nivel de app) (<project>/<app-module>/build.gradle):
plugins {
id 'com.android.application'

// Add the Google services Gradle plugin
id 'com.google.gms.google-services'

...
}

dependencies {
// Import the Firebase BoM
implementation platform('com.google.firebase:firebase-bom:34.6.0')

// TODO: Add the dependencies for Firebase products you want to use
// When using the BoM, don't specify versions in Firebase dependencies
implementation 'com.google.firebase:firebase-analytics'

// Add the dependencies for any other desired Firebase products
// https://firebase.google.com/docs/android/setup#available-libraries
}
Si usas la BoM de Firebase para Android, tu app siempre utilizará versiones compatibles de la biblioteca de Firebase. Más información
Después de agregar el complemento y los SDK deseados, sincroniza tu proyecto de Android con archivos de Gradle.
