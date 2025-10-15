import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import type { User } from '../../../models/user.model';
import type { RoleName } from '../../../services/user.service';

@Component({
  selector: 'app-edit-user-modal',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
  templateUrl: './edit-user.modal.html',
})
export class EditUserModalComponent implements OnInit {
  @Input() user!: User;
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
  });

  ngOnInit(): void {
    if (this.user) {
      this.form.setValue({
        name: this.user.name ?? '',
        email: this.user.email ?? '',
        role: (this.user.role as RoleName) ?? 'client',
      });
    }
  }

  dismiss() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  save() {
    if (this.form.invalid) return;
    this.modalCtrl.dismiss(this.form.getRawValue(), 'ok');
  }
}
