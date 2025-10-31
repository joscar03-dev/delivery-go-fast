import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import {
  ToastController,
  AlertController,
  ModalController,
  ActionSheetController,
} from '@ionic/angular/standalone';
import { ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import {
  RestaurantService,
  CreateMenuItemDto,
  UpdateMenuItemDto,
} from '../../../services/restaurant.service';
import { addIcons } from 'ionicons';
import {
  createOutline,
  trashOutline,
  pricetagOutline,
  optionsOutline,
  ellipsisVertical,
} from 'ionicons/icons';

// Register icons
addIcons({
  'create-outline': createOutline,
  'trash-outline': trashOutline,
  'pricetag-outline': pricetagOutline,
  'options-outline': optionsOutline,
  'ellipsis-vertical': ellipsisVertical,
});

@Component({
  selector: 'app-admin-menu-items',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
  templateUrl: './menu-items.page.html',
  styleUrls: ['./menu-items.page.scss'],
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
        this.list = r || [];
        this.loading = false;
      },
      error: async (err) => {
        this.loading = false;
        (
          await this.toast.create({
            message: err?.error?.message || 'Error al cargar ítems',
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
      error: () => (this.loadingCategories = false),
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
    });
    await modal.present();
    const { data, role } = await modal.onDidDismiss();
    if (role !== 'ok' || !data) return;

    const payload = data as any;
    const updateItem = async (menuCategoryId?: string | null) => {
      const dto: CreateMenuItemDto = {
        name: payload.name,
        description: payload.description ?? undefined,
        price: Number(payload.price) || 0,
        imageUrl: payload.imageUrl ?? undefined,
        menuCategoryId: menuCategoryId ?? payload.menuCategoryId ?? undefined,
      };
      this.restaurants.createMenuItem(this.restaurantId, dto).subscribe({
        next: async () => {
          (
            await this.toast.create({
              message: 'Ítem creado',
              duration: 900,
              color: 'success',
            })
          ).present();
          this.load();
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
      this.restaurants.createMenuCategory(this.restaurantId, catDto).subscribe({
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

  async edit(item: any) {
    const modal = await this.modal.create({
      component: EditMenuItemModalComponent,
      componentProps: { item, categories: this.categories },
    });
    await modal.present();
    const { data, role } = await modal.onDidDismiss();
    if (role !== 'ok' || !data) return;
    const dto: UpdateMenuItemDto = {
      name: data.name,
      description: data.description ?? undefined,
      price: Number(data.price) || 0,
      imageUrl: data.imageUrl ?? undefined,
      menuCategoryId: data.menuCategoryId ?? undefined,
    };
    this.restaurants
      .updateMenuItem(this.restaurantId, item.id, dto)
      .subscribe({ next: () => this.load() });
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

  async openOptions(item: any) {
    const modal = await this.modal.create({
      component: ItemOptionsModalComponent,
      componentProps: { restaurantId: this.restaurantId, item },
      breakpoints: [1],
      initialBreakpoint: 1,
      cssClass: 'modal-fullscreen',
    });
    await modal.present();
    await modal.onDidDismiss();
    // No-op; podría refrescar si fuese necesario
  }
}

@Component({
  selector: 'app-item-options-modal',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
  templateUrl: './item-options-modal.component.html',
})
export class ItemOptionsModalComponent implements OnInit {
  private modal = inject(ModalController);
  private restaurants = inject(RestaurantService);
  private toast = inject(ToastController);
  private alert = inject(AlertController);
  private actionSheet = inject(ActionSheetController);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  restaurantId!: string;
  item!: any;
  groups: any[] = [];
  isAccordionVisible = true;
  // Controla la visibilidad del formulario de creación de grupo en el header
  showGroupForm = false;
  groupForm = this.fb.nonNullable.group({
    name: this.fb.nonNullable.control<string>('', []),
    description: this.fb.control<string | null>(null),
    minSelect: this.fb.nonNullable.control<number>(0, []),
    maxSelect: this.fb.nonNullable.control<number>(0, []),
    isRequired: this.fb.nonNullable.control<boolean>(false, []),
  });
  optionForm = this.fb.nonNullable.group({
    groupId: this.fb.nonNullable.control<string>('', []),
    name: this.fb.nonNullable.control<string>('', []),
    extraPrice: this.fb.nonNullable.control<number>(0, []),
  });

  ngOnInit(): void {
    if (!this.restaurantId || !this.item) return;
    this.loadGroups();
  }

  trackById(index: number, item: any): string {
    return item.id;
  }

  private forceAccordionRerender() {
    this.isAccordionVisible = false;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.isAccordionVisible = true;
      this.cdr.detectChanges();
    }, 50); // Un pequeño retardo para asegurar el ciclo de renderizado
  }

  private loadGroups() {
    this.restaurants.listOptionGroups(this.restaurantId).subscribe({
      next: (gs) => {
        this.groups = gs || [];
        this.forceAccordionRerender();
      },
    });
  }

  dismiss() {
    this.modal.dismiss(null, 'cancel');
  }

  isAttached(g: any): boolean {
    return !!(g.menuItems || []).find((mi: any) => mi.id === this.item.id);
  }

  async attach(g: any) {
    this.restaurants
      .attachGroupToItem(this.restaurantId, g.id, this.item.id)
      .subscribe({
        next: async () => {
          (
            await this.toast.create({
              message: 'Asignado',
              duration: 1000,
              color: 'success',
            })
          ).present();
          // Refrescar lista
          this.loadGroups();
        },
      });
  }

  async detach(g: any) {
    this.restaurants
      .detachGroupFromItem(this.restaurantId, g.id, this.item.id)
      .subscribe({
        next: async () => {
          (
            await this.toast.create({
              message: 'Quitado',
              duration: 1000,
              color: 'warning',
            })
          ).present();
          // Refrescar lista
          this.loadGroups();
        },
      });
  }

  async createGroup() {
    const raw = this.groupForm.getRawValue();
    this.restaurants
      .createOptionGroup(this.restaurantId, {
        name: raw.name,
        description: raw.description ?? undefined,
        minSelect: Number(raw.minSelect) || 0,
        maxSelect: Number(raw.maxSelect) || 0,
        isRequired: !!raw.isRequired,
      })
      .subscribe({
        next: async () => {
          (
            await this.toast.create({
              message: 'Grupo creado',
              duration: 1000,
              color: 'success',
            })
          ).present();
          this.groupForm.reset({
            name: '',
            description: null,
            minSelect: 0,
            maxSelect: 0,
            isRequired: false,
          });
          this.loadGroups();
        },
      });
  }

  async createOption() {
    const raw = this.optionForm.getRawValue();
    if (!raw.groupId) return;
    this.restaurants
      .addOptionToGroup(this.restaurantId, raw.groupId, {
        name: raw.name,
        extraPrice: Number(raw.extraPrice) || 0,
      })
      .subscribe({
        next: async () => {
          (
            await this.toast.create({
              message: 'Opción añadida',
              duration: 1000,
              color: 'success',
            })
          ).present();
          this.optionForm.reset({ groupId: '', name: '', extraPrice: 0 });
          this.loadGroups();
        },
      });
  }

  async editGroup(g: any) {
    const updated = await this.presentEditGroupPrompt(g);
    if (!updated) return;
    this.restaurants
      .updateOptionGroup(this.restaurantId, g.id, updated)
      .subscribe({
        next: async () => {
          (
            await this.toast.create({
              message: 'Grupo actualizado',
              duration: 1000,
              color: 'success',
            })
          ).present();
          this.loadGroups();
        },
      });
  }

  async removeGroup(g: any) {
    const ok = await this.confirm(
      `¿Borrar el grupo "${g.name}"? Esta acción no se puede deshacer.`
    );
    if (!ok) return;
    this.restaurants.removeOptionGroup(this.restaurantId, g.id).subscribe({
      next: async () => {
        (
          await this.toast.create({
            message: 'Grupo eliminado',
            duration: 1000,
            color: 'success',
          })
        ).present();
        this.loadGroups();
      },
    });
  }

  async editOption(g: any, o: any) {
    const updated = await this.presentEditOptionPrompt(o);
    if (!updated) return;
    this.restaurants
      .updateOptionInGroup(this.restaurantId, g.id, o.id, updated)
      .subscribe({
        next: async () => {
          (
            await this.toast.create({
              message: 'Opción actualizada',
              duration: 1000,
              color: 'success',
            })
          ).present();
          this.loadGroups();
        },
      });
  }

  async removeOption(g: any, o: any) {
    const ok = await this.confirm(`¿Borrar la opción "${o.name}"?`);
    if (!ok) return;
    this.restaurants
      .removeOptionFromGroup(this.restaurantId, g.id, o.id)
      .subscribe({
        next: async () => {
          (
            await this.toast.create({
              message: 'Opción eliminada',
              duration: 1000,
              color: 'success',
            })
          ).present();
          this.loadGroups();
        },
      });
  }

  async openOptionActions(g: any, o: any) {
    const sheet = await this.actionSheet.create({
      header: o.name,
      buttons: [
        {
          text: 'Editar',
          icon: 'create-outline',
          handler: () => this.editOption(g, o),
        },
        {
          text: 'Borrar',
          role: 'destructive',
          icon: 'trash-outline',
          handler: () => this.removeOption(g, o),
        },
        { text: 'Cancelar', role: 'cancel' },
      ],
    });
    await sheet.present();
  }

  async openGroupActions(g: any) {
    const attached = this.isAttached(g);
    const sheet = await this.actionSheet.create({
      header: g.name,
      buttons: [
        {
          text: 'Añadir opción',
          icon: 'pricetag-outline',
          handler: () => this.quickAddOption(g),
        },
        attached
          ? {
              text: 'Quitar de este ítem',
              role: 'destructive',
              icon: 'trash-outline',
              handler: () => this.detach(g),
            }
          : {
              text: 'Asignar a este ítem',
              icon: 'options-outline',
              handler: () => this.attach(g),
            },
        {
          text: 'Editar grupo',
          icon: 'create-outline',
          handler: () => this.editGroup(g),
        },
        {
          text: 'Borrar grupo',
          role: 'destructive',
          icon: 'trash-outline',
          handler: () => this.removeGroup(g),
        },
        { text: 'Cancelar', role: 'cancel' },
      ],
    });
    await sheet.present();
  }

  private async quickAddOption(g: any) {
    const created = await this.presentCreateOptionPrompt();
    if (!created) return;
    this.restaurants
      .addOptionToGroup(this.restaurantId, g.id, created)
      .subscribe({
        next: async () => {
          (
            await this.toast.create({
              message: 'Opción añadida',
              duration: 900,
              color: 'success',
            })
          ).present();
          this.loadGroups();
        },
        error: async (err) => {
          (
            await this.toast.create({
              message: err?.error?.message || 'Error al crear opción',
              duration: 1500,
              color: 'danger',
            })
          ).present();
        },
      });
  }

  toggleOptionActive(g: any, o: any, checked: boolean) {
    // Optimista: actualizar UI y revertir si falla
    const prev = o.isActive;
    o.isActive = checked;
    this.cdr.detectChanges(); // Forzar actualización optimista
    this.restaurants
      .updateOptionInGroup(this.restaurantId, g.id, o.id, { isActive: checked })
      .subscribe({
        next: async () => {
          (
            await this.toast.create({
              message: checked ? 'Opción activada' : 'Opción desactivada',
              duration: 800,
              color: 'success',
            })
          ).present();
        },
        error: async (err) => {
          o.isActive = prev;
          this.cdr.detectChanges(); // Revertir en UI
          (
            await this.toast.create({
              message: err?.error?.message || 'No se pudo actualizar el estado',
              duration: 1500,
              color: 'danger',
            })
          ).present();
        },
      });
  }

  private async presentEditGroupPrompt(g: any): Promise<any | null> {
    const alert = await this.alert.create({
      header: 'Editar grupo',
      inputs: [
        { name: 'name', type: 'text', placeholder: 'Nombre', value: g.name },
        {
          name: 'description',
          type: 'text',
          placeholder: 'Descripción',
          value: g.description || '',
        },
        {
          name: 'minSelect',
          type: 'number',
          placeholder: 'Mínimo',
          value: g.minSelect,
        },
        {
          name: 'maxSelect',
          type: 'number',
          placeholder: 'Máximo',
          value: g.maxSelect,
        },
        {
          name: 'isRequired',
          type: 'checkbox',
          label: 'Requerido',
          checked: !!g.isRequired,
        },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Guardar', role: 'confirm' },
      ],
    });
    await alert.present();
    const res = await alert.onDidDismiss();
    if (res.role !== 'confirm') return null;
    const v = res.data?.values || {};
    return {
      name: v.name?.trim() || g.name,
      description: v.description?.trim() || null,
      minSelect: Number(v.minSelect) || 0,
      maxSelect: Number(v.maxSelect) || 0,
      isRequired: !!v.isRequired,
    };
  }

  private async presentEditOptionPrompt(o: any): Promise<any | null> {
    const alert = await this.alert.create({
      header: 'Editar opción',
      inputs: [
        { name: 'name', type: 'text', placeholder: 'Nombre', value: o.name },
        {
          name: 'extraPrice',
          type: 'number',
          placeholder: 'Precio extra',
          value: o.extraPrice,
        },
        {
          name: 'isActive',
          type: 'checkbox',
          label: 'Activa',
          checked: o.isActive !== false,
        },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Guardar', role: 'confirm' },
      ],
    });
    await alert.present();
    const res = await alert.onDidDismiss();
    if (res.role !== 'confirm') return null;
    const v = res.data?.values || {};
    return {
      name: v.name?.trim() || o.name,
      extraPrice: Number(v.extraPrice) || 0,
      isActive: !!v.isActive,
    };
  }

  private async presentCreateOptionPrompt(): Promise<{
    name: string;
    extraPrice?: number;
    isActive?: boolean;
  } | null> {
    const alert = await this.alert.create({
      header: 'Nueva opción',
      inputs: [
        { name: 'name', type: 'text', placeholder: 'Nombre' },
        {
          name: 'extraPrice',
          type: 'number',
          placeholder: 'Precio extra',
          value: 0,
        },
        {
          name: 'isActive',
          type: 'checkbox',
          label: 'Activa',
          checked: true,
        },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Crear', role: 'confirm' },
      ],
    });
    await alert.present();
    const res = await alert.onDidDismiss();
    if (res.role !== 'confirm') return null;
    const v = res.data?.values || {};
    const name = (v.name || '').toString().trim();
    if (!name) {
      return null;
    }
    return {
      name,
      extraPrice: Number(v.extraPrice) || 0,
      isActive: !!v.isActive,
    };
  }

  private async confirm(message: string): Promise<boolean> {
    const alert = await this.alert.create({
      header: 'Confirmación',
      message,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Sí, borrar', role: 'confirm' },
      ],
    });
    await alert.present();
    const res = await alert.onDidDismiss();
    return res.role === 'confirm';
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
          <ion-label position="stacked">Imagen del Producto</ion-label>
          <input
            type="file"
            accept="image/*"
            (change)="onImageSelected($event)"
            style="margin-top: 10px;"
          />
        </ion-item>
        <ion-item *ngIf="imagePreview" lines="none">
          <div style="width: 100%; text-align: center; padding: 10px;">
            <img
              [src]="imagePreview"
              alt="Preview"
              style="max-width: 200px; max-height: 150px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"
            />
            <ion-button
              fill="clear"
              color="danger"
              (click)="clearImage()"
              size="small"
            >
              <ion-icon name="trash-outline"></ion-icon>
              Eliminar
            </ion-button>
          </div>
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
  private toast = inject(ToastController);

  categories: Array<{ id: string; name: string }> = [];
  imagePreview: string | null = null;

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

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      if (!file.type.startsWith('image/')) {
        this.toast
          .create({
            message: 'Por favor selecciona un archivo de imagen',
            duration: 2000,
            color: 'warning',
          })
          .then((t) => t.present());
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        this.toast
          .create({
            message: 'La imagen no debe superar los 5MB',
            duration: 2000,
            color: 'warning',
          })
          .then((t) => t.present());
        return;
      }

      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const base64 = e.target?.result as string;
        this.imagePreview = base64;
        this.form.patchValue({ imageUrl: base64 });
      };
      reader.readAsDataURL(file);
    }
  }

  clearImage() {
    this.imagePreview = null;
    this.form.patchValue({ imageUrl: null });
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
          <ion-label position="stacked">Imagen del Producto</ion-label>
          <input
            type="file"
            accept="image/*"
            (change)="onImageSelected($event)"
            style="margin-top: 10px;"
          />
        </ion-item>
        <ion-item *ngIf="imagePreview" lines="none">
          <div style="width: 100%; text-align: center; padding: 10px;">
            <img
              [src]="imagePreview"
              alt="Preview"
              style="max-width: 200px; max-height: 150px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"
            />
            <ion-button
              fill="clear"
              color="danger"
              (click)="clearImage()"
              size="small"
            >
              <ion-icon name="trash-outline"></ion-icon>
              Eliminar
            </ion-button>
          </div>
        </ion-item>
        <ion-item>
          <ion-select
            label="Categoría de menú"
            labelPlacement="stacked"
            formControlName="menuCategoryId"
          >
            <ion-select-option [value]="null"
              >— Sin categoría —</ion-select-option
            >
            <ion-select-option *ngFor="let c of categories" [value]="c.id">{{
              c.name
            }}</ion-select-option>
          </ion-select>
        </ion-item>
        <ion-button expand="block" type="submit" [disabled]="form.invalid"
          >Guardar</ion-button
        >
      </form>
    </ion-content>
  `,
})
export class EditMenuItemModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private modalCtrl = inject(ModalController);
  private toast = inject(ToastController);

  item!: any;
  categories: Array<{ id: string; name: string }> = [];
  imagePreview: string | null = null;

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
    if (!this.item) return;

    // Extraer el menuCategoryId del objeto category si existe
    const menuCategoryId =
      this.item.menuCategoryId || this.item.category?.id || null;

    // Debug: verificar qué datos vienen
    console.log('Item en modal de edición:', this.item);
    console.log('Categorías disponibles:', this.categories);
    console.log('category del item:', this.item.category);
    console.log('menuCategoryId extraído:', menuCategoryId);

    this.form.patchValue({
      name: this.item.name,
      description: this.item.description,
      price: this.item.price,
      imageUrl: this.item.imageUrl,
      menuCategoryId: menuCategoryId,
    });

    if (this.item.imageUrl) {
      this.imagePreview = this.item.imageUrl;
    }
  }
  dismiss() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      if (!file.type.startsWith('image/')) {
        this.toast
          .create({
            message: 'Por favor selecciona un archivo de imagen',
            duration: 2000,
            color: 'warning',
          })
          .then((t) => t.present());
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        this.toast
          .create({
            message: 'La imagen no debe superar los 5MB',
            duration: 2000,
            color: 'warning',
          })
          .then((t) => t.present());
        return;
      }

      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const base64 = e.target?.result as string;
        this.imagePreview = base64;
        this.form.patchValue({ imageUrl: base64 });
      };
      reader.readAsDataURL(file);
    }
  }

  clearImage() {
    this.imagePreview = null;
    this.form.patchValue({ imageUrl: null });
  }

  submit() {
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();
    this.modalCtrl.dismiss(
      {
        name: raw.name,
        description: raw.description ?? undefined,
        price: raw.price,
        imageUrl: raw.imageUrl ?? undefined,
        menuCategoryId: raw.menuCategoryId ?? undefined,
      },
      'ok'
    );
  }
}
