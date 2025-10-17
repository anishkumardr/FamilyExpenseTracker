import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../../services/category.service';

@Component({
  selector: 'app-category-add-popup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './category-add-popup.component.html',
  styleUrls: ['./category-add-popup.component.scss']
})
export class CategoryAddPopupComponent {
  @Output() close = new EventEmitter<void>();
  @Output() categoryAdded = new EventEmitter<any>();

  categoryName = '';
  categoryType = 'expense';
  isGlobal = false;
  description = '';

  constructor(private categoryService: CategoryService) {}

  async addCategory() {
    if (!this.categoryName.trim()) return;

    const newCategory = {
      category_name: this.categoryName,
      description : this.description,
      category_type: this.categoryType as 'expense' | 'savings',
      is_global: this.isGlobal,
      status: true
    };

    try {
      const data = await this.categoryService.addCategory(newCategory);

      this.categoryAdded.emit(data); // emit the newly added category
      this.close.emit();
    } catch (err) {
      console.error('Error adding category:', err);
    }
  }

  cancel() {
    this.close.emit();
  }
}
