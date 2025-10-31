import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoryExpenseSheetComponent } from './category-expense-sheet.component';

describe('CategoryExpenseSheetComponent', () => {
  let component: CategoryExpenseSheetComponent;
  let fixture: ComponentFixture<CategoryExpenseSheetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryExpenseSheetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CategoryExpenseSheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
