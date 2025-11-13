import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonMenuButton,
  IonTitle,
  IonContent,
  IonButton,
  IonList,
  IonItem,
  IonLabel,
  IonSpinner,
  IonIcon,
  IonActionSheet,
  IonMenu,
  IonBadge,
  IonRefresher,
  IonRefresherContent,
  ToastController,
  AlertController,
} from '@ionic/angular/standalone';
import { Router, RouterLink } from '@angular/router';
import { RestaurantService } from '../../../services/restaurant.service';
import type { RestaurantModel } from '../../../models/restaurant.model';
import { addIcons } from 'ionicons';
import {
  ellipsisVertical,
  eye,
  create,
  restaurant,
  list,
  trash,
  close,
  addCircle,
  pricetags,
  refresh,
  checkmarkCircle,
  closeCircle,
} from 'ionicons/icons';

// Register icons
addIcons({
  'ellipsis-vertical': ellipsisVertical,
  eye: eye,
  create: create,
  restaurant: restaurant,
  list: list,
  trash: trash,
  close: close,
  'add-circle': addCircle,
  pricetags: pricetags,
  refresh: refresh,
  'checkmark-circle': checkmarkCircle,
  'close-circle': closeCircle,
});

@Component({
  selector: 'app-admin-restaurant-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonMenuButton,
    IonTitle,
    IonContent,
    IonButton,
    IonList,
    IonItem,
    IonLabel,
    IonSpinner,
    IonIcon,
    IonActionSheet,
    IonMenu,
    IonBadge,
    IonRefresher,
    IonRefresherContent,
  ],
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
    this.restaurants.listAll().subscribe({
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

  handleRefresh(event: any) {
    this.restaurants.listAll().subscribe({
      next: (r) => {
        this.list = r;
        event.target.complete();
      },
      error: async () => {
        event.target.complete();
        const t = await this.toast.create({
          message: 'No se pudo recargar restaurantes',
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

  getActionSheetButtons(r: RestaurantModel) {
    return [
      {
        text: 'Ver Restaurante',
        icon: 'eye',
        handler: () => {
          this.open(r);
        },
      },
      {
        text: 'Editar',
        icon: 'create',
        handler: () => {
          this.router.navigate(['/admin/restaurants/form'], {
            queryParams: { id: r.id },
          });
        },
      },
      {
        text: r.isActive ? 'Desactivar' : 'Activar',
        icon: r.isActive ? 'close-circle' : 'checkmark-circle',
        handler: () => {
          this.toggleActive(r);
        },
      },
      {
        text: 'Menú: Categorías',
        icon: 'restaurant',
        handler: () => {
          this.router.navigate(['/admin/restaurants', r.id, 'menu-categories']);
        },
      },
      {
        text: 'Menú: Ítems',
        icon: 'list',
        handler: () => {
          this.router.navigate(['/admin/restaurants', r.id, 'menu-items']);
        },
      },
      {
        text: 'Eliminar',
        role: 'destructive',
        icon: 'trash',
        handler: () => {
          this.remove(r);
        },
      },
      {
        text: 'Cancelar',
        role: 'cancel',
        icon: 'close',
      },
    ];
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

  /**
   * Activar o desactivar restaurante
   */
  async toggleActive(r: RestaurantModel) {
    const newStatus = !r.isActive;
    const action = newStatus ? 'activar' : 'desactivar';

    const alert = await this.alert.create({
      header: `${action.charAt(0).toUpperCase() + action.slice(1)} restaurante`,
      message: `¿Estás seguro de ${action} "${r.name}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          handler: () => this.confirmToggleActive(r.id, newStatus),
        },
      ],
    });
    await alert.present();
  }

  private async confirmToggleActive(id: string, isActive: boolean) {
    this.restaurants.toggleActive(id, isActive).subscribe({
      next: async () => {
        const t = await this.toast.create({
          message: `Restaurante ${
            isActive ? 'activado' : 'desactivado'
          } correctamente`,
          duration: 1500,
          color: 'success',
        });
        t.present();
        this.load(); // Recargar lista
      },
      error: async (err) => {
        const t = await this.toast.create({
          message: err?.error?.message || 'Error al cambiar estado',
          duration: 2000,
          color: 'danger',
        });
        t.present();
      },
    });
  }
}
