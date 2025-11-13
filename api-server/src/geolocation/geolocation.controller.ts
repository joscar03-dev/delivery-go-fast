import { Controller, Post, Body } from '@nestjs/common';
import { GeolocationService } from './geolocation.service';
import { CheckCoverageDto, CoverageResponse } from './dto/check-coverage.dto';

/**
 * Controlador público para validación de cobertura
 * No requiere autenticación para permitir validación antes del registro/login
 */
@Controller('geolocation')
export class GeolocationController {
  constructor(private readonly geolocationService: GeolocationService) {}

  /**
   * POST /api/geolocation/check-coverage
   * Verifica si una ubicación está dentro de la zona de cobertura del servicio
   *
   * @param checkCoverageDto - Coordenadas de latitud y longitud a validar
   * @returns CoverageResponse - Resultado de la validación
   *
   * Ejemplo de uso:
   * ```
   * POST /api/geolocation/check-coverage
   * {
   *   "latitude": -12.0464,
   *   "longitude": -77.0428
   * }
   * ```
   */
  @Post('check-coverage')
  checkCoverage(@Body() checkCoverageDto: CheckCoverageDto): CoverageResponse {
    const { latitude, longitude } = checkCoverageDto;
    return this.geolocationService.checkCoverage(latitude, longitude);
  }
}
