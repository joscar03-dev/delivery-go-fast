import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonButton,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonIcon,
  ToastController,
} from '@ionic/angular/standalone';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RestaurantService } from '../../../services/restaurant.service';
import { UserService } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ImageCompressor } from '../../../common/utils/image-compressor.util';
import { CITIES, City } from '../../../models/city.enum';
import { addIcons } from 'ionicons';
import {
  trashOutline,
  cloudUploadOutline,
  locationOutline,
  saveOutline,
} from 'ionicons/icons';

// Register icons
addIcons({
  'trash-outline': trashOutline,
  'cloud-upload-outline': cloudUploadOutline,
  'location-outline': locationOutline,
  'save-outline': saveOutline,
});

@Component({
  selector: 'app-admin-restaurant-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonButton,
    IonItem,
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonIcon,
  ],
  templateUrl: './restaurant-form.page.html',
  styleUrls: ['./restaurant-form.page.scss'],
})
export class AdminRestaurantFormPage {
  private fb = inject(FormBuilder);
  private toast = inject(ToastController);
  private restaurants = inject(RestaurantService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private users = inject(UserService);
  private auth = inject(AuthService);

  form = this.fb.nonNullable.group({
    name: this.fb.nonNullable.control<string>('', [Validators.required]),
    address: this.fb.nonNullable.control<string>('', [Validators.required]),
    phone: this.fb.nonNullable.control<string>('', [Validators.required]),
    city: this.fb.nonNullable.control<string>('', [Validators.required]),
    imageUrl: this.fb.nonNullable.control<string>(''),
    latitude: this.fb.nonNullable.control<number | null>(null, [
      Validators.required,
    ]),
    longitude: this.fb.nonNullable.control<number | null>(null, [
      Validators.required,
    ]),
    restaurantCategoryId: this.fb.nonNullable.control<string | null>(null),
    ownerId: this.fb.nonNullable.control<string | null>(null),
  });
  id?: string;
  categories: Array<{ id: string; name: string }> = [];
  loadingCategories = false;
  owners: Array<{ id: string; label: string; role?: string }> = [];
  loadingOwners = false;
  locating = false;
  imagePreview: string | null = null;
  isRestaurantOwner = false; // Nueva propiedad
  currentUserName = ''; // Nombre del usuario actual

  // Lista de ciudades disponibles
  cities = CITIES;

  constructor() {
    // Detectar si el usuario actual es restaurant_owner
    this.isRestaurantOwner = this.auth.hasRole('restaurant_owner');

    // Obtener nombre del usuario actual
    this.auth.currentUser$.subscribe((user) => {
      if (user) {
        this.currentUserName = user.name || user.email || 'Usuario actual';
      }
    });

    // Leer ID si viene por query para modo edición
    const id = this.route.snapshot.queryParamMap.get('id');
    if (id) {
      this.id = id;
      this.restaurants.getById(id).subscribe((r) => {
        this.form.patchValue({
          name: r.name,
          address: r.address,
          phone: r.phone,
          city: r.city || City.BAGUA,
          imageUrl: r.imageUrl || '',
          latitude: (r as any).location?.coordinates?.[1] ?? null,
          longitude: (r as any).location?.coordinates?.[0] ?? null,
          restaurantCategoryId: (r as any).category?.id ?? null,
          ownerId: (r as any).owner?.id ?? null,
        });
        // Mostrar preview si ya tiene imagen
        if (r.imageUrl) {
          this.imagePreview = r.imageUrl;
        }
      });
    }

    // Cargar categorías activas para el select
    this.loadingCategories = true;
    this.form.get('restaurantCategoryId')?.disable();
    this.restaurants.listRestaurantCategories().subscribe({
      next: (list) => {
        this.categories = (list || []).map((c: any) => ({
          id: c.id,
          name: c.name,
        }));
        this.loadingCategories = false;
        this.form.get('restaurantCategoryId')?.enable();
      },
      error: () => {
        this.categories = [];
        this.loadingCategories = false;
        this.form.get('restaurantCategoryId')?.enable();
      },
    });

    // Cargar posibles owners (usuarios con rol restaurant_owner; opcional incluir super_admin)
    this.loadingOwners = true;
    this.form.get('ownerId')?.disable();

    // Si es restaurant_owner, establecer su propio ID y mantener deshabilitado
    if (this.isRestaurantOwner) {
      this.auth.currentUser$.subscribe((user) => {
        if (user?.id) {
          this.form.patchValue({ ownerId: user.id });
          // Mantener deshabilitado para restaurant_owner
          this.loadingOwners = false;
        }
      });
    } else {
      // Solo super_admin puede elegir el dueño
      this.users.getAllUsers().subscribe({
        next: (list) => {
          const owners = (list || []).filter(
            (u: any) =>
              u.role === 'restaurant_owner' || u.role === 'super_admin'
          );
          this.owners = owners.map((u: any) => ({
            id: u.id,
            label: u.name || u.email,
            role: u.role,
          }));
          this.loadingOwners = false;
          this.form.get('ownerId')?.enable();
        },
        error: () => {
          this.owners = [];
          this.loadingOwners = false;
          this.form.get('ownerId')?.enable();
        },
      });
    }
  }

  async useMyLocation() {
    if (!('geolocation' in navigator)) {
      const t = await this.toast.create({
        message: 'Geolocalización no soportada por el navegador',
        duration: 2000,
        color: 'warning',
      });
      return t.present();
    }
    this.locating = true;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        this.form.patchValue({ latitude, longitude });
        this.locating = false;
        const t = await this.toast.create({
          message: 'Ubicación establecida',
          duration: 1200,
          color: 'success',
        });
        t.present();
      },
      async (err) => {
        this.locating = false;
        const t = await this.toast.create({
          message: err?.message || 'No se pudo obtener la ubicación',
          duration: 2000,
          color: 'danger',
        });
        t.present();
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  getCurrentOwnerName(): string {
    return this.currentUserName || 'Tú';
  }

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      // Validar la imagen
      const validation = ImageCompressor.validateImage(file);
      if (!validation.isValid) {
        this.toast
          .create({
            message: validation.error || 'Archivo inválido',
            duration: 2000,
            color: 'warning',
          })
          .then((t) => t.present());
        return;
      }

      // Comprimir y redimensionar la imagen
      ImageCompressor.compressImage(file, 800, 0.7)
        .then((compressedBase64) => {
          this.imagePreview = compressedBase64;
          this.form.patchValue({ imageUrl: compressedBase64 });
        })
        .catch((error) => {
          this.toast
            .create({
              message: 'Error al procesar la imagen',
              duration: 2000,
              color: 'danger',
            })
            .then((t) => t.present());
        });
    }
  }

  clearImage() {
    this.imagePreview = null;
    this.form.patchValue({ imageUrl: '' });
  }

  async save() {
    if (this.form.invalid) {
      const t = await this.toast.create({
        message: 'Completa los campos',
        duration: 1500,
        color: 'warning',
      });
      return t.present();
    }
    const data = this.form.getRawValue();
    const dto: any = {
      name: data.name,
      address: data.address,
      phone: data.phone,
      city: data.city,
      latitude: Number(data.latitude),
      longitude: Number(data.longitude),
      ...(data.imageUrl ? { imageUrl: data.imageUrl } : {}),
      ...(data.restaurantCategoryId
        ? { restaurantCategoryId: data.restaurantCategoryId }
        : {}),
      ...(data.ownerId ? { ownerId: data.ownerId } : {}),
    };

    const obs = this.id
      ? this.restaurants.update(this.id, dto)
      : this.restaurants.create(dto);

    obs.subscribe({
      next: async (r) => {
        const t = await this.toast.create({
          message: this.id ? 'Restaurante actualizado' : 'Restaurante creado',
          duration: 1500,
          color: 'success',
        });
        t.present();
        this.router.navigate(['/admin/restaurants']);
      },
      error: async (err) => {
        const t = await this.toast.create({
          message: err?.error?.message || 'Error al guardar',
          duration: 2000,
          color: 'danger',
        });
        t.present();
      },
    });
  }
}
