const { io } = require('socket.io-client');

console.log('🔧 Test Multi-Cliente WebSocket');
console.log('================================\n');

// Tokens para diferentes roles
const tokens = {
  driver: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiZHJpdmVyQHRlc3QuY29tIiwicm9sZSI6ImRyaXZlciIsImlhdCI6MTc2MDA3OTQ3MCwiZXhwIjoxNzYwMDgzMDcwfQ.vZYKoLIhKdP8PmCsQpVSRl7rJ8Pl5KYFgqI1y5GXJnM',
  client: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIsImVtYWlsIjoiY2xpZW50QHRlc3QuY29tIiwicm9sZSI6ImNsaWVudCIsImlhdCI6MTc2MDA3OTQ3MCwiZXhwIjoxNzYwMDgzMDcwfQ.kJ3vZpV0nLM9rJQFz2c1m4X2Pl5KYFgqI1y5GXJnM',
  admin: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjQsImVtYWlsIjoiYWRtaW5AdGVzdC5jb20iLCJyb2xlIjoic3VwZXJfYWRtaW4iLCJpYXQiOjE3NjAwNzk0NzAsImV4cCI6MTc2MDA4MzA3MH0.lcpVZ3xk640ijc6V-DJ8CHf-gJYxZwxGLfykvva3FLY'
};

class MultiClientTester {
  constructor() {
    this.clients = {};
  }

  async createClient(name, role, token) {
    console.log(`🔌 Conectando cliente ${name} como ${role}...`);
    
    const socket = io('http://localhost:3000/delivery', {
      auth: { token },
      extraHeaders: { 'Authorization': `Bearer ${token}` },
      query: { token }
    });

    return new Promise((resolve) => {
      socket.on('connect', () => {
        console.log(`✅ Cliente ${name} conectado (ID: ${socket.id})`);
        
        // Setup event listeners
        socket.on('orderLocationUpdate', (data) => {
          console.log(`📦 [${name}] Actualización de orden:`, data);
        });
        
        socket.on('driverLocationUpdate', (data) => {
          console.log(`🚗 [${name}] Actualización de driver:`, data);
        });
        
        socket.on('activeDrivers', (data) => {
          console.log(`👥 [${name}] Drivers activos:`, data.length, 'drivers');
        });
        
        socket.on('exception', (error) => {
          console.log(`⚠️ [${name}] Excepción:`, error);
        });
        
        this.clients[name] = socket;
        resolve();
      });
      
      socket.on('connect_error', (error) => {
        console.error(`❌ Error conectando ${name}:`, error.message);
        resolve();
      });
    });
  }

  async runScenario() {
    try {
      // Crear múltiples clientes
      await this.createClient('Driver1', 'driver', tokens.driver);
      await this.createClient('Client1', 'client', tokens.client);
      await this.createClient('Admin1', 'admin', tokens.admin);
      
      console.log('\n🎬 INICIANDO ESCENARIO DE PRUEBA\n');
      
      // Escenario 1: Cliente se une a sala de orden
      console.log('1️⃣ Cliente se une a sala de orden 123...');
      this.clients.Client1.emit('joinOrderRoom', { orderId: 123 });
      
      await this.sleep(1000);
      
      // Escenario 2: Driver envía ubicación
      console.log('2️⃣ Driver envía ubicación inicial...');
      this.clients.Driver1.emit('driverLocationUpdate', {
        latitude: -12.0464,
        longitude: -77.0428,
        heading: 90,
        speed: 25,
        accuracy: 8
      });
      
      await this.sleep(2000);
      
      // Escenario 3: Admin solicita drivers activos
      console.log('3️⃣ Admin solicita drivers activos...');
      this.clients.Admin1.emit('getActiveDrivers', {
        latitude: -12.0464,
        longitude: -77.0428,
        radius: 10
      });
      
      await this.sleep(2000);
      
      // Escenario 4: Driver simula movimiento hacia el cliente
      console.log('4️⃣ Driver simula movimiento hacia cliente...');
      let lat = -12.0464;
      let lng = -77.0428;
      
      for (let i = 0; i < 5; i++) {
        lat += 0.001; // Moverse hacia el norte
        lng += 0.0005; // Moverse hacia el este
        
        this.clients.Driver1.emit('driverLocationUpdate', {
          latitude: lat,
          longitude: lng,
          heading: 45,
          speed: 30 + Math.random() * 20,
          accuracy: 8
        });
        
        console.log(`📍 Driver en: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        await this.sleep(1500);
      }
      
      // Escenario 5: Cliente abandona sala
      console.log('5️⃣ Cliente abandona sala de orden...');
      this.clients.Client1.emit('leaveOrderRoom', { orderId: 123 });
      
      await this.sleep(2000);
      
      console.log('\n✅ ESCENARIO COMPLETADO EXITOSAMENTE');
      
    } catch (error) {
      console.error('❌ Error en escenario:', error);
    } finally {
      // Desconectar todos los clientes
      console.log('\n🧹 Desconectando clientes...');
      Object.values(this.clients).forEach(socket => {
        if (socket.connected) {
          socket.disconnect();
        }
      });
      
      setTimeout(() => {
        process.exit(0);
      }, 1000);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Ejecutar test
const tester = new MultiClientTester();
tester.runScenario();

// Manejar Ctrl+C
process.on('SIGINT', () => {
  console.log('\n🛑 Interrumpido por usuario');
  Object.values(tester.clients).forEach(socket => {
    if (socket.connected) {
      socket.disconnect();
    }
  });
  process.exit(0);
});
