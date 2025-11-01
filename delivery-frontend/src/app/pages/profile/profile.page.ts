import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonButton,
  IonSpinner,
  IonText,
  IonList,
  IonListHeader,
  IonItem,
  IonToggle,
  IonIcon,
  IonLabel,
  ModalController,
  AlertController,
  ToastController,
} from '@ionic/angular/standalone';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { AddressService } from '../../services/address.service';
import { AddressFormComponent } from '../../components/address-form/address-form.component';
import type { User } from '../../models/user.model';
import type { Address } from '../../models/address.model';
import { addIcons } from 'ionicons';
import {
  moonOutline,
  receiptOutline,
  chevronForwardOutline,
  locationOutline,
  addOutline,
  createOutline,
  trashOutline,
} from 'ionicons/icons';

// Register icons
addIcons({
  'moon-outline': moonOutline,
  'receipt-outline': receiptOutline,
  'chevron-forward-outline': chevronForwardOutline,
  'location-outline': locationOutline,
  'add-outline': addOutline,
  'create-outline': createOutline,
  'trash-outline': trashOutline,
});

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonButton,
    IonSpinner,
    IonText,
    IonList,
    IonListHeader,
    IonItem,
    IonToggle,
    IonIcon,
    IonLabel,
  ],
  templateUrl: './profile.page.html',
})
export class ProfilePage implements OnInit {
  private userService = inject(UserService);
  private auth = inject(AuthService);
  private addressService = inject(AddressService);
  private modalCtrl = inject(ModalController);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);

  user?: User;
  loading = false;
  paletteToggle = false;

  // Direcciones
  addresses: Address[] = [];
  loadingAddresses = false;

  ngOnInit(): void {
    this.loading = true;
    this.userService.getProfile().subscribe({
      next: (u) => {
        this.user = u;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });

    // Cargar direcciones
    this.loadAddresses();

    // Use matchMedia to check the user preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

    // Initialize the dark palette based on the initial
    // value of the prefers-color-scheme media query
    this.initializeDarkPalette(prefersDark.matches);

    // Listen for changes to the prefers-color-scheme media query
    prefersDark.addEventListener('change', (mediaQuery) =>
      this.initializeDarkPalette(mediaQuery.matches)
    );
  }

  // Check/uncheck the toggle and update the palette based on isDark
  initializeDarkPalette(isDark: boolean) {
    this.paletteToggle = isDark;
    this.toggleDarkPalette(isDark);
  }

  // Listen for the toggle check/uncheck to toggle the dark palette
  toggleChange(event: CustomEvent) {
    this.toggleDarkPalette(event.detail.checked);
  }

  // Add or remove the "ion-palette-dark" class on the html element
  toggleDarkPalette(shouldAdd: boolean) {
    document.documentElement.classList.toggle('ion-palette-dark', shouldAdd);
  }

  logout() {
    this.auth.logout();
  }

  /**
   * Carga las direcciones del usuario
   */
  loadAddresses() {
    this.loadingAddresses = true;
    this.addressService.getMyAddresses().subscribe({
      next: (addresses) => {
        this.addresses = addresses;
        this.loadingAddresses = false;
      },
      error: async (error) => {
        console.error('Error loading addresses:', error);
        this.loadingAddresses = false;
        const toast = await this.toastCtrl.create({
          message: 'Error al cargar direcciones',
          duration: 2000,
          color: 'danger',
        });
        await toast.present();
      },
    });
  }

  /**
   * Abre el modal para agregar una nueva dirección
   */
  async openAddressForm(address?: Address) {
    const modal = await this.modalCtrl.create({
      component: AddressFormComponent,
      componentProps: {
        address,
        isEdit: !!address,
      },
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();

    if (role === 'saved') {
      // Recargar direcciones
      this.loadAddresses();

      const toast = await this.toastCtrl.create({
        message: address
          ? 'Dirección actualizada'
          : 'Dirección agregada exitosamente',
        duration: 2000,
        color: 'success',
      });
      await toast.present();
    }
  }

  /**
   * Abre el modal para editar una dirección
   */
  editAddress(address: Address) {
    this.openAddressForm(address);
  }

  /**
   * Confirma y elimina una dirección
   */
  async confirmDeleteAddress(address: Address) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar dirección',
      message: `¿Estás seguro de eliminar la dirección "${address.street}"?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.deleteAddress(address.id);
          },
        },
      ],
    });

    await alert.present();
  }

  /**
   * Elimina una dirección
   */
  private deleteAddress(id: string) {
    this.addressService.deleteAddress(id).subscribe({
      next: async () => {
        this.loadAddresses();
        const toast = await this.toastCtrl.create({
          message: 'Dirección eliminada',
          duration: 2000,
          color: 'success',
        });
        await toast.present();
      },
      error: async (error) => {
        console.error('Error deleting address:', error);
        const toast = await this.toastCtrl.create({
          message: 'Error al eliminar dirección',
          duration: 2000,
          color: 'danger',
        });
        await toast.present();
      },
    });
  }
}
