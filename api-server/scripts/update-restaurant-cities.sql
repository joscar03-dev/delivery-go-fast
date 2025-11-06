-- Script para actualizar restaurantes existentes con ciudad por defecto
-- Ejecutar este script después de aplicar la migración UpdateCityToEnum

-- Ver restaurantes sin ciudad
SELECT id, name, city, address FROM restaurants WHERE city IS NULL ORDER BY name;

-- Actualizar todos los restaurantes que no tienen ciudad a 'Bagua' por defecto
UPDATE restaurants 
SET city = 'Bagua'
WHERE city IS NULL;

-- Si algunos restaurantes tenían 'Lima' u otras ciudades del enum anterior
-- puedes actualizarlos también:
-- UPDATE restaurants SET city = 'Bagua' WHERE city NOT IN ('Bagua', 'Bagua Grande', 'Chachapoyas', 'Jaen');

-- Ejemplos para asignar ciudades específicas:
-- UPDATE restaurants SET city = 'Bagua Grande' WHERE name LIKE '%KFC%';
-- UPDATE restaurants SET city = 'Chachapoyas' WHERE name LIKE '%Pizza%';
-- UPDATE restaurants SET city = 'Jaen' WHERE name LIKE '%Burger%';

-- Ver el resultado final
SELECT id, name, city, address FROM restaurants ORDER BY city, name;

-- Contar restaurantes por ciudad
SELECT city, COUNT(*) as total 
FROM restaurants 
GROUP BY city 
ORDER BY total DESC;
