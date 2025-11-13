/**
 * Script de prueba para el sistema de geofencing
 * Prueba el endpoint público /api/geolocation/check-coverage
 * 
 * Uso:
 * node test-geofencing.js
 */

const API_URL = process.env.API_URL || 'http://localhost:3000';

async function testGeofencing() {
  console.log('🧪 PRUEBA DE SISTEMA DE GEOFENCING\n');
  console.log(`API URL: ${API_URL}\n`);

  // Coordenadas de prueba basadas en coverage.geojson
  // Tu polígono está en Jaén, Perú (aproximadamente -5.63, -78.53)
  const testCases = [
    {
      name: 'Centro de la zona de cobertura (Jaén)',
      latitude: -5.636,
      longitude: -78.532,
      expectedInside: true,
    },
    {
      name: 'Cerca del borde (dentro)',
      latitude: -5.640,
      longitude: -78.528,
      expectedInside: true,
    },
    {
      name: 'Fuera de la zona (norte)',
      latitude: -5.600,
      longitude: -78.532,
      expectedInside: false,
    },
    {
      name: 'Fuera de la zona (sur)',
      latitude: -5.700,
      longitude: -78.532,
      expectedInside: false,
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    console.log(`\n📍 Probando: ${testCase.name}`);
    console.log(`   Coordenadas: (${testCase.latitude}, ${testCase.longitude})`);

    try {
      const response = await fetch(`${API_URL}/geolocation/check-coverage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: testCase.latitude,
          longitude: testCase.longitude,
        }),
      });

      const result = await response.json();

      console.log(`   Respuesta:`, result);

      if (result.isInCoverage === testCase.expectedInside) {
        console.log(`   ✅ PASÓ - Resultado esperado`);
        passed++;
      } else {
        console.log(`   ❌ FALLÓ - Se esperaba isInCoverage: ${testCase.expectedInside}`);
        failed++;
      }
    } catch (error) {
      console.log(`   ❌ ERROR:`, error.message);
      failed++;
    }
  }

  console.log('\n\n📊 RESUMEN DE PRUEBAS:');
  console.log(`   ✅ Pasadas: ${passed}`);
  console.log(`   ❌ Falladas: ${failed}`);
  console.log(`   Total: ${testCases.length}\n`);

  if (failed === 0) {
    console.log('🎉 ¡Todas las pruebas pasaron exitosamente!');
  } else {
    console.log('⚠️ Algunas pruebas fallaron. Revisa la configuración del polígono en coverage.geojson');
  }
}

// Ejecutar pruebas
testGeofencing().catch(console.error);
