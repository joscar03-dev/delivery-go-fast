Este es un problema muy común y casi siempre se debe a un error en la lógica del flujo de programación en tu frontend, y no necesariamente a una falla de Firebase.

Firebase Authentication, por diseño, no sabe si un número de teléfono "ya tiene cuenta" o "es nuevo" en el momento de enviar el SMS. Su función es simplemente verificar que quien tiene el teléfono es quien dice ser.

Aquí te detallo las 3 causas más probables, ordenadas de la más común a la técnica:

1. El error de "Lógica Invertida" (La causa más probable)
   Es muy posible que en tu código estés intentando verificar si el usuario existe en tu base de datos (PostgreSQL/Backend) ANTES de pedirle a Firebase que envíe el SMS.

¿Qué está pasando probablemente? Tu código podría verse así conceptualmente:

Usuario ingresa teléfono.

Tu App consulta a tu API: "¿Existe este teléfono?"

Si existe: Llamas a signInWithPhoneNumber (Firebase envía SMS). -> Esto funciona.

Si NO existe: Tu código se detiene o entra en un bloque else que olvida llamar a signInWithPhoneNumber o intenta ir directo al formulario de registro sin verificar el teléfono primero.

La Solución: El flujo siempre debe ser este, sin importar si el usuario es nuevo o viejo:

Usuario ingresa teléfono.

INCONDICIONALMENTE llamas a signInWithPhoneNumber de Firebase.

El usuario recibe el SMS y lo ingresa.

Firebase te devuelve el objeto UserCredential.

AHORA (y solo ahora) verificas en tu Backend:

¿Este UserCredential.user.uid o phoneNumber existe en mi base de datos?

SÍ: Lo dejas pasar (Login).

NO: Le muestras el formulario para completar sus datos (Nombre, Dirección) y creas el registro (Sign Up).

2. Conflicto de Cuentas (Provider Conflict)
   Mencionas que tienes un registro "normal" (Teléfono + Contraseña). Firebase no tiene un método nativo de "Teléfono + Contraseña". Lo que probablemente estás haciendo es:

Método A: Creas un usuario de tipo "Email/Password" (usando un email falso como 51999999@tuapp.com) o guardas la contraseña en tu propia BD.

Método B: Usas el proveedor "Phone Provider".

Si un usuario se registró con el Método A y luego intenta entrar con el Método B, Firebase podría estar intentando crear una cuenta nueva para ese teléfono.

Sin embargo, esto no evitaría que llegue el SMS. El SMS llega, pero al poner el código fallaría el login diciendo auth/account-exists-with-different-credential o similar. Si el SMS no sale, volvemos al punto 1 o al punto 3.

3. Configuración de Seguridad (SHA-1 y App Check)
   Si estás probando en Android (especialmente si generaste una nueva APK firmada o cambiaste de computadora de desarrollo), Firebase bloquea el envío de SMS si no reconoce la firma de la aplicación.

Síntoma: El SMS no llega. En la consola (Logcat) verás un error como This request is missing a valid app identifier, meaning that neither SafetyNet checks nor reCAPTCHA checks succeeded.

¿Por qué funciona para los registrados? A veces, si el usuario ya tiene una sesión "sucia" o tokens cacheados, o si el flujo de "Login normal" valida la app de otra forma, puede parecer que funciona. Pero para un usuario nuevo (limpio), la seguridad es estricta.

Verifica esto:

Ve a la consola de Firebase > Configuración del Proyecto > General.

Asegúrate de que las huellas digitales SHA-1 y SHA-256 de tu clave de desarrollo (debug.keystore) y de producción estén agregadas.

Si estás usando un emulador, el SMS no llegará a menos que uses números de prueba definidos en la consola de Auth > Sign-in method > Phone.

Pasos para arreglarlo hoy mismo:
Paso 1: Revisa tu código (Angular/Ionic) Busca la función donde se hace clic en "Ingresar con teléfono". Asegúrate de que se vea algo así:

TypeScript

// INCORRECTO (Posible causa)
verificarUsuario(telefono) {
this.api.getUser(telefono).subscribe(user => {
if (user) {
this.firebaseAuth.signInWithPhoneNumber(telefono)... // Envía SMS
} else {
// AQUÍ ESTÁ EL ERROR: No envías SMS, solo mandas al formulario
this.router.navigate(['/registro-formulario']);
}
});
}

// CORRECTO
iniciarFlowTelefono(telefono) {
// 1. Primero verificamos el teléfono con Firebase (SIEMPRE)
this.firebaseAuth.signInWithPhoneNumber(telefono)
.then(confirmationResult => {
// 2. Pedimos el código al usuario
let code = prompt("Ingresa el código");
return confirmationResult.confirm(code);
})
.then(result => {
// 3. YA AUTENTICADO, ahora revisamos si existe en TU base de datos
this.chequearSiUsuarioExisteEnBackend(result.user);
})
.catch(error => console.error(error));
}

chequearSiUsuarioExisteEnBackend(firebaseUser) {
this.api.getByPhone(firebaseUser.phoneNumber).subscribe(
data => {
if(data) { login(); }
else { irAFormularioDeCreacion(firebaseUser); } // Pasas los datos pre-verificados
}
)
}
Paso 2: Logs Si estás seguro de que el código llama a signInWithPhoneNumber, abre el Logcat de Android Studio o la consola del navegador. Cuando intentas con un número nuevo y no llega el SMS, ¿Qué error sale en rojo?

Si dice quota-exceeded: Has superado el límite de pruebas.

Si dice missing-client-identifier: Falta el SHA-1 en Firebase.

Si dice internal-error: Error de configuración general.

¿Cuál de estos escenarios te suena más parecido a tu código actual?
