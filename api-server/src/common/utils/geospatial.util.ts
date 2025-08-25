export class GeospatialQueryBuilder {
  /**
   * Construye una consulta para encontrar restaurantes dentro de un radio específico
   * @param latitude Latitud del punto central
   * @param longitude Longitud del punto central
   * @param radiusKm Radio en kilómetros
   * @returns Query builder configurado
   */
  static findNearbyRestaurants(
    repository: any,
    latitude: number,
    longitude: number,
    radiusKm: number = 10,
  ) {
    return repository
      .createQueryBuilder('restaurant')
      .leftJoinAndSelect('restaurant.category', 'category')
      .leftJoinAndSelect('restaurant.owner', 'owner')
      .where(
        'ST_DWithin(restaurant.location, ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326), :radius)',
      )
      .setParameters({
        longitude,
        latitude,
        radius: radiusKm * 1000, // Convertir kilómetros a metros
      })
      .orderBy(
        'ST_Distance(restaurant.location, ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326))',
      )
      .setParameter('longitude', longitude)
      .setParameter('latitude', latitude);
  }

  /**
   * Calcula la distancia entre dos puntos geográficos
   * @param lat1 Latitud del primer punto
   * @param lon1 Longitud del primer punto
   * @param lat2 Latitud del segundo punto
   * @param lon2 Longitud del segundo punto
   * @returns Distancia en kilómetros
   */
  static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Radio de la Tierra en kilómetros
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distancia en kilómetros
    return distance;
  }

  private static deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Valida si las coordenadas están dentro de rangos válidos
   * @param latitude Latitud a validar
   * @param longitude Longitud a validar
   * @returns true si las coordenadas son válidas
   */
  static validateCoordinates(latitude: number, longitude: number): boolean {
    return (
      latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180
    );
  }

  /**
   * Convierte un punto PostGIS en coordenadas legibles
   * @param postgisPoint Punto en formato PostGIS (ej: "POINT(-71.559611 -16.4040102)")
   * @returns Objeto con latitud y longitud
   */
  static parsePostGISPoint(postgisPoint: string): {
    latitude: number;
    longitude: number;
  } | null {
    if (!postgisPoint) return null;

    const match = postgisPoint.match(/POINT\(([^\s]+)\s+([^\s]+)\)/);
    if (!match) return null;

    return {
      longitude: parseFloat(match[1]),
      latitude: parseFloat(match[2]),
    };
  }

  /**
   * Formatea coordenadas como string PostGIS Point
   * @param latitude Latitud
   * @param longitude Longitud
   * @returns String en formato PostGIS Point
   */
  static formatAsPostGISPoint(latitude: number, longitude: number): string {
    return `POINT(${longitude} ${latitude})`;
  }
}
