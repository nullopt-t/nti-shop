import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-manager-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manager-login.component.html',
  styleUrl: './manager-login.component.scss',
})
export class ManagerLoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  accessKey = '';
  readonly loading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  login(): void {
    if (!this.accessKey.trim()) {
      this.errorMessage.set('Please provide the manager access key.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService.login(this.accessKey.trim()).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.router.navigate(['/manager/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message || 'Access denied. Invalid manager key.');
      },
    });
  }
}
