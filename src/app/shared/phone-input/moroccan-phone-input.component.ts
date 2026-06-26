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
    <div class="flex overflow-hidden rounded-[10px] border border-line-strong bg-canvas-2 transition-colors focus-within:border-signal focus-within:shadow-[0_0_0_3px_rgba(214,255,62,0.16)]">
      <span class="mono flex select-none items-center gap-1.5 whitespace-nowrap border-r border-line-strong bg-surface px-3 text-sm text-muted">
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
        class="mono min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-ink outline-none placeholder:text-faint disabled:cursor-not-allowed disabled:opacity-50"
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
