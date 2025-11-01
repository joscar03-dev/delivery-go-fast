import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonButton,
  IonIcon,
  IonSpinner,
  IonToast,
  IonList,
  IonListHeader,
  IonRadioGroup,
  IonRadio,
  IonCheckbox,
  IonNote,
} from '@ionic/angular/standalone';
import { ActivatedRoute, Router } from '@angular/router';
import { RestaurantService } from '../../services/restaurant.service';
import { CartService } from '../../services/cart.service';
import type { MenuItemModel } from '../../models/restaurant.model';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { cartOutline } from 'ionicons/icons';

addIcons({ 'cart-outline': cartOutline });

@Component({
  selector: 'app-menu-item-detail',
  standalone: true,
  templateUrl: './menu-item-detail.page.html',
  styleUrls: ['./menu-item-detail.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent,
    IonList,
    IonListHeader,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonButton,
    IonIcon,
    IonRadioGroup,
    IonRadio,
    IonCheckbox,
    IonNote,
    IonSpinner,
    IonToast,
  ],
})
export class MenuItemDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private restaurants = inject(RestaurantService);
  private cart = inject(CartService);
  private router = inject(Router);

  restaurantId!: string;
  itemId!: string;
  item?: MenuItemModel;
  loading = false;
  quantity = 1;
  comment: string = '';
  // Opciones libres: puedes reemplazar esto por UI de checkboxes/selects según tus necesidades
  options: Record<string, any> = {};

  // Grupos de opciones asignados a este ítem
  groups: Array<{
    id: string;
    name: string;
    description?: string;
    isRequired: boolean;
    minSelect: number;
    maxSelect: number; // 0 = ilimitado
    options: Array<{
      id: string;
      name: string;
      extraPrice: number;
      isActive?: boolean;
    }>;
  }> = [];

  // Selecciones por grupo: set de optionIds
  selections: Record<string, Set<string>> = {};

  showToast = false;
  toastMessage = '';

  ngOnInit(): void {
    const rId = this.route.snapshot.paramMap.get('restaurantId');
    const iId = this.route.snapshot.paramMap.get('itemId');
    if (!rId || !iId) return;
    this.restaurantId = rId;
    this.itemId = iId;
    this.load();
  }

  load() {
    this.loading = true;
    this.restaurants.getMenuItem(this.restaurantId, this.itemId).subscribe({
      next: (it) => {
        this.item = {
          id: it.id,
          name: it.name,
          description: it.description,
          price: Number(it.price),
          imageUrl: it.imageUrl,
          restaurantId: it.restaurant?.id || this.restaurantId,
          menuCategoryId: it.category?.id,
        } as MenuItemModel;
        // Cargar grupos y filtrar los que estén asociados a este ítem
        this.restaurants.listOptionGroups(this.restaurantId).subscribe({
          next: (gs: any[]) => {
            const filtered = (gs || []).filter((g) =>
              (g.menuItems || []).some((mi: any) => mi.id === this.itemId)
            );
            this.groups = filtered.map((g) => ({
              id: g.id,
              name: g.name,
              description: g.description,
              isRequired: !!g.isRequired,
              minSelect: Number(g.minSelect) || 0,
              maxSelect: Number(g.maxSelect) || 0,
              options: (g.options || []).map((o: any) => ({
                id: o.id,
                name: o.name,
                extraPrice: Number(o.extraPrice) || 0,
                isActive: o.isActive,
              })),
            }));
            // Inicializar selecciones
            this.selections = {};
            this.groups.forEach((g) => (this.selections[g.id] = new Set()));
            this.loading = false;
          },
          error: () => (this.loading = false),
        });
      },
      error: () => (this.loading = false),
    });
  }

  onOptionsChange(raw: string | null | undefined) {
    if (typeof raw !== 'string' || !raw.trim()) {
      this.options = {};
      return;
    }
    try {
      this.options = JSON.parse(raw);
    } catch {
      // Si no es JSON válido, no rompas la UI
      this.options = {};
    }
  }

  // Helpers de selección
  isChecked(groupId: string, optionId: string): boolean {
    return !!this.selections[groupId]?.has(optionId);
  }

  onCheckboxChange(group: any, option: any, checked: boolean) {
    const set = this.selections[group.id] || new Set<string>();
    if (checked) {
      if (group.maxSelect > 0 && set.size >= group.maxSelect) {
        // No permitir exceder máximo
        return;
      }
      set.add(option.id);
    } else {
      set.delete(option.id);
    }
    this.selections[group.id] = set;
  }

  onRadioChange(groupId: string, optionId: string) {
    const set = new Set<string>();
    if (optionId) set.add(optionId);
    this.selections[groupId] = set;
  }

  selectedCount(groupId: string): number {
    return this.selections[groupId]?.size || 0;
  }

  groupValid(g: any): boolean {
    const count = this.selectedCount(g.id);
    const min = g.isRequired ? Math.max(1, g.minSelect || 0) : g.minSelect || 0;
    const max = g.maxSelect || 0; // 0 = sin límite
    if (count < min) return false;
    if (max > 0 && count > max) return false;
    return true;
  }

  allValid(): boolean {
    return this.groups.every((g) => this.groupValid(g));
  }

  get extraPriceTotal(): number {
    let total = 0;
    for (const g of this.groups) {
      const set = this.selections[g.id];
      if (!set) continue;
      for (const optId of Array.from(set)) {
        const opt = g.options.find((o) => o.id === optId);
        if (opt) total += Number(opt.extraPrice) || 0;
      }
    }
    return total;
  }

  get displayedUnitPrice(): number {
    return (this.item?.price || 0) + this.extraPriceTotal;
  }

  addToCart(goToCheckout = false) {
    if (!this.item) return;
    if (!this.allValid()) {
      this.toastMessage = 'Selecciona opciones válidas según las reglas';
      this.showToast = true;
      return;
    }
    if (!this.cart.canAddFrom(this.item.restaurantId)) {
      // Si es de otro restaurante, limpiar y continuar
      this.cart.clearCart();
    }

    // Construir payload OPTIMIZADO de opciones seleccionadas (solo lo necesario)
    const selectedGroups = this.groups
      .map((g) => {
        const selectedOptions = g.options
          .filter((o) => this.selections[g.id]?.has(o.id))
          .map((o) => ({
            id: o.id,
            name: o.name,
            extraPrice: o.extraPrice,
          }));

        return selectedOptions.length > 0
          ? {
              groupId: g.id,
              groupName: g.name,
              options: selectedOptions,
            }
          : null;
      })
      .filter(Boolean); // Eliminar grupos sin selecciones

    const selectedPayload =
      selectedGroups.length > 0 ? { groups: selectedGroups } : undefined;

    this.cart.addItem(this.item, '', {
      comment: this.comment?.trim() || undefined,
      options: selectedPayload,
      quantity: this.quantity,
    });
    this.toastMessage = 'Agregado al carrito';
    this.showToast = true;
    if (goToCheckout) {
      this.router.navigate(['/cart']);
    }
  }
}
