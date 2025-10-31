import {
  Component,
  inject,
  OnInit,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonBackButton,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonIcon,
  IonChip,
  IonLabel,
  IonList,
  IonListHeader,
  IonItem,
  IonThumbnail,
  IonSpinner,
  IonButton,
  IonToast,
} from '@ionic/angular/standalone';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RestaurantService } from '../../services/restaurant.service';
import { CartService } from '../../services/cart.service';
import type {
  RestaurantModel,
  MenuItemModel,
} from '../../models/restaurant.model';
import { register } from 'swiper/element/bundle';
import { addIcons } from 'ionicons';
import {
  locationOutline,
  callOutline,
  restaurantOutline,
  pricetagOutline,
  addOutline,
} from 'ionicons/icons';

// Register Swiper custom elements
register();

// Register icons
addIcons({
  'location-outline': locationOutline,
  'call-outline': callOutline,
  'restaurant-outline': restaurantOutline,
  'pricetag-outline': pricetagOutline,
  'add-outline': addOutline,
});

@Component({
  selector: 'app-restaurant-detail',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonIcon,
    IonBackButton,
    IonChip,
    IonLabel,
    IonList,
    IonListHeader,
    IonItem,
    IonThumbnail,
    IonSpinner,
    IonButton,
    IonToast,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './restaurant-detail.page.html',
  styleUrls: ['./restaurant-detail.page.scss'],
})
export class RestaurantDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private restaurants = inject(RestaurantService);
  private cartService = inject(CartService);
  private router = inject(Router);
  restaurant?: RestaurantModel;
  loading = false;
  selectedMenuCategory: string | null = null;
  showToast = false;
  toastMessage = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.loading = true;
    this.restaurants.getById(id).subscribe({
      next: (r) => {
        this.restaurant = r;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  filterByCategory(categoryId: string | null) {
    this.selectedMenuCategory = categoryId;
  }

  get filteredMenuItems() {
    if (!this.restaurant?.menuItems) return [];
    if (!this.selectedMenuCategory) return this.restaurant.menuItems;

    return this.restaurant.menuItems.filter((item) => {
      const itemCategoryId = this.getItemCategoryId(item);
      return itemCategoryId === this.selectedMenuCategory;
    });
  }

  private getItemCategoryId(item: any): string | null {
    // Si menuCategoryId es un string, devolverlo directamente
    if (typeof item.menuCategoryId === 'string') {
      return item.menuCategoryId;
    }
    // Si category es un objeto, devolver su ID
    if (item.category && typeof item.category === 'object') {
      return item.category.id || null;
    }
    return null;
  }

  getCategoryName(categoryId?: string | null): string {
    if (!categoryId || !this.restaurant?.menuCategories) return '';
    const category = this.restaurant.menuCategories.find(
      (c) => c.id === categoryId
    );
    return category?.name || '';
  }

  getItemCategoryName(item: any): string {
    // Si el item tiene category como objeto, devolver su nombre directamente
    if (
      item.category &&
      typeof item.category === 'object' &&
      item.category.name
    ) {
      return item.category.name;
    }
    // Si no, buscar por ID
    const categoryId = this.getItemCategoryId(item);
    return this.getCategoryName(categoryId);
  }

  addToCart(menuItem: MenuItemModel): void {
    if (!this.restaurant) return;
    // En lugar de añadir directo, navegar a la página de detalle/customización
    this.router.navigate([
      '/restaurants',
      this.restaurant.id,
      'menu',
      menuItem.id,
    ]);
  }

  onToastDismiss(): void {
    this.showToast = false;
  }
}
