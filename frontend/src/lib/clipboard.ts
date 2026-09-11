/**
 * Copy text with a fallback for browsers where the async clipboard API is
 * unavailable or blocked by permissions (PROJECT_MASTER.md section 9,
 * clipboard operations). Returns whether the copy succeeded so the caller can
 * decide between a success toast and an error toast.
 */
export async function copyText(value: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // Permission denied or a non-secure context: fall through.
    }
  }

  try {
    const scratch = document.createElement('textarea');
    scratch.value = value;
    scratch.setAttribute('readonly', '');
    scratch.style.position = 'fixed';
    scratch.style.opacity = '0';
    document.body.appendChild(scratch);
    scratch.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(scratch);
    return ok;
  } catch {
    return false;
  }
}
