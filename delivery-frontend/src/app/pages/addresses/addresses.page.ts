import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonSpinner,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  ModalController,
  AlertController,
  ToastController,
} from '@ionic/angular/standalone';
import { AddressService } from '../../services/address.service';
import { AddressFormComponent } from '../../components/address-form/address-form.component';
import {
  Address,
  getAddressTypeLabel,
  getAddressTypeIcon,
} from '../../models/address.model';
import { addIcons } from 'ionicons';
import {
  addOutline,
  homeOutline,
  briefcaseOutline,
  locationOutline,
  createOutline,
  trashOutline,
  checkmarkCircleOutline,
} from 'ionicons/icons';

addIcons({
  'add-outline': addOutline,
  'home-outline': homeOutline,
  'briefcase-outline': briefcaseOutline,
  'location-outline': locationOutline,
  'create-outline': createOutline,
  'trash-outline': trashOutline,
  'checkmark-circle-outline': checkmarkCircleOutline,
});

@Component({
  selector: 'app-addresses',
  templateUrl: './addresses.page.html',
  styleUrls: ['./addresses.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonBadge,
    IonSpinner,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
  ],
})
export class AddressesPage implements OnInit {
  private addressService = inject(AddressService);
  private modalCtrl = inject(ModalController);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);
  private router = inject(Router);

  addresses: Address[] = [];
  loading = false;

  // Ruta de retorno dinámica
  defaultBackHref = '/tabs/account';

  // Exponer helpers para el template
  getAddressTypeLabel = getAddressTypeLabel;
  getAddressTypeIcon = getAddressTypeIcon;

  ngOnInit() {
    this.loadAddresses();
  }

  ionViewWillEnter() {
    // Obtener la ruta de retorno desde el history.state
    // history.state es más confiable que getCurrentNavigation()
    const state = window.history.state;

    console.log('🔍 History state:', state);
    console.log('🔍 navigationId:', state?.navigationId);

    // Verificar si hay returnUrl en el state
    if (state && state.returnUrl) {
      console.log('✅ Using returnUrl from state:', state.returnUrl);
      this.defaultBackHref = state.returnUrl;
    } else {
      console.log('ℹ️ Using default backHref:', this.defaultBackHref);
    }

    this.loadAddresses();
  }

  loadAddresses() {
    this.loading = true;
    this.addressService.getMyAddresses().subscribe({
      next: (addresses) => {
        this.addresses = addresses;
        this.loading = false;
      },
      error: async (error) => {
        console.error('Error loading addresses:', error);
        this.loading = false;
        const toast = await this.toastCtrl.create({
          message: 'Error al cargar direcciones',
          duration: 2000,
          color: 'danger',
        });
        await toast.present();
      },
    });
  }

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
      this.loadAddresses();
      const toast = await this.toastCtrl.create({
        message: address
          ? 'Dirección actualizada exitosamente'
          : 'Dirección agregada exitosamente',
        duration: 2000,
        color: 'success',
      });
      await toast.present();
    }
  }

  async deleteAddress(address: Address) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar eliminación',
      message: `¿Estás seguro de eliminar la dirección "${address.street}"?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            try {
              await this.addressService.deleteAddress(address.id).toPromise();
              this.loadAddresses();
              const toast = await this.toastCtrl.create({
                message: 'Dirección eliminada exitosamente',
                duration: 2000,
                color: 'success',
              });
              await toast.present();
            } catch (error) {
              console.error('Error deleting address:', error);
              const toast = await this.toastCtrl.create({
                message: 'Error al eliminar dirección',
                duration: 2000,
                color: 'danger',
              });
              await toast.present();
            }
          },
        },
      ],
    });

    await alert.present();
  }

  async setDefaultAddress(address: Address) {
    try {
      await this.addressService.setDefaultAddress(address.id).toPromise();
      this.loadAddresses();
      const toast = await this.toastCtrl.create({
        message: 'Dirección predeterminada actualizada',
        duration: 2000,
        color: 'success',
      });
      await toast.present();
    } catch (error) {
      console.error('Error setting default address:', error);
      const toast = await this.toastCtrl.create({
        message: 'Error al actualizar dirección predeterminada',
        duration: 2000,
        color: 'danger',
      });
      await toast.present();
    }
  }
}
