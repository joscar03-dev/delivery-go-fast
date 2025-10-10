const { io } = require('socket.io-client');

console.log('🔧 Prueba Rápida de WebSocket');
console.log('=============================\n');

// Conectar al WebSocket
const socket = io('http://localhost:3000/delivery', {
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  console.log('✅ Conectado exitosamente');
  console.log(`📍 Socket ID: ${socket.id}\n`);
  
  // Configurar listeners
  socket.on('driverLocationUpdate', (data) => {
    console.log('🚗 Actualización de ubicación de driver:', data);
  });
  
  socket.on('orderLocationUpdate', (data) => {
    console.log('📦 Actualización de ubicación de orden:', data);
  });
  
  socket.on('activeDrivers', (data) => {
    console.log('👥 Drivers activos:', data);
  });
  
  socket.on('exception', (error) => {
    console.log('⚠️ Excepción:', error);
  });
  
  // Realizar pruebas
  setTimeout(() => {
    console.log('1️⃣ Enviando ubicación de driver...');
    socket.emit('driverLocationUpdate', {
      latitude: -12.0464,
      longitude: -77.0428,
      heading: 45,
      speed: 30,
      accuracy: 10
    });
  }, 1000);
  
  setTimeout(() => {
    console.log('2️⃣ Uniéndose a sala de orden...');
    socket.emit('joinOrderRoom', { orderId: 1 });
  }, 2000);
  
  setTimeout(() => {
    console.log('3️⃣ Solicitando drivers activos...');
    socket.emit('getActiveDrivers', {
      latitude: -12.0464,
      longitude: -77.0428,
      radius: 5
    });
  }, 3000);
  
  setTimeout(() => {
    console.log('\n✅ Pruebas completadas. Desconectando...');
    socket.disconnect();
    process.exit(0);
  }, 5000);
});

socket.on('connect_error', (error) => {
  console.error('❌ Error de conexión:', error.message);
  process.exit(1);
});

socket.on('disconnect', (reason) => {
  console.log(`💔 Desconectado: ${reason}`);
});

// Timeout de seguridad
setTimeout(() => {
  console.log('⏰ Timeout - cerrando prueba');
  process.exit(1);
}, 10000);

console.log('🔌 Intentando conectar a ws://localhost:3000/delivery...');
