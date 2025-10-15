import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import type { RoleName } from '../../../services/user.service';

@Component({
  selector: 'app-create-user-modal',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
  templateUrl: './create-user.modal.html',
})
export class CreateUserModalComponent {
  @Input() roles: RoleName[] = [];

  private fb = inject(FormBuilder);
  private modalCtrl = inject(ModalController);

  form = this.fb.nonNullable.group({
    name: this.fb.nonNullable.control<string>('', [
      Validators.required,
      Validators.minLength(2),
    ]),
    email: this.fb.nonNullable.control<string>('', [
      Validators.required,
      Validators.email,
    ]),
    role: this.fb.nonNullable.control<RoleName>('client', [
      Validators.required,
    ]),
    password: this.fb.nonNullable.control<string>('', [
      Validators.required,
      Validators.minLength(6),
    ]),
    confirmPassword: this.fb.nonNullable.control<string>('', [
      Validators.required,
    ]),
  });

  dismiss() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  save() {
    if (this.form.invalid) return;
    const { password, confirmPassword } = this.form.getRawValue();
    if (password !== confirmPassword) return;
    const { name, email, role } = this.form.getRawValue();
    this.modalCtrl.dismiss({ name, email, role, password }, 'ok');
  }
}
