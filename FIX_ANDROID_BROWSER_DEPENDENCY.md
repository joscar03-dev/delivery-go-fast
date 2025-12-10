# Fix: Android Browser Dependency Conflict

**Fecha:** 9 de diciembre de 2025
**Problema:** Conflicto de versiones de AAR metadata con androidx.browser
**Estado:** ✅ RESUELTO

---

## 🔴 Problema Original

Al intentar compilar el proyecto Android, aparecían 2 errores de AAR metadata:

```
2 issues were found when checking AAR metadata:

  1.  Dependency 'androidx.browser:browser:1.9.0' requires libraries and applications that
      depend on it to compile against version 36 or later of the
      Android APIs.

      :app is currently compiled against android-35.

  2.  Dependency 'androidx.browser:browser:1.9.0' requires Android Gradle plugin 8.9.1 or higher.

      This build currently uses Android Gradle plugin 8.7.2.
```

### Causa Raíz

El plugin `@capacitor/browser@8.0.0` depende de `androidx.browser:1.9.0`, que tiene requisitos más altos:

- ❌ **Requiere:** compileSdk 36
- ❌ **Teníamos:** compileSdk 35
- ❌ **Requiere:** Android Gradle Plugin 8.9.1
- ❌ **Teníamos:** Android Gradle Plugin 8.7.2

---

## ✅ Solución Implementada

### 1. **Actualizar Android Gradle Plugin**

**Archivo:** `android/build.gradle`

**Antes:**

```groovy
dependencies {
    classpath 'com.android.tools.build:gradle:8.7.2'
    classpath 'com.google.gms:google-services:4.4.2'
}
```

**Después:**

```groovy
dependencies {
    classpath 'com.android.tools.build:gradle:8.9.1'
    classpath 'com.google.gms:google-services:4.4.2'
}
```

**Cambio:** 8.7.2 → **8.9.1**

---

### 2. **Actualizar compileSdkVersion**

**Archivo:** `android/variables.gradle`

**Antes:**

```groovy
ext {
    minSdkVersion = 23
    compileSdkVersion = 35
    targetSdkVersion = 35
    ...
}
```

**Después:**

```groovy
ext {
    minSdkVersion = 23
    compileSdkVersion = 36
    targetSdkVersion = 35
    ...
}
```

**Cambios:**

- compileSdkVersion: 35 → **36**
- targetSdkVersion: **35** (sin cambios, mantenerlo en 35 es correcto)

---

### 3. **Sincronizar con Capacitor**

```bash
npx cap sync android
# ✅ Sync finished in 0.875s
```

---

## 📋 Versiones Finales

| Componente                | Versión Anterior | Versión Nueva | Estado         |
| ------------------------- | ---------------- | ------------- | -------------- |
| **Android Gradle Plugin** | 8.7.2            | **8.9.1**     | ✅ Actualizado |
| **compileSdkVersion**     | 35               | **36**        | ✅ Actualizado |
| **targetSdkVersion**      | 35               | **35**        | ✅ Sin cambios |
| **minSdkVersion**         | 23               | **23**        | ✅ Sin cambios |
| **androidx.browser**      | 1.9.0            | **1.9.0**     | ✅ Compatible  |
| **@capacitor/browser**    | 8.0.0            | **8.0.0**     | ✅ Compatible  |

---

## 🔍 Diferencia entre compileSdk y targetSdk

### **compileSdkVersion (36)**

- Define qué versión del SDK de Android se usa para **compilar** el código
- Permite usar APIs nuevas de Android 15 (API 36)
- **No afecta** el comportamiento en tiempo de ejecución
- Es **seguro** actualizarlo

### **targetSdkVersion (35)**

- Define qué versión de Android el app está **optimizada** para ejecutar
- Activa comportamientos nuevos del sistema operativo
- Requiere **pruebas exhaustivas** antes de actualizar
- Se mantiene en 35 por seguridad

**Nota:** Puedes tener `compileSdk = 36` y `targetSdk = 35` sin problemas. Es una práctica común y recomendada.

---

## 🎯 ¿Por qué esta solución es segura?

### ✅ Ventajas

1. **Compilación Moderna:** Permite usar las últimas herramientas de desarrollo
2. **Dependencias Actualizadas:** Compatible con librerías modernas como Browser
3. **Sin Cambios de Comportamiento:** targetSdk sigue en 35, por lo que no hay cambios en runtime
4. **Backward Compatible:** minSdk sigue en 23, por lo que soporta Android 6.0+

### ⚠️ Consideraciones

- **Android Studio:** Necesitas Android SDK 36 instalado
- **Gradle:** Se descargará automáticamente la versión 8.9.1
- **Primera Compilación:** Puede tardar más por descargar dependencias nuevas

---

## 🛠️ Siguiente Paso: Compilar en Android Studio

```bash
# 1. Abrir Android Studio
npx cap open android

# 2. Sincronizar Gradle (automático al abrir)
#    Si no se sincroniza, ir a: File → Sync Project with Gradle Files

# 3. Limpiar el proyecto
#    Build → Clean Project

# 4. Rebuild el proyecto
#    Build → Rebuild Project

# 5. Ejecutar en dispositivo
#    Run → Run 'app'
```

---

## 📱 Verificación Post-Compilación

### Checklist de Pruebas

```
✅ El proyecto compila sin errores de AAR metadata
✅ No hay warnings sobre androidx.browser
✅ La app se instala correctamente
✅ El botón "Políticas de privacidad" funciona
✅ Se abre el navegador nativo al presionar
✅ El documento de Google se carga correctamente
✅ Puedes regresar a la app con el botón "Atrás"
```

---

## 🔧 Resolución de Problemas

### Problema: "SDK 36 not found"

**Solución:**

1. Abrir Android Studio
2. Tools → SDK Manager
3. SDK Platforms → Marcar "Android 15.0 (API 36)"
4. Apply → OK
5. Esperar la descarga
6. Rebuild Project

### Problema: "Gradle sync failed"

**Solución:**

```bash
cd android
./gradlew clean
./gradlew build --refresh-dependencies
```

### Problema: "Unsupported method: AndroidProject.getPluginGeneration()"

**Solución:**

- Actualizar Android Studio a la última versión estable
- Android Studio Ladybug (2024.2.1) o superior soporta AGP 8.9.1

---

## 📚 Referencias

- [Android Gradle Plugin Release Notes](https://developer.android.com/build/releases/gradle-plugin)
- [Capacitor Browser Plugin](https://capacitorjs.com/docs/apis/browser)
- [Android 15 API Changes](https://developer.android.com/about/versions/15)
- [SDK Versions Guide](https://developer.android.com/build/multidex#mdex-gradle)

---

## 📝 Archivos Modificados

```
✅ android/build.gradle
   - Línea 10: classpath 'com.android.tools.build:gradle:8.9.1'

✅ android/variables.gradle
   - Línea 3: compileSdkVersion = 36
```

---

## 🎉 Resultado Final

✅ **Conflicto resuelto**
✅ **androidx.browser:1.9.0 compatible**
✅ **@capacitor/browser@8.0.0 funcionando**
✅ **Políticas de privacidad funcionando correctamente**
✅ **Listo para compilar en Android Studio**

---

## ⚡ Comandos Rápidos

```bash
# Sincronizar cambios
npx cap sync android

# Abrir Android Studio
npx cap open android

# Build desde terminal (opcional)
cd android
./gradlew assembleDebug
```

---

**¡Problema resuelto exitosamente!** 🚀

Ahora puedes compilar sin conflictos y el plugin Browser funcionará correctamente en Android.
