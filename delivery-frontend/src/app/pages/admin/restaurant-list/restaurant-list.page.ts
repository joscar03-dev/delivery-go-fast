import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController, AlertController } from '@ionic/angular';
import { Router, RouterLink } from '@angular/router';
import { RestaurantService } from '../../../services/restaurant.service';
import type { RestaurantModel } from '../../../models/restaurant.model';

@Component({
  selector: 'app-admin-restaurant-list',
  standalone: true,
  imports: [CommonModule, IonicModule, RouterLink],
  templateUrl: './restaurant-list.page.html',
})
export class AdminRestaurantListPage implements OnInit {
  private restaurants = inject(RestaurantService);
  private router = inject(Router);
  private toast = inject(ToastController);
  private alert = inject(AlertController);

  list: RestaurantModel[] = [];
  loading = false;

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.loading = true;
    this.restaurants.list().subscribe({
      next: (r) => {
        this.list = r;
        this.loading = false;
      },
      error: async () => {
        this.loading = false;
        const t = await this.toast.create({
          message: 'No se pudo cargar restaurantes',
          duration: 2000,
          color: 'danger',
        });
        t.present();
      },
    });
  }

  open(r: RestaurantModel) {
    this.router.navigate(['/restaurant', r.id]);
  }

  async remove(r: RestaurantModel) {
    const alert = await this.alert.create({
      header: 'Eliminar',
      message: `¿Eliminar ${r.name}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => this.confirmRemove(r.id),
        },
      ],
    });
    await alert.present();
  }

  private async confirmRemove(id: string) {
    this.restaurants.remove(id).subscribe({
      next: async () => {
        const t = await this.toast.create({
          message: 'Restaurante eliminado',
          duration: 1500,
          color: 'success',
        });
        t.present();
        this.load();
      },
      error: async (err) => {
        const t = await this.toast.create({
          message: err?.error?.message || 'Error al eliminar',
          duration: 2000,
          color: 'danger',
        });
        t.present();
      },
    });
  }
}
