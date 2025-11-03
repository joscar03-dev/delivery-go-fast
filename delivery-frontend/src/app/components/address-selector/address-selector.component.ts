import { Component, OnInit, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonRadioGroup,
  IonRadio,
  IonSpinner,
  IonBadge,
  ModalController,
  ToastController,
} from '@ionic/angular/standalone';
import { AddressService } from '../../services/address.service';
import { AddressFormComponent } from '../address-form/address-form.component';
import {
  Address,
  AddressType,
  getAddressTypeLabel,
  getAddressTypeIcon,
} from '../../models/address.model';
import { addIcons } from 'ionicons';
import {
  closeOutline,
  addOutline,
  homeOutline,
  briefcaseOutline,
  locationOutline,
  checkmarkCircleOutline,
} from 'ionicons/icons';

addIcons({
  'close-outline': closeOutline,
  'add-outline': addOutline,
  'home-outline': homeOutline,
  'briefcase-outline': briefcaseOutline,
  'location-outline': locationOutline,
  'checkmark-circle-outline': checkmarkCircleOutline,
});

@Component({
  selector: 'app-address-selector',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonRadioGroup,
    IonRadio,
    IonSpinner,
    IonBadge,
  ],
  templateUrl: './address-selector.component.html',
  styleUrls: ['./address-selector.component.scss'],
})
export class AddressSelectorComponent implements OnInit {
  @Input() selectedAddressId?: string;

  private addressService = inject(AddressService);
  private modalCtrl = inject(ModalController);
  private toastCtrl = inject(ToastController);

  addresses: Address[] = [];
  loading = false;
  selectedAddress?: Address;
  selectedId?: string;

  // Exponer helpers para el template
  getAddressTypeLabel = getAddressTypeLabel;
  getAddressTypeIcon = getAddressTypeIcon;

  ngOnInit() {
    this.loadAddresses();
  }

  loadAddresses() {
    this.loading = true;
    this.addressService.getMyAddresses().subscribe({
      next: (addresses) => {
        this.addresses = addresses;
        this.loading = false;

        // Seleccionar la dirección default o la primera
        // Preselección por id
        const initial =
          (this.selectedAddressId &&
            addresses.find((a) => a.id === this.selectedAddressId)) ||
          addresses.find((a) => a.isDefault) ||
          addresses[0];
        this.selectedAddress = initial;
        this.selectedId = initial?.id;
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

  selectAddress(address: Address) {
    this.selectedAddress = address;
    this.selectedId = address?.id;
  }

  async addNewAddress() {
    const modal = await this.modalCtrl.create({
      component: AddressFormComponent,
      componentProps: {
        isEdit: false,
      },
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();

    if (role === 'saved') {
      // Recargar direcciones
      this.loadAddresses();

      const toast = await this.toastCtrl.create({
        message: 'Dirección agregada exitosamente',
        duration: 2000,
        color: 'success',
      });
      await toast.present();
    }
  }

  confirm() {
    if (!this.selectedAddress && this.selectedId) {
      this.selectedAddress = this.addresses.find(
        (a) => a.id === this.selectedId
      );
    }
    if (this.selectedAddress)
      this.modalCtrl.dismiss(this.selectedAddress, 'selected');
  }

  cancel() {
    this.modalCtrl.dismiss(null, 'cancel');
  }
}
