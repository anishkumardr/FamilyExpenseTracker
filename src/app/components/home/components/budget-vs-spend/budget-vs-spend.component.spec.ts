import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BudgetVsSpendComponent } from './budget-vs-spend.component';

describe('BudgetVsSpendComponent', () => {
  let component: BudgetVsSpendComponent;
  let fixture: ComponentFixture<BudgetVsSpendComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BudgetVsSpendComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BudgetVsSpendComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
