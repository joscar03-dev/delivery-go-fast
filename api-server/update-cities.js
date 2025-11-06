const { DataSource } = require('typeorm');
require('dotenv/config');

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'delivery_db',
});

async function updateCities() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Conectado a la base de datos');

    // Ver restaurantes sin ciudad
    console.log('\n📋 Restaurantes sin ciudad:');
    const withoutCity = await AppDataSource.query(
      'SELECT id, name, city, address FROM restaurants WHERE city IS NULL ORDER BY name'
    );
    console.table(withoutCity);

    // Actualizar a Bagua por defecto
    const result = await AppDataSource.query(
      "UPDATE restaurants SET city = 'Bagua' WHERE city IS NULL"
    );
    console.log(`\n✅ ${result[1]} restaurantes actualizados a 'Bagua'`);

    // Ver resultado final
    console.log('\n📊 Restaurantes por ciudad:');
    const byCityCount = await AppDataSource.query(
      'SELECT city, COUNT(*) as total FROM restaurants GROUP BY city ORDER BY total DESC'
    );
    console.table(byCityCount);

    console.log('\n📋 Lista completa de restaurantes:');
    const allRestaurants = await AppDataSource.query(
      'SELECT id, name, city, address FROM restaurants ORDER BY city, name'
    );
    console.table(allRestaurants);

    await AppDataSource.destroy();
    console.log('\n✅ Script completado exitosamente');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateCities();
