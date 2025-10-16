import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import {
  ToastController,
  AlertController,
  ModalController,
} from '@ionic/angular/standalone';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RestaurantService } from '../../../services/restaurant.service';

@Component({
  selector: 'app-admin-menu-categories',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule, RouterLink],
  templateUrl: './menu-categories.page.html',
})
export class AdminMenuCategoriesPage implements OnInit {
  private route = inject(ActivatedRoute);
  private restaurants = inject(RestaurantService);
  private toast = inject(ToastController);
  private alert = inject(AlertController);
  private modal = inject(ModalController);
  private fb = inject(FormBuilder);

  restaurantId!: string;
  restaurant?: any;
  list: any[] = [];
  loading = false;

  ngOnInit(): void {
    this.restaurantId = this.route.snapshot.paramMap.get('id')!;
    this.restaurants
      .getById(this.restaurantId)
      .subscribe({ next: (r) => (this.restaurant = r) });
    this.load();
  }

  load() {
    this.loading = true;
    this.restaurants.listMenuCategories(this.restaurantId).subscribe({
      next: (r) => {
        this.list = r;
        this.loading = false;
      },
      error: async () => {
        this.loading = false;
        (
          await this.toast.create({
            message: 'No se pudo cargar',
            duration: 1500,
            color: 'danger',
          })
        ).present();
      },
    });
  }

  async openCreateModal() {
    const modal = await this.modal.create({
      component: CreateMenuCategoryModalComponent,
      componentProps: {},
      breakpoints: [1],
      initialBreakpoint: 1,
      cssClass: 'modal-fullscreen',
    });
    await modal.present();
    const { data, role } = await modal.onDidDismiss();
    if (role === 'ok' && data) {
      this.restaurants.createMenuCategory(this.restaurantId, data).subscribe({
        next: async () => {
          (
            await this.toast.create({
              message: 'Categoría creada',
              duration: 1200,
              color: 'success',
            })
          ).present();
          this.load();
        },
        error: async (err) => {
          (
            await this.toast.create({
              message: err?.error?.message || 'Error',
              duration: 1500,
              color: 'danger',
            })
          ).present();
        },
      });
    }
  }

  // edición migra a modal más abajo

  async toggleActive(cat: any) {
    const desired = !cat.isActive;
    this.restaurants
      .updateMenuCategory(this.restaurantId, cat.id, { isActive: desired })
      .subscribe({
        next: async () => {
          (
            await this.toast.create({
              message: desired ? 'Activada' : 'Desactivada',
              duration: 1000,
            })
          ).present();
          this.load();
        },
        error: async (err) => {
          (
            await this.toast.create({
              message: err?.error?.message || 'Error',
              duration: 1500,
              color: 'danger',
            })
          ).present();
        },
      });
  }

  async edit(cat: any) {
    const modal = await this.modal.create({
      component: EditMenuCategoryModalComponent,
      componentProps: { category: cat },
      breakpoints: [1],
      initialBreakpoint: 1,
      cssClass: 'modal-fullscreen',
    });
    await modal.present();
    const { data, role } = await modal.onDidDismiss();
    if (role === 'ok' && data) {
      this.restaurants
        .updateMenuCategory(this.restaurantId, cat.id, data)
        .subscribe({
          next: async () => {
            (
              await this.toast.create({
                message: 'Actualizado',
                duration: 1200,
                color: 'success',
              })
            ).present();
            this.load();
          },
          error: async (err) => {
            (
              await this.toast.create({
                message: err?.error?.message || 'Error',
                duration: 1500,
                color: 'danger',
              })
            ).present();
          },
        });
    }
  }

  async remove(cat: any) {
    const a = await this.alert.create({
      header: 'Eliminar categoría',
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
    await a.present();
  }

  private confirmRemove(id: string) {
    this.restaurants.removeMenuCategory(this.restaurantId, id).subscribe({
      next: async () => {
        (
          await this.toast.create({
            message: 'Eliminado',
            duration: 1000,
            color: 'success',
          })
        ).present();
        this.load();
      },
      error: async (err) => {
        (
          await this.toast.create({
            message: err?.error?.message || 'Error',
            duration: 1500,
            color: 'danger',
          })
        ).present();
      },
    });
  }
}

@Component({
  selector: 'app-create-menu-category-modal',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Nueva categoría</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">Cancelar</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding" [fullscreen]="true">
      <form [formGroup]="form" (ngSubmit)="submit()">
        <ion-item>
          <ion-input
            label="Nombre"
            labelPlacement="stacked"
            formControlName="name"
            required
          ></ion-input>
        </ion-item>
        <ion-item>
          <ion-input
            label="Descripción"
            labelPlacement="stacked"
            formControlName="description"
          ></ion-input>
        </ion-item>
        <ion-item>
          <ion-input
            label="Orden"
            type="number"
            labelPlacement="stacked"
            formControlName="sortOrder"
          ></ion-input>
        </ion-item>
        <ion-button expand="block" type="submit" [disabled]="form.invalid"
          >Crear</ion-button
        >
      </form>
    </ion-content>
  `,
})
export class CreateMenuCategoryModalComponent {
  private fb = inject(FormBuilder);
  private modal = inject(ModalController);

  form = this.fb.nonNullable.group({
    name: this.fb.nonNullable.control<string>('', [Validators.required]),
    description: this.fb.control<string | null>(null),
    sortOrder: this.fb.control<number | null>(null),
  });

  dismiss() {
    this.modal.dismiss(null, 'cancel');
  }
  submit() {
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();
    const payload = {
      name: raw.name,
      description: raw.description ?? undefined,
      sortOrder: raw.sortOrder ?? undefined,
    };
    this.modal.dismiss(payload, 'ok');
  }
}

@Component({
  selector: 'app-edit-menu-category-modal',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Editar categoría</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">Cancelar</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding" [fullscreen]="true">
      <form [formGroup]="form" (ngSubmit)="submit()">
        <ion-item>
          <ion-input
            label="Nombre"
            labelPlacement="stacked"
            formControlName="name"
            required
          ></ion-input>
        </ion-item>
        <ion-item>
          <ion-input
            label="Descripción"
            labelPlacement="stacked"
            formControlName="description"
          ></ion-input>
        </ion-item>
        <ion-item>
          <ion-input
            label="Orden"
            type="number"
            labelPlacement="stacked"
            formControlName="sortOrder"
          ></ion-input>
        </ion-item>
        <ion-button expand="block" type="submit" [disabled]="form.invalid"
          >Guardar</ion-button
        >
      </form>
    </ion-content>
  `,
})
export class EditMenuCategoryModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private modal = inject(ModalController);

  category: any;

  form = this.fb.nonNullable.group({
    name: this.fb.nonNullable.control<string>('', [Validators.required]),
    description: this.fb.control<string | null>(null),
    sortOrder: this.fb.control<number | null>(null),
  });

  ngOnInit(): void {
    if (this.category) {
      this.form.patchValue({
        name: this.category.name,
        description: this.category.description ?? null,
        sortOrder: this.category.sortOrder ?? null,
      });
    }
  }

  dismiss() {
    this.modal.dismiss(null, 'cancel');
  }
  submit() {
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();
    const payload = {
      name: raw.name,
      description: raw.description ?? undefined,
      sortOrder: raw.sortOrder ?? undefined,
    };
    this.modal.dismiss(payload, 'ok');
  }
}
