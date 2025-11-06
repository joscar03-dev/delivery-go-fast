import {
  Component,
  OnInit,
  inject,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonButtons,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonSpinner,
  IonBadge,
  ToastController,
} from '@ionic/angular/standalone';
import { AddressService } from '../../services/address.service';
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
  checkmarkCircle,
  settingsOutline,
} from 'ionicons/icons';

addIcons({
  'close-outline': closeOutline,
  'add-outline': addOutline,
  'home-outline': homeOutline,
  'briefcase-outline': briefcaseOutline,
  'location-outline': locationOutline,
  'checkmark-circle-outline': checkmarkCircleOutline,
  'checkmark-circle': checkmarkCircle,
  'settings-outline': settingsOutline,
});

@Component({
  selector: 'app-address-selector',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButton,
    IonButtons,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonSpinner,
    IonBadge,
  ],
  templateUrl: './address-selector.component.html',
  styleUrls: ['./address-selector.component.scss'],
})
export class AddressSelectorComponent implements OnInit {
  @Input() selectedAddressId?: string;
  @Output() addressSelected = new EventEmitter<Address>();
  @Output() modalCancelled = new EventEmitter<void>();
  @Output() navigateToAddresses = new EventEmitter<void>();

  private addressService = inject(AddressService);
  private toastCtrl = inject(ToastController);
  private router = inject(Router);

  addresses: Address[] = [];
  loading = false;
  selectedAddress?: Address;

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
  }

  async goToAddresses() {
    // Emitir evento para que el padre cierre el modal y navegue
    this.navigateToAddresses.emit();
    // Esta navegación es redundante porque el padre ya navega,
    // pero si se usa standalone, también pasamos el state
    this.router.navigate(['/tabs/addresses'], {
      state: { returnUrl: '/tabs/cart' },
    });
  }

  confirm() {
    if (this.selectedAddress) {
      this.addressSelected.emit(this.selectedAddress);
    }
  }

  cancel() {
    this.modalCancelled.emit();
  }
}
