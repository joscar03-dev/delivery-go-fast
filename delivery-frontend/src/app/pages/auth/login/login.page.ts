import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonInput,
  IonNote,
  IonButton,
  IonIcon,
  ToastController,
} from '@ionic/angular/standalone';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { addIcons } from 'ionicons';
import { call } from 'ionicons/icons';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonInput,
    IonNote,
    IonButton,
    IonIcon,
  ],
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastCtrl = inject(ToastController);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  loading = false;

  constructor() {
    addIcons({ call });
  }

  async submit() {
    if (this.form.invalid || this.loading) return;
    this.loading = true;
    const { email, password } = this.form.getRawValue();
    this.auth.login({ email, password }).subscribe({
      next: async () => {
        this.loading = false;
        const redirectUrl =
          this.route.snapshot.queryParamMap.get('redirectUrl');
        await this.router.navigateByUrl(redirectUrl || '/tabs');
      },
      error: async (err: any) => {
        this.loading = false;
        const toast = await this.toastCtrl.create({
          message: err?.error?.message || 'No se pudo iniciar sesión',
          duration: 2500,
          color: 'danger',
        });
        toast.present();
      },
    });
  }

  goToPhoneLogin() {
    console.log('🚀 Navigating to phone login');
    this.router.navigate(['/auth/phone-login']);
  }

  goToRegister() {
    console.log('🚀 Navigating to register');
    this.router.navigate(['/auth/register']);
  }
}
