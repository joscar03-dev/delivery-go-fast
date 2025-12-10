import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  Input,
  AfterViewInit,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonToggle,
  ModalController,
  IonSpinner,
  ToastController,
} from '@ionic/angular/standalone';
import { Geolocation } from '@capacitor/geolocation';
import { AddressService } from '../../services/address.service';
import {
  Address,
  CreateAddressDto,
  AddressType,
} from '../../models/address.model';
import { addIcons } from 'ionicons';
import {
  closeOutline,
  saveOutline,
  locationOutline,
  locateOutline,
  alertCircleOutline,
  informationCircleOutline,
  checkmarkCircleOutline,
} from 'ionicons/icons';
import * as L from 'leaflet';

addIcons({
  'close-outline': closeOutline,
  'save-outline': saveOutline,
  'location-outline': locationOutline,
  'locate-outline': locateOutline,
  'alert-circle-outline': alertCircleOutline,
  'information-circle-outline': informationCircleOutline,
  'checkmark-circle-outline': checkmarkCircleOutline,
});

@Component({
  selector: 'app-address-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonIcon,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonToggle,
    IonSpinner,
  ],
  templateUrl: './address-form.component.html',
  styleUrls: ['./address-form.component.scss'],
})
export class AddressFormComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() address?: Address;
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;

  private map?: L.Map;
  private marker?: L.Marker; // Para modo edición
  private resizeObserver?: ResizeObserver; // Para detectar cambios de tamaño
  @Input() isEdit = false;

  private fb = inject(FormBuilder);
  private addressService = inject(AddressService);
  private modalCtrl = inject(ModalController);
  private toastCtrl = inject(ToastController);

  addressForm!: FormGroup;
  loading = false;
  errorMessage = '';
  locationLoading = false;

  // Opciones de tipo de dirección
  addressTypes = [
    { value: AddressType.HOME, label: 'Casa' },
    { value: AddressType.WORK, label: 'Trabajo' },
    { value: AddressType.OTHER, label: 'Otro' },
  ];

  ngOnInit() {
    this.initForm();
  }

  ngAfterViewInit() {
    // Inicializar mapa después de que la vista esté lista
    // Usar un timeout más largo para asegurar que el contenedor esté renderizado
    setTimeout(() => {
      this.initMap();
      this.setupResizeObserver();
    }, 500);
  }

  ngOnDestroy() {
    // Limpiar recursos del mapa
    if (this.map) {
      this.map.remove();
      this.map = undefined;
    }

    // Limpiar el ResizeObserver
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  private setupResizeObserver() {
    // Observar cambios de tamaño en el contenedor del mapa
    if (this.mapContainer?.nativeElement) {
      this.resizeObserver = new ResizeObserver(() => {
        if (this.map) {
          this.map.invalidateSize();
        }
      });

      this.resizeObserver.observe(this.mapContainer.nativeElement);
    }
  }

  private initMap() {
    try {
      // Coordenadas iniciales (Jaén, Perú o dirección existente)
      const lat = this.address?.location?.coordinates[1] || -5.636;
      const lng = this.address?.location?.coordinates[0] || -78.532;

      // Crear el mapa
      this.map = L.map(this.mapContainer.nativeElement, {
        center: [lat, lng],
        zoom: 15,
        zoomControl: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        touchZoom: true,
        preferCanvas: false,
      });

      // Agregar capa de tiles (OpenStreetMap) con configuración mejorada
      const tileLayer = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
          minZoom: 10,
          subdomains: ['a', 'b', 'c'],
          errorTileUrl: '', // Manejar tiles que fallan
          keepBuffer: 2, // Mantener tiles extra en memoria
        }
      );

      // Agregar eventos para depuración
      tileLayer.on('tileerror', (error: any) => {
        console.warn('⚠️ Error cargando tile:', error);
      });

      tileLayer.on('tileload', () => {
        console.log('✅ Tile cargado');
      });

      tileLayer.addTo(this.map);

      // Forzar que el mapa recalcule su tamaño múltiples veces
      setTimeout(() => {
        this.map?.invalidateSize();
      }, 100);

      setTimeout(() => {
        this.map?.invalidateSize();
      }, 500);

      setTimeout(() => {
        this.map?.invalidateSize();
      }, 1000);

      // Configurar ícono personalizado del marcador
      const customIcon = L.icon({
        iconUrl: 'assets/marker-icon.png',
        iconRetinaUrl: 'assets/marker-icon-2x.png',
        shadowUrl: 'assets/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      // Agregar marcador inicial
      this.marker = L.marker([lat, lng], {
        icon: customIcon,
        draggable: true,
      }).addTo(this.map);

      // Actualizar coordenadas cuando se arrastra el marcador
      this.marker.on('dragend', (event: L.DragEndEvent) => {
        const position = event.target.getLatLng();
        this.updateCoordinates(position.lat, position.lng);
      });

      // Permitir hacer clic en el mapa para mover el marcador
      this.map.on('click', (event: L.LeafletMouseEvent) => {
        const { lat, lng } = event.latlng;
        if (this.marker) {
          this.marker.setLatLng([lat, lng]);
        }
        this.updateCoordinates(lat, lng);
      });

      console.log('🗺️ Mapa inicializado correctamente');
    } catch (error) {
      console.error('❌ Error al inicializar el mapa:', error);
    }
  }

  private updateCoordinates(lat: number, lng: number) {
    this.addressForm.patchValue({
      latitude: lat,
      longitude: lng,
    });
  }

  private initForm() {
    this.addressForm = this.fb.group({
      street: [
        this.address?.street || '',
        [Validators.required, Validators.minLength(5)],
      ],
      city: [
        { value: this.address?.city || 'Bagua', disabled: true },
        [Validators.required, Validators.minLength(3)],
      ],
      postalCode: [this.address?.postalCode || '01720', [Validators.required]],
      reference: [this.address?.reference || ''],
      type: [this.address?.type || AddressType.HOME],
      isDefault: [this.address?.isDefault || false],
      latitude: [this.address?.location?.coordinates[1] || null],
      longitude: [this.address?.location?.coordinates[0] || null],
    });
  }

  /**
   * Obtiene la ubicación actual del usuario usando Capacitor Geolocation
   */
  async getCurrentLocation() {
    this.locationLoading = true;
    this.errorMessage = '';

    try {
      // Primero verificar permisos
      const permissionStatus = await Geolocation.checkPermissions();
      console.log('📍 Permisos de ubicación:', permissionStatus);

      if (permissionStatus.location !== 'granted') {
        // Solicitar permisos
        const requestPermission = await Geolocation.requestPermissions();
        console.log('📍 Permisos solicitados:', requestPermission);

        if (requestPermission.location !== 'granted') {
          await this.showToast(
            'Se necesitan permisos de ubicación para usar esta función',
            'warning'
          );
          this.locationLoading = false;
          return;
        }
      }

      // Obtener ubicación
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      });

      console.log('📍 Ubicación obtenida:', position);

      // Actualizar formulario
      this.addressForm.patchValue({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });

      // Actualizar mapa y marcador
      if (this.map && this.marker) {
        const newLatLng = L.latLng(
          position.coords.latitude,
          position.coords.longitude
        );
        this.marker.setLatLng(newLatLng);
        this.map.setView(newLatLng, 16);
      }

      await this.showToast(
        `✅ Ubicación detectada: ${position.coords.latitude.toFixed(
          6
        )}, ${position.coords.longitude.toFixed(6)}`,
        'success'
      );

      this.locationLoading = false;
    } catch (error: any) {
      console.error('❌ Error al obtener ubicación:', error);

      let errorMsg = 'No se pudo obtener la ubicación';
      if (error.message) {
        errorMsg += `: ${error.message}`;
      }

      await this.showToast(errorMsg, 'danger');
      this.locationLoading = false;
    }
  }

  /**
   * Muestra un toast con un mensaje
   */
  private async showToast(
    message: string,
    color: 'success' | 'warning' | 'danger' = 'success'
  ) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'bottom',
    });
    await toast.present();
  }

  /**
   * Guarda la dirección
   */
  async save() {
    if (this.addressForm.invalid) {
      this.markFormGroupTouched(this.addressForm);
      this.errorMessage = 'Por favor completa todos los campos requeridos';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    // Obtener y limpiar datos del formulario (incluir controles deshabilitados)
    const formData = this.addressForm.getRawValue();
    const cleanedData = this.cleanFormData(formData);

    console.log('💾 Guardando dirección:', cleanedData);

    try {
      let savedAddress: Address;

      if (this.isEdit && this.address) {
        // Modo edición
        console.log('✏️ Actualizando dirección:', this.address.id);
        savedAddress = (await this.addressService
          .updateAddress(this.address.id, cleanedData)
          .toPromise()) as Address;
      } else {
        // Modo creación
        console.log('➕ Creando nueva dirección');
        savedAddress = (await this.addressService
          .createAddress(cleanedData as CreateAddressDto)
          .toPromise()) as Address;
      }

      console.log('✅ Dirección guardada exitosamente:', savedAddress);
      this.loading = false;
      this.modalCtrl.dismiss(savedAddress, 'saved');
    } catch (error: any) {
      console.error('❌ Error saving address:', error);

      // Manejo específico de errores
      let errorMsg = 'Error al guardar la dirección';

      if (error?.error?.message) {
        errorMsg = error.error.message;
      } else if (error?.message) {
        errorMsg = error.message;
      } else if (error?.status === 400) {
        errorMsg = 'Datos inválidos. Por favor verifica los campos.';
      } else if (error?.status === 409) {
        errorMsg =
          'Ya existe una dirección predeterminada. Esta será actualizada automáticamente.';
      } else if (error?.status === 500) {
        errorMsg = 'Error del servidor. Por favor intenta nuevamente.';
      }

      this.errorMessage = errorMsg;
      this.loading = false;
    }
  }

  /**
   * Limpia los datos del formulario antes de enviar
   * - Elimina campos vacíos o null
   * - Convierte coordenadas vacías a null
   */
  private cleanFormData(data: any): any {
    const cleaned: any = {};

    Object.keys(data).forEach((key) => {
      const value = data[key];

      // Para latitud y longitud, convertir strings vacías o 0 a null
      if (key === 'latitude' || key === 'longitude') {
        if (
          value === '' ||
          value === null ||
          value === undefined ||
          value === 0
        ) {
          // No incluir el campo si está vacío
          return;
        }
        // Convertir a número si es string
        cleaned[key] = typeof value === 'string' ? parseFloat(value) : value;
        return;
      }

      // Para reference, permitir string vacía
      if (key === 'reference') {
        cleaned[key] = value || '';
        return;
      }

      // Para otros campos, solo incluir si tienen valor
      if (value !== null && value !== undefined && value !== '') {
        cleaned[key] = value;
      }
    });

    return cleaned;
  }

  /**
   * Cierra el modal sin guardar
   */
  cancel() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  /**
   * Marca todos los campos como touched para mostrar errores
   */
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Verifica si un campo tiene errores
   */
  hasError(fieldName: string): boolean {
    const field = this.addressForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  /**
   * Obtiene el mensaje de error para un campo
   */
  getErrorMessage(fieldName: string): string {
    const field = this.addressForm.get(fieldName);
    if (!field || !field.errors || !field.touched) {
      return '';
    }

    if (field.errors['required']) {
      return 'Este campo es requerido';
    }
    if (field.errors['minlength']) {
      return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
    }
    return 'Campo inválido';
  }
}
