import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
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
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.pattern(/^\d{9}$/)]],
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
    // Solo enviar phone si tiene valor
    const registerData: any = { name, email, password };
    if (phone) {
      registerData.phone = phone;
    }
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
