Geofencing para Aplicaciones Ionic/Angular

Sistema de Zona de Cobertura (Puntual/Validación): Esta funcionalidad es un control de autorización y lógica de negocio para "evitar que otras personas ajenas a la ciudad puedan hacer pedidos". Es un sistema de validación de punto en el tiempo (point-in-time) que debe ser verificado de forma segura. El flujo de datos es: App del Cliente (Solicitud de Pedido) $\rightarrow$ API (Endpoint de Validación) $\rightarrow$ Backend (Autoridad de Geofencing) $\rightarrow$ Respuesta (Aprobado/Denegado).

Actores del Sistema y Flujos de Datos
App del Cliente (Ionic/Angular): El actor que consume datos.

Rol de Geofencing: Obtiene su ubicación una vez al realizar el pedido (usando getCurrentPosition) y la envía al backend para su validación.
Autoridad de Backend (p.ej., Node.js + Firebase): El núcleo del sistema.

Rol de Geofencing: Almacena el polígono de cobertura autoritativo (p.ej., como un archivo GeoJSON) y expone un endpoint de API seguro (p.ej., /api/check-coverage) para validar las coordenadas del cliente.

Diagrama de Flujo de DatosFlujo de Pedido (Geofencing y Validación):Cliente.ionViewWillEnter $\rightarrow$ Capacitor.Geolocation.getCurrentPosition()Cliente.placeOrder(lat, lng) $\rightarrow$ POST /api/check-coverageBackend: turf.booleanPointInPolygon([lng, lat], polygon)Backend $\rightarrow$ Respuesta 200 (OK) o 403 (Fuera de Cobertura)

Sección VI. Diseño e Implementación de la Zona de Cobertura (Geofencing)
Esta sección aborda el segundo requisito: definir la "zona de cobertura" de la ciudad.

Paso 1: Definir el Formato de Datos del Polígono de Cobertura
La cobertura de una ciudad no es un círculo simple; es un polígono complejo. Se necesita un formato de datos estándar para almacenar esta forma.

KML (Keyhole Markup Language): Un formato basado en XML utilizado por Google Earth.

GeoJSON: Un estándar abierto (RFC 7946) basado en JSON, diseñado para representar características geográficas. Es el formato nativo para la mayoría de las herramientas de JavaScript, incluidas Leaflet y Turf.js , y es generalmente más flexible que KML.

Decisión Arquitectónica: Utilizar GeoJSON. Es el estándar de facto para aplicaciones web y móviles modernas. Un polígono GeoJSON se ve así:

JSON
{
"type": "Feature",
"geometry": {
"type": "Polygon",
"coordinates": [
[ -73.98, 40.74 ], // Punto 1 (Longitud, Latitud)
[ -73.99, 40.75 ], // Punto 2
[ -73.97, 40.76 ], // Punto 3
[ -73.98, 40.74 ] // Volver al Punto 1
]
}
}
Paso 2: Crear el Polígono de Cobertura (coverage.geojson)
El desarrollador no necesita codificar este archivo manualmente. Se puede crear visualmente.

Herramienta Recomendada: geojson.io Se trata de una herramienta web gratuita, simple y eficaz para crear datos espaciales.

Tutorial de Creación :

Visite geojson.io en un navegador.

Navegue a la ciudad deseada.

Utilice las herramientas de dibujo (icono de polígono) en la barra lateral para hacer clic y trazar el límite de su zona de entrega.

A medida que dibuja, el código GeoJSON se genera automáticamente en el panel derecho.

Cuando termine, haga clic en el menú "Save" y seleccione "GeoJSON".

Guarde este archivo como coverage.geojson en su proyecto de backend.

Método Alternativo:

Dibujar el polígono en "Google My Maps".

Exportar la capa como KML.

Utilizar una herramienta en línea (como kml-to-geojson) para convertir el KML a formato GeoJSON.

Paso 3: Almacenar el Polígono de Cobertura
El archivo coverage.geojson resultante es el "mapa" autoritativo de su zona de negocio. Debe almacenarse en el Backend.

Puede ser un archivo estático (.json) cargado en la memoria por el servidor Node.js cuando se inicia, o un documento almacenado en una colección de configuración en Firestore (p.ej., config/coverage_area).

Sección VII. Validación de Geofencing Segura y del Lado del Servidor
Este es el componente más crítico para la lógica de negocio de "evitar pedidos".

El Imperativo de Seguridad: Por Qué la Validación en el Cliente Fracasa
Es tentador implementar la lógica de geofencing en el cliente. El desarrollador podría:

Enviar el archivo coverage.geojson a la app Ionic/Angular.

Obtener la ubicación del usuario con getCurrentPosition.

Usar una biblioteca de JavaScript (como Turf.js o la biblioteca de Google Maps) para verificar si el punto está dentro del polígono.

Si true, habilitar el botón "Realizar Pedido".

Esta arquitectura es fundamentalmente insegura y debe evitarse. Como se señaló en los foros , la seguridad del lado del cliente es "totalmente infructuosa". Un atacante puede:

Usar una aplicación de "ubicación simulada" (mock location) en Android para falsificar su GPS.

Simplemente interceptar el tráfico de red o parchear el código JavaScript de la aplicación para saltarse la verificación if (isInside) y llamar directamente a la función de realizar pedido.

La lógica de negocio que impide que un usuario gaste dinero o solicite un servicio debe residir en el servidor. La App del Cliente no puede tener la autoridad para decidir si está o no en la zona de cobertura; solo puede solicitar la validación al servidor.

Implementación de Backend (Node.js + Turf.js)
Esta es la solución de "Autoridad de Geofencing" segura. Se utiliza la biblioteca ligera Turf.js para el análisis geoespacial del lado del servidor.

Configuración: npm install express @turf/turf.

Código del Servidor (Node.js/Express) :

JavaScript
const express = require('express');
const fs = require('fs');
const turf = require('@turf/turf');

// Cargar el polígono de cobertura autoritativo en la memoria al iniciar
const coverageGeoJSON = JSON.parse(fs.readFileSync('./coverage.geojson'));
// Extraer solo el polígono para Turf.js
const coveragePolygon = coverageGeoJSON.features.geometry;

const app = express();
app.use(express.json());

// El endpoint de API de validación segura
app.post('/api/check-coverage-and-place-order', (req, res) => {
// Asumir que el usuario ha sido autenticado (p.ej., con un token JWT)
const { latitude, longitude } = req.body.location;

if (!latitude ||!longitude) {
return res.status(400).send({ message: 'Coordenadas de ubicación requeridas.' });
}

// Crear un punto GeoJSON a partir de las coordenadas del cliente
// ¡ADVERTENCIA CRÍTICA: Turf.js y GeoJSON usan [Longitud, Latitud]!
const userPoint = turf.point([longitude, latitude]); // [30, 38]

// La comprobación de seguridad crítica
const isInside = turf.booleanPointInPolygon(userPoint, coveragePolygon); //

if (!isInside) {
// Lógica de negocio: Rechazar el pedido
return res.status(403).send({
message: 'Ubicación fuera de la zona de cobertura.'
});
}

// Si está dentro, proceder a crear el pedido en la base de datos...
// const order = await createOrder(...);
res.status(200).send({ message: 'Pedido creado exitosamente.' });
});

app.listen(3000, () => console.log('Servidor de geofencing en ejecución'));
Este diseño garantiza que un pedido solo pueda crearse si el servidor verifica la ubicación.

Mejora de la UX del Lado del Cliente (Opcional)
Si bien la seguridad debe estar en el backend, la experiencia del usuario (UX) puede mejorarse en el frontend. Es una mala UX permitir que un usuario llene un carrito de compras solo para ser rechazado al final.

Podemos usar una biblioteca del lado del cliente solo para mostrar una advertencia visual (p.ej., "Estás fuera del área de servicio"), pero el botón de pedido final aún debe llamar al endpoint seguro del backend.

Método: Google Maps Geometry Library La API de Google Maps JavaScript puede cargar una biblioteca adicional geometry que incluye la función containsLocation.

Carga de la Biblioteca :

TypeScript
// En su servicio de carga de Google Maps
import { Loader } from '@googlemaps/js-api-loader';

let geometryLib;
async loadGoogleMaps() {
const loader = new Loader({
apiKey: 'YOUR_API_KEY',
libraries: ['geometry'] // Solicitar la biblioteca
});
await loader.load();
// Importar la biblioteca después de la carga
geometryLib = await google.maps.importLibrary('geometry');
}
Uso :

TypeScript
// Asumiendo que 'googleMapPolygon' es un objeto google.maps.Polygon
// y 'userLatLng' es un objeto google.maps.LatLng

// Esta función está ahora disponible:
const isInside = geometryLib.poly.containsLocation(userLatLng, googleMapPolygon);

if (isInside) {
// Mostrar UI: "Estás en la zona de servicio"
} else {
// Mostrar UI: "Advertencia: Estás fuera de la zona de cobertura"
}
