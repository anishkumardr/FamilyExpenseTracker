import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './bottom-nav.component.html',
  styleUrls: ['./bottom-nav.component.scss']
})
export class BottomNavComponent {
  showSetupMenu = false;
  isSetupActive = false;
 @ViewChild('bottomNav', { static: true }) bottomNav!: ElementRef<HTMLElement>;
 constructor(private router: Router, private host: ElementRef) {
    // close submenu whenever navigation happens (clicking other tab)
    this.router.events.subscribe(e => {
      if (e instanceof NavigationEnd) {
        this.showSetupMenu = false;
      }
    });
  }
  toggleSetup(event: Event) {
   event.preventDefault();
    event.stopPropagation();
    this.showSetupMenu = !this.showSetupMenu;
  }
 // Click outside bottom-nav closes submenu
  @HostListener('document:click', ['$event'])
  onDocumentClick(e: Event) {
    const target = e.target as Node;
    const navEl = this.bottomNav?.nativeElement;
    if (!navEl) return;
    if (!navEl.contains(target)) {
      this.showSetupMenu = false;
    }
  }
   // Optional: close on Escape key
  @HostListener('document:keydown.escape', ['$event'])
  onEscape() {
    this.showSetupMenu = false;
  }

  // call this when a submenu item is clicked
  onSubmenuClick() {
    this.showSetupMenu = false;
  }
}
