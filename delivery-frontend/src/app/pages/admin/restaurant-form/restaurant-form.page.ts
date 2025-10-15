import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController } from '@ionic/angular';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RestaurantService } from '../../../services/restaurant.service';
import { UserService } from '../../../services/user.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-restaurant-form',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule, RouterLink],
  templateUrl: './restaurant-form.page.html',
})
export class AdminRestaurantFormPage {
  private fb = inject(FormBuilder);
  private toast = inject(ToastController);
  private restaurants = inject(RestaurantService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private users = inject(UserService);

  form = this.fb.nonNullable.group({
    name: this.fb.nonNullable.control<string>('', [Validators.required]),
    address: this.fb.nonNullable.control<string>('', [Validators.required]),
    phone: this.fb.nonNullable.control<string>('', [Validators.required]),
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

  constructor() {
    // Leer ID si viene por query para modo edición
    const id = this.route.snapshot.queryParamMap.get('id');
    if (id) {
      this.id = id;
      this.restaurants.getById(id).subscribe((r) => {
        this.form.patchValue({
          name: r.name,
          address: r.address,
          phone: r.phone,
          latitude: (r as any).location?.coordinates?.[1] ?? null,
          longitude: (r as any).location?.coordinates?.[0] ?? null,
          restaurantCategoryId: (r as any).category?.id ?? null,
          ownerId: (r as any).owner?.id ?? null,
        });
      });
    }

    // Cargar categorías activas para el select
    this.loadingCategories = true;
    this.restaurants.listRestaurantCategories().subscribe({
      next: (list) => {
        this.categories = (list || []).map((c: any) => ({
          id: c.id,
          name: c.name,
        }));
        this.loadingCategories = false;
      },
      error: () => {
        this.categories = [];
        this.loadingCategories = false;
      },
    });

    // Cargar posibles owners (usuarios con rol restaurant_owner; opcional incluir super_admin)
    this.loadingOwners = true;
    this.users.getAllUsers().subscribe({
      next: (list) => {
        const owners = (list || []).filter(
          (u: any) => u.role === 'restaurant_owner' || u.role === 'super_admin'
        );
        this.owners = owners.map((u: any) => ({
          id: u.id,
          label: u.name || u.email,
          role: u.role,
        }));
        this.loadingOwners = false;
      },
      error: () => {
        this.owners = [];
        this.loadingOwners = false;
      },
    });
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
      latitude: Number(data.latitude),
      longitude: Number(data.longitude),
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
