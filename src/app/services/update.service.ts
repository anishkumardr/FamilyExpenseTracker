import { Injectable } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter, map } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UpdateService {
  private updateAvailableSubject = new BehaviorSubject<boolean>(false);
  public updateAvailable$ = this.updateAvailableSubject.asObservable();

  constructor(private swUpdate: SwUpdate) {
    if (this.swUpdate.isEnabled) {
      this.checkForUpdates();
    }
  }

  private checkForUpdates() {
    // Check for updates every time the app starts
    this.swUpdate.versionUpdates
      .pipe(
        filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'),
        map(evt => ({
          type: 'UPDATE_AVAILABLE',
          current: evt.currentVersion,
          available: evt.latestVersion,
        }))
      )
      .subscribe(() => {
        this.updateAvailableSubject.next(true);
      });

    // Also check immediately on app start
    this.swUpdate.checkForUpdate();
  }

  // Force update by reloading the page
  forceUpdate() {
    this.swUpdate.activateUpdate().then(() => {
      document.location.reload();
    });
  }

  // Check for updates manually
  checkForUpdate() {
    if (this.swUpdate.isEnabled) {
      this.swUpdate.checkForUpdate();
    }
  }
}