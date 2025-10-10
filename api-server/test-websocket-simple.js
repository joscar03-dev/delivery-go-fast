#!/usr/bin/env node

/**
 * Script para iniciar el servidor y realizar pruebas básicas de WebSocket
 * Uso: node test-websocket-simple.js [token]
 */

const { spawn } = require('child_process');
const { io } = require('socket.io-client');

class SimpleWebSocketTester {
  constructor() {
    this.serverProcess = null;
    this.socket = null;
    this.serverUrl = 'http://localhost:3000';
  }

  async startServer() {
    console.log('🚀 Iniciando servidor NestJS...');
    
    return new Promise((resolve, reject) => {
      this.serverProcess = spawn('npm', ['run', 'start:dev'], {
        cwd: process.cwd(),
        stdio: 'pipe'
      });

      this.serverProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log(`[SERVER] ${output}`);
        
        // Detectar cuando el servidor está listo
        if (output.includes('Nest application successfully started') || 
            output.includes('Application is running on')) {
          console.log('✅ Servidor iniciado correctamente');
          resolve();
        }
      });

      this.serverProcess.stderr.on('data', (data) => {
        console.error(`[SERVER ERROR] ${data}`);
      });

      this.serverProcess.on('error', (error) => {
        console.error('❌ Error al iniciar servidor:', error);
        reject(error);
      });

      // Timeout de 30 segundos
      setTimeout(() => {
        reject(new Error('Timeout: El servidor tardó demasiado en iniciar'));
      }, 30000);
    });
  }

  async connectWebSocket(token = null) {
    console.log(`🔌 Conectando a ${this.serverUrl}/delivery...`);
    
    const options = {
      transports: ['websocket', 'polling']
    };

    if (token) {
      options.auth = { token };
      options.extraHeaders = { 'Authorization': `Bearer ${token}` };
      options.query = { token };
      console.log('🔑 Usando token JWT para autenticación');
    }

    return new Promise((resolve, reject) => {
      this.socket = io(`${this.serverUrl}/delivery`, options);

      this.socket.on('connect', () => {
        console.log('✅ Conectado exitosamente');
        console.log(`📍 Socket ID: ${this.socket.id}`);
        this.setupEventListeners();
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Error de conexión:', error.message);
        reject(error);
      });

      // Timeout de 10 segundos para conectar
      setTimeout(() => {
        reject(new Error('Timeout: No se pudo conectar al WebSocket'));
      }, 10000);
    });
  }

  setupEventListeners() {
    this.socket.on('disconnect', (reason) => {
      console.log(`💔 Desconectado: ${reason}`);
    });

    this.socket.on('orderLocationUpdate', (data) => {
      console.log('📦 Actualización de ubicación de orden:', data);
    });

    this.socket.on('driverLocationUpdate', (data) => {
      console.log('🚗 Actualización de ubicación de driver:', data);
    });

    this.socket.on('activeDrivers', (data) => {
      console.log('👥 Drivers activos recibidos:', data.length, 'drivers');
    });

    this.socket.on('exception', (error) => {
      console.log('⚠️ Excepción del servidor:', error);
    });
  }

  async runBasicTests() {
    console.log('\n🧪 Iniciando pruebas básicas...\n');

    // Test 1: Enviar ubicación de driver
    console.log('1️⃣ Probando envío de ubicación de driver...');
    const locationData = {
      latitude: -12.0464,
      longitude: -77.0428,
      heading: 45,
      speed: 30,
      accuracy: 10
    };

    this.socket.emit('driverLocationUpdate', locationData);
    console.log('📤 Ubicación enviada:', locationData);

    await this.sleep(2000);

    // Test 2: Unirse a sala de orden
    console.log('\n2️⃣ Probando unirse a sala de orden...');
    const orderId = 1;
    this.socket.emit('joinOrderRoom', { orderId });
    console.log(`🏠 Intentando unirse a sala de orden ${orderId}`);

    await this.sleep(2000);

    // Test 3: Solicitar drivers activos (puede fallar si no es admin)
    console.log('\n3️⃣ Probando solicitud de drivers activos...');
    this.socket.emit('getActiveDrivers', {
      latitude: -12.0464,
      longitude: -77.0428,
      radius: 5
    });
    console.log('🔍 Solicitando drivers activos en un radio de 5km');

    await this.sleep(2000);

    // Test 4: Salir de sala de orden
    console.log('\n4️⃣ Probando salir de sala de orden...');
    this.socket.emit('leaveOrderRoom', { orderId });
    console.log(`🚪 Saliendo de sala de orden ${orderId}`);

    await this.sleep(2000);

    console.log('\n✅ Pruebas básicas completadas');
  }

  async simulateDriverMovement(duration = 10) {
    console.log(`\n🎮 Simulando movimiento de driver por ${duration} segundos...\n`);

    let lat = -12.0464;
    let lng = -77.0428;
    let heading = 45;

    const interval = setInterval(() => {
      // Simular movimiento pequeño
      lat += (Math.random() - 0.5) * 0.001;
      lng += (Math.random() - 0.5) * 0.001;
      heading = (heading + (Math.random() - 0.5) * 20) % 360;
      if (heading < 0) heading += 360;

      const speed = Math.floor(Math.random() * 50 + 10);

      const locationData = {
        latitude: parseFloat(lat.toFixed(6)),
        longitude: parseFloat(lng.toFixed(6)),
        heading: Math.floor(heading),
        speed,
        accuracy: 10
      };

      this.socket.emit('driverLocationUpdate', locationData);
      console.log(`📍 Enviando ubicación: ${locationData.latitude}, ${locationData.longitude} | Velocidad: ${speed}km/h`);
    }, 2000);

    setTimeout(() => {
      clearInterval(interval);
      console.log('\n⏹️ Simulación de movimiento completada');
    }, duration * 1000);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async cleanup() {
    console.log('\n🧹 Limpiando recursos...');
    
    if (this.socket) {
      this.socket.disconnect();
      console.log('🔌 Socket desconectado');
    }

    if (this.serverProcess) {
      this.serverProcess.kill();
      console.log('🛑 Servidor detenido');
    }
  }

  async run(token = null) {
    try {
      // Comentar esta línea si el servidor ya está corriendo
      // await this.startServer();
      
      // Esperar un poco antes de conectar
      await this.sleep(2000);
      
      await this.connectWebSocket(token);
      
      await this.runBasicTests();
      
      // Opcional: simular movimiento
      if (process.argv.includes('--simulate')) {
        await this.simulateDriverMovement(15);
      }
      
      console.log('\n✅ Todas las pruebas completadas exitosamente!');
      
    } catch (error) {
      console.error('❌ Error durante las pruebas:', error.message);
    } finally {
      // Mantener conexión abierta por un momento para ver resultados
      await this.sleep(3000);
      await this.cleanup();
      process.exit(0);
    }
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  const token = process.argv[2];
  const tester = new SimpleWebSocketTester();
  
  console.log('🔧 WebSocket Tester - Delivery System');
  console.log('=====================================');
  
  if (token) {
    console.log('🔑 Token JWT proporcionado');
  } else {
    console.log('🔓 Sin token JWT - conexión anónima');
  }
  
  console.log('💡 Usa --simulate para activar simulación de movimiento');
  console.log('=====================================\n');
  
  // Manejar ctrl+c
  process.on('SIGINT', async () => {
    console.log('\n\n⏹️ Interrupción detectada, limpiando...');
    await tester.cleanup();
    process.exit(0);
  });
  
  tester.run(token);
}

module.exports = SimpleWebSocketTester;
