import { Component, OnInit, inject, Input } from '@angular/core';
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
} from '@ionic/angular/standalone';
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
} from 'ionicons/icons';

addIcons({
  'close-outline': closeOutline,
  'save-outline': saveOutline,
  'location-outline': locationOutline,
  'locate-outline': locateOutline,
  'alert-circle-outline': alertCircleOutline,
  'information-circle-outline': informationCircleOutline,
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
export class AddressFormComponent implements OnInit {
  @Input() address?: Address; // Para modo edición
  @Input() isEdit = false;

  private fb = inject(FormBuilder);
  private addressService = inject(AddressService);
  private modalCtrl = inject(ModalController);

  addressForm!: FormGroup;
  loading = false;
  errorMessage = '';

  // Opciones de tipo de dirección
  addressTypes = [
    { value: AddressType.HOME, label: 'Casa' },
    { value: AddressType.WORK, label: 'Trabajo' },
    { value: AddressType.OTHER, label: 'Otro' },
  ];

  ngOnInit() {
    this.initForm();
  }

  private initForm() {
    this.addressForm = this.fb.group({
      street: [
        this.address?.street || '',
        [Validators.required, Validators.minLength(5)],
      ],
      city: [
        this.address?.city || '',
        [Validators.required, Validators.minLength(3)],
      ],
      postalCode: [this.address?.postalCode || '', [Validators.required]],
      reference: [this.address?.reference || ''],
      type: [this.address?.type || AddressType.HOME],
      isDefault: [this.address?.isDefault || false],
      latitude: [this.address?.location?.coordinates[1] || null],
      longitude: [this.address?.location?.coordinates[0] || null],
    });
  }

  /**
   * Obtiene la ubicación actual del usuario
   */
  async getCurrentLocation() {
    this.loading = true;
    this.errorMessage = '';

    try {
      // Intentar obtener ubicación del navegador
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            this.addressForm.patchValue({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
            this.loading = false;
          },
          (error) => {
            console.error('Error getting location:', error);
            this.errorMessage =
              'No se pudo obtener la ubicación. Por favor ingresa las coordenadas manualmente.';
            this.loading = false;
          }
        );
      } else {
        this.errorMessage = 'Tu navegador no soporta geolocalización';
        this.loading = false;
      }
    } catch (error) {
      console.error('Error:', error);
      this.errorMessage = 'Error al obtener ubicación';
      this.loading = false;
    }
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

    // Obtener y limpiar datos del formulario
    const formData = this.addressForm.value;
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
