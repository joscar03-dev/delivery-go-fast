import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonicModule,
  ToastController,
  AlertController,
  ModalController,
} from '@ionic/angular';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import {
  RestaurantService,
  CreateMenuItemDto,
  UpdateMenuItemDto,
} from '../../../services/restaurant.service';

@Component({
  selector: 'app-admin-menu-items',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule, RouterLink],
  templateUrl: './menu-items.page.html',
})
export class AdminMenuItemsPage implements OnInit {
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
  categories: Array<{ id: string; name: string }> = [];
  loadingCategories = false;

  form = this.fb.nonNullable.group({
    name: this.fb.nonNullable.control<string>('', [Validators.required]),
    description: this.fb.control<string | null>(null),
    price: this.fb.nonNullable.control<number>(0, {
      validators: [Validators.required, Validators.min(0)],
    }),
    imageUrl: this.fb.control<string | null>(null),
    menuCategoryId: this.fb.control<string | null>(null),
  });

  ngOnInit(): void {
    this.restaurantId = this.route.snapshot.paramMap.get('id')!;
    this.load();
    this.loadCategories();
    this.restaurants
      .getById(this.restaurantId)
      .subscribe({ next: (r) => (this.restaurant = r) });
  }

  load() {
    this.loading = true;
    this.restaurants.listMenu(this.restaurantId).subscribe({
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

  loadCategories() {
    this.loadingCategories = true;
    this.restaurants.listMenuCategories(this.restaurantId).subscribe({
      next: (cats) => {
        this.categories = (cats || []).map((c: any) => ({
          id: c.id,
          name: c.name,
        }));
        this.loadingCategories = false;
      },
      error: async () => {
        this.categories = [];
        this.loadingCategories = false;
        (
          await this.toast.create({
            message: 'No se pudieron cargar categorías',
            duration: 1500,
            color: 'warning',
          })
        ).present();
      },
    });
  }

  getCategoryName(categoryId?: string | null): string | undefined {
    if (!categoryId) return undefined;
    return this.categories.find((c) => c.id === categoryId)?.name;
  }

  async openCreateModal() {
    const modal = await this.modal.create({
      component: CreateMenuItemModalComponent,
      componentProps: { categories: this.categories },
      breakpoints: [1],
      initialBreakpoint: 1,
      cssClass: 'modal-fullscreen',
    });
    await modal.present();
    const { data, role } = await modal.onDidDismiss();
    if (role === 'ok' && data) {
      const payload = data as any;
      const createItem = async (menuCategoryId?: string) => {
        const itemData: CreateMenuItemDto = {
          name: payload.name,
          description: payload.description ?? undefined,
          price: Number(payload.price),
          imageUrl: payload.imageUrl ?? undefined,
          menuCategoryId: menuCategoryId ?? payload.menuCategoryId ?? undefined,
        };
        this.restaurants.createMenuItem(this.restaurantId, itemData).subscribe({
          next: async () => {
            (
              await this.toast.create({
                message: 'Ítem creado',
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
      };

      if (payload.newCategory?.name) {
        const catDto = {
          name: payload.newCategory.name as string,
          description: payload.newCategory.description ?? undefined,
          sortOrder:
            payload.newCategory.sortOrder != null
              ? Number(payload.newCategory.sortOrder)
              : undefined,
        };
        this.restaurants
          .createMenuCategory(this.restaurantId, catDto)
          .subscribe({
            next: async (cat) => {
              (
                await this.toast.create({
                  message: 'Categoría creada',
                  duration: 900,
                  color: 'success',
                })
              ).present();
              this.loadCategories();
              await createItem(cat?.id);
            },
            error: async (err) => {
              (
                await this.toast.create({
                  message: err?.error?.message || 'Error al crear categoría',
                  duration: 1500,
                  color: 'danger',
                })
              ).present();
            },
          });
      } else {
        await createItem();
      }
    }
  }

  async edit(item: any) {
    const modal = await this.modal.create({
      component: EditMenuItemModalComponent,
      componentProps: { item, categories: this.categories },
      breakpoints: [1],
      initialBreakpoint: 1,
      cssClass: 'modal-fullscreen',
    });
    await modal.present();
    const { data, role } = await modal.onDidDismiss();
    if (role === 'ok' && data) {
      const payload = data as any;
      const updateItem = async (menuCategoryId?: string) => {
        const dto: UpdateMenuItemDto = {
          name: payload.name,
          description: payload.description ?? undefined,
          price: payload.price != null ? Number(payload.price) : undefined,
          imageUrl: payload.imageUrl ?? undefined,
          menuCategoryId: menuCategoryId ?? payload.menuCategoryId ?? undefined,
        };
        this.restaurants
          .updateMenuItem(this.restaurantId, item.id, dto)
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
      };

      if (payload.newCategory?.name) {
        const catDto = {
          name: payload.newCategory.name as string,
          description: payload.newCategory.description ?? undefined,
          sortOrder:
            payload.newCategory.sortOrder != null
              ? Number(payload.newCategory.sortOrder)
              : undefined,
        };
        this.restaurants
          .createMenuCategory(this.restaurantId, catDto)
          .subscribe({
            next: async (cat) => {
              (
                await this.toast.create({
                  message: 'Categoría creada',
                  duration: 900,
                  color: 'success',
                })
              ).present();
              this.loadCategories();
              await updateItem(cat?.id);
            },
            error: async (err) => {
              (
                await this.toast.create({
                  message: err?.error?.message || 'Error al crear categoría',
                  duration: 1500,
                  color: 'danger',
                })
              ).present();
            },
          });
      } else {
        await updateItem();
      }
    }
  }

  async remove(item: any) {
    const a = await this.alert.create({
      header: 'Eliminar',
      message: `¿Eliminar ${item.name}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => this.confirmRemove(item.id),
        },
      ],
    });
    await a.present();
  }

  private confirmRemove(id: string) {
    this.restaurants.removeMenuItem(this.restaurantId, id).subscribe({
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
  selector: 'app-create-menu-item-modal',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Nuevo ítem</ion-title>
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
            label="Precio"
            type="number"
            labelPlacement="stacked"
            formControlName="price"
          ></ion-input>
        </ion-item>
        <ion-item>
          <ion-input
            label="URL de imagen"
            labelPlacement="stacked"
            formControlName="imageUrl"
          ></ion-input>
        </ion-item>
        <ion-item>
          <ion-select
            label="Categoría de menú"
            labelPlacement="stacked"
            formControlName="menuCategoryId"
            *ngIf="!form.controls.createNewCategory.value"
          >
            <ion-select-option [value]="null"
              >— Sin categoría —</ion-select-option
            >
            <ion-select-option *ngFor="let c of categories" [value]="c.id">{{
              c.name
            }}</ion-select-option>
          </ion-select>
        </ion-item>
        <ion-item lines="full">
          <ion-toggle formControlName="createNewCategory"
            >Crear nueva categoría de menú</ion-toggle
          >
        </ion-item>
        <ng-container *ngIf="form.controls.createNewCategory.value">
          <ion-item>
            <ion-input
              label="Nombre de nueva categoría"
              labelPlacement="stacked"
              formControlName="newCategoryName"
            ></ion-input>
          </ion-item>
          <ion-item>
            <ion-input
              label="Descripción de nueva categoría"
              labelPlacement="stacked"
              formControlName="newCategoryDescription"
            ></ion-input>
          </ion-item>
          <ion-item>
            <ion-input
              label="Orden"
              type="number"
              labelPlacement="stacked"
              formControlName="newCategorySortOrder"
            ></ion-input>
          </ion-item>
        </ng-container>
        <ion-button expand="block" type="submit" [disabled]="form.invalid"
          >Crear</ion-button
        >
      </form>
    </ion-content>
  `,
})
export class CreateMenuItemModalComponent {
  private fb = inject(FormBuilder);
  private modal = inject(ModalController);

  categories: Array<{ id: string; name: string }> = [];

  form = this.fb.nonNullable.group({
    name: this.fb.nonNullable.control<string>('', [Validators.required]),
    description: this.fb.control<string | null>(null),
    price: this.fb.nonNullable.control<number>(0, {
      validators: [Validators.required, Validators.min(0)],
    }),
    imageUrl: this.fb.control<string | null>(null),
    menuCategoryId: this.fb.control<string | null>(null),
    createNewCategory: this.fb.nonNullable.control<boolean>(false),
    newCategoryName: this.fb.control<string | null>(null),
    newCategoryDescription: this.fb.control<string | null>(null),
    newCategorySortOrder: this.fb.control<number | null>(null),
  });

  dismiss() {
    this.modal.dismiss(null, 'cancel');
  }
  submit() {
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();
    const payload: any = {
      name: raw.name,
      description: raw.description ?? undefined,
      price: raw.price,
      imageUrl: raw.imageUrl ?? undefined,
      menuCategoryId: raw.menuCategoryId ?? undefined,
    };
    if (raw.createNewCategory && raw.newCategoryName) {
      payload.newCategory = {
        name: raw.newCategoryName,
        description: raw.newCategoryDescription ?? undefined,
        sortOrder:
          raw.newCategorySortOrder != null
            ? Number(raw.newCategorySortOrder)
            : undefined,
      };
      delete payload.menuCategoryId;
    }
    this.modal.dismiss(payload, 'ok');
  }
}

@Component({
  selector: 'app-edit-menu-item-modal',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Editar ítem</ion-title>
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
            label="Precio"
            type="number"
            labelPlacement="stacked"
            formControlName="price"
          ></ion-input>
        </ion-item>
        <ion-item>
          <ion-input
            label="URL de imagen"
            labelPlacement="stacked"
            formControlName="imageUrl"
          ></ion-input>
        </ion-item>
        <ion-item>
          <ion-select
            label="Categoría de menú"
            labelPlacement="stacked"
            formControlName="menuCategoryId"
            *ngIf="!form.controls.createNewCategory.value"
          >
            <ion-select-option [value]="null"
              >— Sin categoría —</ion-select-option
            >
            <ion-select-option *ngFor="let c of categories" [value]="c.id">{{
              c.name
            }}</ion-select-option>
          </ion-select>
        </ion-item>
        <ion-item lines="full">
          <ion-toggle formControlName="createNewCategory"
            >Crear nueva categoría de menú</ion-toggle
          >
        </ion-item>
        <ng-container *ngIf="form.controls.createNewCategory.value">
          <ion-item>
            <ion-input
              label="Nombre de nueva categoría"
              labelPlacement="stacked"
              formControlName="newCategoryName"
            ></ion-input>
          </ion-item>
          <ion-item>
            <ion-input
              label="Descripción de nueva categoría"
              labelPlacement="stacked"
              formControlName="newCategoryDescription"
            ></ion-input>
          </ion-item>
          <ion-item>
            <ion-input
              label="Orden"
              type="number"
              labelPlacement="stacked"
              formControlName="newCategorySortOrder"
            ></ion-input>
          </ion-item>
        </ng-container>
        <ion-button expand="block" type="submit" [disabled]="form.invalid"
          >Guardar</ion-button
        >
      </form>
    </ion-content>
  `,
})
export class EditMenuItemModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private modal = inject(ModalController);

  item: any;
  categories: Array<{ id: string; name: string }> = [];

  form = this.fb.nonNullable.group({
    name: this.fb.nonNullable.control<string>('', [Validators.required]),
    description: this.fb.control<string | null>(null),
    price: this.fb.nonNullable.control<number>(0, {
      validators: [Validators.required, Validators.min(0)],
    }),
    imageUrl: this.fb.control<string | null>(null),
    menuCategoryId: this.fb.control<string | null>(null),
    createNewCategory: this.fb.nonNullable.control<boolean>(false),
    newCategoryName: this.fb.control<string | null>(null),
    newCategoryDescription: this.fb.control<string | null>(null),
    newCategorySortOrder: this.fb.control<number | null>(null),
  });

  ngOnInit(): void {
    if (this.item) {
      this.form.patchValue({
        name: this.item.name ?? '',
        description: this.item.description ?? null,
        price: this.item.price ?? 0,
        imageUrl: this.item.imageUrl ?? null,
        menuCategoryId: this.item.menuCategoryId ?? null,
      });
    }
  }

  dismiss() {
    this.modal.dismiss(null, 'cancel');
  }

  submit() {
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();
    const payload: any = {
      name: raw.name,
      description: raw.description ?? undefined,
      price: raw.price,
      imageUrl: raw.imageUrl ?? undefined,
      menuCategoryId: raw.menuCategoryId ?? undefined,
    };
    if (raw.createNewCategory && raw.newCategoryName) {
      payload.newCategory = {
        name: raw.newCategoryName,
        description: raw.newCategoryDescription ?? undefined,
        sortOrder:
          raw.newCategorySortOrder != null
            ? Number(raw.newCategorySortOrder)
            : undefined,
      };
      delete payload.menuCategoryId;
    }
    this.modal.dismiss(payload, 'ok');
  }
}
