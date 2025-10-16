import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ToastController, AlertController } from '@ionic/angular/standalone';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RestaurantService } from '../../../services/restaurant.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-restaurant-categories',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule, RouterLink],
  templateUrl: './restaurant-categories.page.html',
})
export class AdminRestaurantCategoriesPage implements OnInit {
  private restaurants = inject(RestaurantService);
  private toast = inject(ToastController);
  private alert = inject(AlertController);
  private fb = inject(FormBuilder);

  list: any[] = [];
  loading = false;
  isCreateOpen = false;
  form = this.fb.nonNullable.group({
    name: this.fb.nonNullable.control<string>('', [Validators.required]),
    description: this.fb.control<string | null>(null),
    icon: this.fb.control<string | null>(null),
  });

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.loading = true;
    this.restaurants.listRestaurantCategories().subscribe({
      next: (r) => {
        this.list = r;
        this.loading = false;
      },
      error: async () => {
        this.loading = false;
        const t = await this.toast.create({
          message: 'No se pudo cargar',
          duration: 1500,
          color: 'danger',
        });
        t.present();
      },
    });
  }

  async create() {
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();
    const data = {
      name: raw.name,
      description: raw.description ?? undefined,
      icon: raw.icon ?? undefined,
    };
    this.restaurants.createRestaurantCategory(data).subscribe({
      next: async () => {
        const t = await this.toast.create({
          message: 'Categoría creada',
          duration: 1200,
          color: 'success',
        });
        t.present();
        this.form.reset({ name: '', description: null, icon: null });
        this.isCreateOpen = false;
        this.load();
      },
      error: async (err) => {
        const t = await this.toast.create({
          message: err?.error?.message || 'Error',
          duration: 1500,
          color: 'danger',
        });
        t.present();
      },
    });
  }

  async remove(cat: any) {
    const alert = await this.alert.create({
      header: 'Eliminar',
      message: `¿Eliminar ${cat.name}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => this.confirmRemove(cat.id),
        },
      ],
    });
    await alert.present();
  }

  private async confirmRemove(id: string) {
    this.restaurants.removeRestaurantCategory(id).subscribe({
      next: async () => {
        const t = await this.toast.create({
          message: 'Eliminado',
          duration: 1200,
          color: 'success',
        });
        t.present();
        this.load();
      },
      error: async (err) => {
        const t = await this.toast.create({
          message: err?.error?.message || 'Error',
          duration: 1500,
          color: 'danger',
        });
        t.present();
      },
    });
  }

  async edit(cat: any) {
    const alert = await this.alert.create({
      header: 'Editar categoría',
      inputs: [
        { name: 'name', type: 'text', value: cat.name, placeholder: 'Nombre' },
        {
          name: 'description',
          type: 'text',
          value: cat.description ?? '',
          placeholder: 'Descripción',
        },
        {
          name: 'icon',
          type: 'text',
          value: cat.icon ?? '',
          placeholder: 'Icono (opcional)',
        },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: (values) => {
            const payload: any = {
              name: values.name,
              description: values.description || undefined,
              icon: values.icon || undefined,
            };
            this.restaurants
              .updateRestaurantCategory(cat.id, payload)
              .subscribe({
                next: async () => {
                  const t = await this.toast.create({
                    message: 'Actualizado',
                    duration: 1200,
                    color: 'success',
                  });
                  t.present();
                  this.load();
                },
                error: async (err) => {
                  const t = await this.toast.create({
                    message: err?.error?.message || 'Error',
                    duration: 1500,
                    color: 'danger',
                  });
                  t.present();
                },
              });
          },
        },
      ],
    });
    await alert.present();
  }

  async toggleActive(cat: any) {
    const desired = !cat.isActive;
    this.restaurants
      .updateRestaurantCategory(cat.id, { isActive: desired })
      .subscribe({
        next: async () => {
          const t = await this.toast.create({
            message: desired ? 'Activada' : 'Desactivada',
            duration: 1000,
            color: 'medium',
          });
          t.present();
          this.load();
        },
        error: async (err) => {
          const t = await this.toast.create({
            message: err?.error?.message || 'Error',
            duration: 1500,
            color: 'danger',
          });
          t.present();
        },
      });
  }
}
