import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/cn';
import {
  MAX_RANGE_DAYS,
  presetRange,
  rangeLengthDays,
  toDateParam,
  type DateRange,
} from '@/lib/dates';

/** The presets PROJECT_MASTER.md section 14 fixes. 30 is the API's own default. */
export const PRESETS = [7, 14, 30, 90, 365] as const;

/**
 * Window selector for the analytics screens.
 *
 * Presets plus two date inputs rather than a dual-month calendar popover: no
 * date library is permitted (section 5), and a hand-built calendar would be a
 * large accessible-widget problem for something the native date input already
 * solves on every platform, including mobile.
 *
 * The 366-day cap and the start-before-end rule are the server's, enforced in
 * `resolveRange`. Both are mirrored here so an invalid window is caught before
 * it costs a request — the server still refuses it either way.
 */
export function DateRangePicker({
  range,
  onChange,
  disabled,
}: {
  range: DateRange;
  onChange: (range: DateRange) => void;
  disabled?: boolean;
}) {
  const [custom, setCustom] = useState(range);
  const [showCustom, setShowCustom] = useState(false);

  // Keeps the custom inputs in step when a preset changes the window.
  useEffect(() => setCustom(range), [range]);

  const today = toDateParam(new Date());
  const length = rangeLengthDays(custom);
  const inverted = custom.from > custom.to;
  const tooLong = length > MAX_RANGE_DAYS;
  const customError = inverted
    ? 'The start date cannot be after the end date.'
    : tooLong
      ? `That is ${length} days. The maximum window is ${MAX_RANGE_DAYS} days.`
      : null;

  const activePreset = PRESETS.find((days) => {
    const preset = presetRange(days);
    return preset.from === range.from && preset.to === range.to;
  });

  return (
    <div className="flex flex-col gap-sm">
      <div
        role="group"
        aria-label="Date range presets"
        className="flex flex-wrap items-center gap-2xs"
      >
        {PRESETS.map((days) => (
          <button
            key={days}
            type="button"
            disabled={disabled}
            aria-pressed={activePreset === days && !showCustom}
            onClick={() => {
              setShowCustom(false);
              onChange(presetRange(days));
            }}
            className={cn(
              'rounded-full border px-sm py-3xs text-body-sm transition-colors disabled:opacity-50',
              activePreset === days && !showCustom
                ? 'border-primary-600 bg-primary-50 text-primary-600'
                : 'border-border-subtle text-content-secondary hover:text-content-primary'
            )}
          >
            Last {days} days
          </button>
        ))}

        <button
          type="button"
          disabled={disabled}
          aria-pressed={showCustom || activePreset === undefined}
          onClick={() => setShowCustom((value) => !value)}
          className={cn(
            'rounded-full border px-sm py-3xs text-body-sm transition-colors disabled:opacity-50',
            showCustom || activePreset === undefined
              ? 'border-primary-600 bg-primary-50 text-primary-600'
              : 'border-border-subtle text-content-secondary hover:text-content-primary'
          )}
        >
          Custom range
        </button>
      </div>

      {(showCustom || activePreset === undefined) && (
        <div className="flex flex-col gap-xs rounded-lg border border-border-subtle p-md">
          <div className="flex flex-wrap items-end gap-sm">
            <Input
              label="From"
              type="date"
              max={today}
              value={custom.from}
              disabled={disabled}
              onChange={(event) =>
                setCustom((current) => ({ ...current, from: event.target.value }))
              }
            />
            <Input
              label="To"
              type="date"
              max={today}
              value={custom.to}
              disabled={disabled}
              onChange={(event) =>
                setCustom((current) => ({ ...current, to: event.target.value }))
              }
            />
            <Button
              disabled={disabled || Boolean(customError) || length === 0}
              onClick={() => onChange(custom)}
            >
              Apply range
            </Button>
          </div>

          {customError ? (
            <p role="alert" className="text-body-sm text-danger">
              {customError}
            </p>
          ) : (
            <p className="text-body-sm text-content-tertiary">
              {length} {length === 1 ? 'day' : 'days'} selected. Maximum {MAX_RANGE_DAYS}{' '}
              days. Days are counted from UTC midnight.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
