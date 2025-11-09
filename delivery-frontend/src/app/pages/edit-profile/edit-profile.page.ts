import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonSpinner,
  IonIcon,
  IonNote,
  ToastController,
  LoadingController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personOutline,
  mailOutline,
  saveOutline,
  callOutline,
} from 'ionicons/icons';
import { UserService } from '../../services/user.service';
import type { User } from '../../models/user.model';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonCard,
    IonCardContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonSpinner,
    IonIcon,
    IonNote,
  ],
  templateUrl: './edit-profile.page.html',
  styleUrls: ['./edit-profile.page.scss'],
})
export class EditProfilePage implements OnInit {
  private userService = inject(UserService);
  private router = inject(Router);
  private toastController = inject(ToastController);
  private loadingController = inject(LoadingController);

  user?: User;
  loading = false;

  // Form data
  name = '';
  email = '';

  constructor() {
    addIcons({
      personOutline,
      mailOutline,
      saveOutline,
      callOutline,
    });
  }

  ngOnInit() {
    this.loadProfile();
  }

  private loadProfile() {
    this.loading = true;
    this.userService.getProfile().subscribe({
      next: (user) => {
        this.user = user;
        this.name = user.name || '';
        this.email = user.email || '';
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading profile:', err);
        this.loading = false;
        this.showToast('Error al cargar el perfil', 'danger');
      },
    });
  }

  async save() {
    if (!this.name || this.name.trim().length < 2) {
      await this.showToast(
        'El nombre debe tener al menos 2 caracteres',
        'warning'
      );
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Guardando cambios...',
    });
    await loading.present();

    const updateData: any = { name: this.name.trim() };

    // Solo incluir email si el usuario no tiene teléfono (usuarios con phone no requieren email)
    if (!this.user?.phone && this.email) {
      updateData.email = this.email.trim();
    }

    this.userService.updateMyProfile(updateData).subscribe({
      next: async (updatedUser) => {
        await loading.dismiss();
        await this.showToast('Perfil actualizado correctamente', 'success');

        // Actualizar el usuario en localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          user.name = updatedUser.name;
          if (updatedUser.email) user.email = updatedUser.email;
          localStorage.setItem('user', JSON.stringify(user));
        }

        this.router.navigate(['/tabs/account']);
      },
      error: async (err) => {
        await loading.dismiss();
        console.error('Error updating profile:', err);
        await this.showToast(
          err.error?.message || 'Error al actualizar el perfil',
          'danger'
        );
      },
    });
  }

  private async showToast(message: string, color: string = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom',
    });
    await toast.present();
  }
}
