import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ManageDriversPage } from './manage-drivers.page';

describe('ManageDriversPage', () => {
  let component: ManageDriversPage;
  let fixture: ComponentFixture<ManageDriversPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ManageDriversPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
