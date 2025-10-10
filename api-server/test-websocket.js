const { io } = require('socket.io-client');
const readline = require('readline');

class WebSocketTester {
  constructor() {
    this.socket = null;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  connect(serverUrl = 'http://localhost:3000', token = null) {
    console.log(`🔌 Conectando a ${serverUrl}/delivery...`);
    
    const options = {
      transports: ['websocket', 'polling']
    };

    if (token) {
      options.auth = { token };
      options.extraHeaders = { 'Authorization': `Bearer ${token}` };
      options.query = { token };
    }

    this.socket = io(`${serverUrl}/delivery`, options);

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.socket.on('connect', () => {
      console.log('✅ Conectado exitosamente');
      console.log(`📍 Socket ID: ${this.socket.id}`);
    });

    this.socket.on('disconnect', (reason) => {
      console.log(`❌ Desconectado: ${reason}`);
    });

    this.socket.on('connect_error', (error) => {
      console.log(`🚫 Error de conexión: ${error.message}`);
    });

    this.socket.on('orderLocationUpdate', (data) => {
      console.log('📦 Actualización de ubicación de orden:', JSON.stringify(data, null, 2));
    });

    this.socket.on('driverLocationUpdate', (data) => {
      console.log('🚗 Actualización de ubicación de driver:', JSON.stringify(data, null, 2));
    });

    this.socket.on('activeDrivers', (data) => {
      console.log('👥 Drivers activos:', JSON.stringify(data, null, 2));
    });

    this.socket.on('exception', (error) => {
      console.log('⚠️ Excepción del servidor:', JSON.stringify(error, null, 2));
    });
  }

  sendDriverLocation(latitude, longitude, heading = 0, speed = 0) {
    if (!this.socket || !this.socket.connected) {
      console.log('❌ No hay conexión activa');
      return;
    }

    const locationData = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      heading: parseInt(heading),
      speed: parseFloat(speed),
      accuracy: 10
    };

    console.log('📤 Enviando ubicación de driver:', locationData);
    this.socket.emit('driverLocationUpdate', locationData);
  }

  joinOrderRoom(orderId) {
    if (!this.socket || !this.socket.connected) {
      console.log('❌ No hay conexión activa');
      return;
    }

    console.log(`🏠 Uniéndose a sala de orden: ${orderId}`);
    this.socket.emit('joinOrderRoom', { orderId: parseInt(orderId) });
  }

  leaveOrderRoom(orderId) {
    if (!this.socket || !this.socket.connected) {
      console.log('❌ No hay conexión activa');
      return;
    }

    console.log(`🚪 Saliendo de sala de orden: ${orderId}`);
    this.socket.emit('leaveOrderRoom', { orderId: parseInt(orderId) });
  }

  getActiveDrivers(latitude, longitude, radius) {
    if (!this.socket || !this.socket.connected) {
      console.log('❌ No hay conexión activa');
      return;
    }

    const data = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      radius: parseFloat(radius)
    };

    console.log(`🔍 Solicitando drivers activos:`, data);
    this.socket.emit('getActiveDrivers', data);
  }

  startInteractiveMode() {
    console.log(`
🔧 MODO INTERACTIVO - Comandos disponibles:
- connect [url] [token] - Conectar al servidor
- driver [lat] [lng] [heading] [speed] - Enviar ubicación de driver
- join [orderId] - Unirse a sala de orden
- leave [orderId] - Salir de sala de orden
- drivers [lat] [lng] [radius] - Obtener drivers activos
- simulate [lat] [lng] [duration] - Simular movimiento
- disconnect - Desconectar
- help - Mostrar ayuda
- exit - Salir
`);

    this.promptUser();
  }

  promptUser() {
    this.rl.question('> ', (input) => {
      this.processCommand(input.trim());
      this.promptUser();
    });
  }

  processCommand(command) {
    const parts = command.split(' ');
    const cmd = parts[0].toLowerCase();

    switch (cmd) {
      case 'connect':
        const url = parts[1] || 'http://localhost:3000';
        const token = parts[2] || null;
        this.connect(url, token);
        break;

      case 'driver':
        if (parts.length < 3) {
          console.log('❌ Uso: driver [lat] [lng] [heading] [speed]');
          break;
        }
        this.sendDriverLocation(parts[1], parts[2], parts[3], parts[4]);
        break;

      case 'join':
        if (parts.length < 2) {
          console.log('❌ Uso: join [orderId]');
          break;
        }
        this.joinOrderRoom(parts[1]);
        break;

      case 'leave':
        if (parts.length < 2) {
          console.log('❌ Uso: leave [orderId]');
          break;
        }
        this.leaveOrderRoom(parts[1]);
        break;

      case 'drivers':
        if (parts.length < 4) {
          console.log('❌ Uso: drivers [lat] [lng] [radius]');
          break;
        }
        this.getActiveDrivers(parts[1], parts[2], parts[3]);
        break;

      case 'simulate':
        if (parts.length < 4) {
          console.log('❌ Uso: simulate [lat] [lng] [duration_seconds]');
          break;
        }
        this.simulateMovement(parts[1], parts[2], parts[3]);
        break;

      case 'disconnect':
        if (this.socket) {
          this.socket.disconnect();
        }
        break;

      case 'help':
        console.log(`
📋 COMANDOS DISPONIBLES:
- connect [url] [token] - Conectar al servidor WebSocket
- driver [lat] [lng] [heading] [speed] - Enviar ubicación de driver
- join [orderId] - Unirse a sala de orden para recibir actualizaciones
- leave [orderId] - Salir de sala de orden
- drivers [lat] [lng] [radius] - Obtener drivers activos en un área
- simulate [lat] [lng] [duration] - Simular movimiento por X segundos
- disconnect - Desconectar del servidor
- exit - Salir del programa
        `);
        break;

      case 'exit':
        if (this.socket) {
          this.socket.disconnect();
        }
        this.rl.close();
        process.exit(0);
        break;

      default:
        if (command) {
          console.log(`❌ Comando desconocido: ${cmd}. Usa 'help' para ver comandos disponibles.`);
        }
    }
  }

  simulateMovement(startLat, startLng, duration) {
    if (!this.socket || !this.socket.connected) {
      console.log('❌ No hay conexión activa');
      return;
    }

    console.log(`🎮 Iniciando simulación de movimiento por ${duration} segundos...`);
    
    let lat = parseFloat(startLat);
    let lng = parseFloat(startLng);
    let heading = Math.floor(Math.random() * 360);
    
    const interval = setInterval(() => {
      // Simular movimiento aleatorio
      const deltaLat = (Math.random() - 0.5) * 0.001; // ~111 metros max
      const deltaLng = (Math.random() - 0.5) * 0.001;
      
      lat += deltaLat;
      lng += deltaLng;
      heading = (heading + Math.floor(Math.random() * 60 - 30)) % 360;
      if (heading < 0) heading += 360;
      
      const speed = Math.floor(Math.random() * 60 + 10); // 10-70 km/h
      
      this.sendDriverLocation(lat, lng, heading, speed);
    }, 2000);

    setTimeout(() => {
      clearInterval(interval);
      console.log('⏹️ Simulación de movimiento terminada');
    }, duration * 1000);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  const tester = new WebSocketTester();
  
  // Conectar automáticamente si se pasan argumentos
  const args = process.argv.slice(2);
  if (args.length > 0) {
    const url = args[0] || 'http://localhost:3000';
    const token = args[1] || null;
    tester.connect(url, token);
  }
  
  tester.startInteractiveMode();
}

module.exports = WebSocketTester;
