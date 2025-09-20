import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { Category } from '../../models/category.model';
import { CategoryService } from '../../services/category.service';

@Component({
  selector: 'app-category-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './category-management.component.html',
  styleUrls: ['./category-management.component.scss']
})
export class CategoryManagementComponent implements OnInit {
  categories: Category[] = [];
  loading = false;

  // state
  showAddPopup = false;
  editId: string | null = null;
  toastMessage = '';
  toastVisible = false;

  addForm = new FormGroup({
    name: new FormControl('', [Validators.required]),
    description: new FormControl(''),
    status: new FormControl(true)
  });

  constructor(private categoryService: CategoryService) {}

  async ngOnInit() {
    await this.loadCategories();
  }

  /** Load all categories for current family */
  async loadCategories() {
    console.log('Loading categories...');
    this.loading = true;
    try {
      this.categories = await this.categoryService.getCategories();
      console.log('Categories loaded:', this.categories);
    } catch (err) {
      console.error('Error loading categories', err);
    } finally {
      this.loading = false;
    }
  }

  /** Edit actions */
  startEdit(cat: Category) {
    this.editId = cat.id;
  }

  async saveEdit(cat: Category, nameInput: HTMLInputElement, descInput: HTMLInputElement, statusInput: HTMLInputElement) {
    try {
      console.log('Saving edit for category:', cat.id, nameInput.value, descInput.value, statusInput.checked);
      if (!nameInput.value.trim()) {
        alert('Name cannot be empty');
        return;
      }
      console.log('test '+descInput.value)

      const updated = await this.categoryService.updateCategory(cat.id, {
        category_name: nameInput.value.trim(),
        description: descInput.value,
        status: statusInput.checked
      });
      console.log('Category updated:', updated);
      this.categories = this.categories.map(c => (c.id === updated.id ? updated : c));
      this.showToast('Category updated');
    } catch (err:any) {
      console.error('Update failed', err);
      this.showToast(err.message ||'Failed to update category');
    } finally {
      this.editId = null;
    }
  }

  cancelEdit() {
    this.editId = null;
  }

  /** Add actions */
  openAdd() {
    this.addForm.reset({ name: '', description: '', status: true });
    this.showAddPopup = true;
  }

  async addCategory() {
  if (this.addForm.invalid) return;
  const val = this.addForm.value;
  try {
    const newCat = await this.categoryService.addCategory({
      category_name: String(val.name),   // 👈 use DB field
      description: String(val.description || ''),
      status: !!val.status
    });
    this.categories.unshift(newCat);
    this.showToast('Category added');
  } catch (err:any) {
    console.error('Add failed', err);
    this.showToast(err.message ||'Failed to add category');
  } finally {
    this.showAddPopup = false;
  }
}


  /** Delete actions */
  async deleteCategory(cat: Category) {
    if (!confirm(`Delete category "${cat.category_name}"?`)) return;
    try {
      await this.categoryService.deleteCategory(cat.id);
      this.categories = this.categories.filter(c => c.id !== cat.id);
      this.showToast('Category deleted');
    } catch (err) {
      console.error('Delete failed', err);
    }
  }

  /** Toast helper */
  showToast(msg: string) {
    this.toastMessage = msg;
    this.toastVisible = true;
    setTimeout(() => (this.toastVisible = false), 2000);
  }
}
