import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IncomeManagementComponent } from './income-management.component';

describe('IncomeManagementComponent', () => {
  let component: IncomeManagementComponent;
  let fixture: ComponentFixture<IncomeManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IncomeManagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IncomeManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
