import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PhoneLoginPage } from './phone-login.page';

describe('PhoneLoginPage', () => {
  let component: PhoneLoginPage;
  let fixture: ComponentFixture<PhoneLoginPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PhoneLoginPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
