import { Component, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-moroccan-phone-input',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MoroccanPhoneInputComponent),
      multi: true
    }
  ],
  template: `
    <div class="flex overflow-hidden rounded-lg border border-gray-300 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
      <span class="flex items-center gap-1.5 border-r border-gray-300 bg-gray-50 px-3 text-sm text-gray-600 select-none whitespace-nowrap">
        🇲🇦 +212
      </span>
      <input
        type="tel"
        inputmode="numeric"
        placeholder="612345678"
        maxlength="9"
        [value]="displayValue"
        [disabled]="isDisabled"
        (input)="onInput($event)"
        (blur)="onTouched()"
        class="min-w-0 flex-1 bg-white px-3 py-2 text-sm outline-none disabled:bg-gray-50 disabled:cursor-not-allowed"
      />
    </div>
  `
})
export class MoroccanPhoneInputComponent implements ControlValueAccessor {
  displayValue = '';
  isDisabled = false;

  private onChange: (value: string) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(value: string | null): void {
    if (!value) { this.displayValue = ''; return; }
    // Strip +212 or 212 prefix, then strip leading 0 (handles both +212... and 06... inputs)
    this.displayValue = value.replace(/^\+?212/, '').replace(/^0/, '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  onInput(event: Event): void {
    const el = event.target as HTMLInputElement;
    const digits = el.value.replace(/\D/g, '').slice(0, 9);
    el.value = digits;
    this.displayValue = digits;
    this.onChange(digits ? `+212${digits}` : '');
  }
}
