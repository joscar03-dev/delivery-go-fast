import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
} from '@angular/forms';
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
import { WaveBackgroundComponent } from '../../../components/wave-background/wave-background.component';

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
    WaveBackgroundComponent,
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
    identifier: [
      '',
      [
        Validators.required,
        // Validator personalizado simple inline: email o teléfono E.164
        (control: AbstractControl) => {
          const value: string = control.value || '';
          if (!value) return { required: true };
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          const e164Regex = /^\+[1-9]\d{1,14}$/;
          const ninePeru = /^\d{9}$/; // permitir 9 dígitos locales
          return emailRegex.test(value) ||
            e164Regex.test(value) ||
            ninePeru.test(value)
            ? null
            : { identifier: 'Formato inválido (email, +E.164 o 9 dígitos PE)' };
        },
      ],
    ],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  loading = false;

  constructor() {
    addIcons({ call });
  }

  async submit() {
    if (this.form.invalid || this.loading) return;
    this.loading = true;
    let { identifier, password } = this.form.getRawValue();
    // Normalizar: si son 9 dígitos, anteponer +51
    if (/^\d{9}$/.test(identifier)) {
      identifier = `+51${identifier}`;
    }
    this.auth.login({ identifier, password }).subscribe({
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
