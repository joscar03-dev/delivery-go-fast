import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { WaveBackgroundComponent } from '../../../components/wave-background/wave-background.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    ReactiveFormsModule,
    WaveBackgroundComponent,
  ],
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastCtrl = inject(ToastController);

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.email]], // (comentado en template)
    phone: [
      '',
      [
        Validators.required,
        (c: AbstractControl) => {
          const raw = (c.value || '').toString().trim();
          if (!raw) return { required: true };
          // Permitimos 9 dígitos locales o formato completo +51xxxxxxxxx
          const nineDigits = /^\d{9}$/.test(raw);
          const e164Peru = /^\+51\d{9}$/.test(raw);
          if (nineDigits || e164Peru) return null;
          return {
            phone:
              'Ingresa 9 dígitos (se agregará +51) o +51 seguido de 9 dígitos',
          };
        },
      ],
    ],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
  });

  loading = false;

  async submit() {
    if (this.form.invalid || this.loading) return;
    const { name, email, phone, password, confirmPassword } =
      this.form.getRawValue();
    if (password !== confirmPassword) {
      const toast = await this.toastCtrl.create({
        message: 'Las contraseñas no coinciden',
        duration: 2000,
        color: 'warning',
      });
      return toast.present();
    }
    this.loading = true;
    // Validar que exista al menos email o phone
    // Ahora forzamos teléfono; email queda opcional (actualmente oculto)
    const normalizedPhone = (() => {
      const p = phone.trim();
      if (/^\d{9}$/.test(p)) return `+51${p}`;
      if (/^\+51\d{9}$/.test(p)) return p;
      return p; // fallback (dejar pasar al backend por si cambia regla)
    })();

    const registerData: any = { name, password, phone: normalizedPhone };
    if (email) registerData.email = email; // conservamos para futuro
    this.auth.register(registerData).subscribe({
      next: async () => {
        this.loading = false;
        const redirectUrl =
          this.route.snapshot.queryParamMap.get('redirectUrl');
        await this.router.navigateByUrl(redirectUrl || '/tabs');
      },
      error: async (err: any) => {
        this.loading = false;
        const toast = await this.toastCtrl.create({
          message: err?.error?.message || 'No se pudo registrar',
          duration: 2500,
          color: 'danger',
        });
        toast.present();
      },
    });
  }

  goToLogin() {
    console.log('🚀 Navigating to login');
    this.router.navigate(['/auth/login']);
  }
}
