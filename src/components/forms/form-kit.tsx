import { cn } from "@/lib/cn";
import { UPLOAD_LIMITS } from "@/lib/forms/options";
import { formatBytes } from "@/lib/forms/submit";

/**
 * The pieces both public forms are built from.
 *
 * Styling follows the enquiry form the site already had — a hairline rule under
 * a transparent field, brass on focus — so the new forms read as the same
 * material as the rest of the site.
 */

export const labelClass =
  "block text-2xs font-semibold uppercase tracking-[0.18em] text-taupe";

export const inputClass =
  "w-full border-0 border-b border-outline bg-transparent py-3 text-sm text-ink placeholder:text-fog focus:border-brass-deep focus:outline-none focus:ring-0 transition-colors disabled:opacity-60";

/** One labelled field, with its message slot wired up for screen readers. */
export function Field({
  id,
  label,
  required,
  error,
  hint,
  children,
  className,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <label htmlFor={id} className={labelClass}>
        {label}
        {required ? " *" : null}
      </label>
      {children}
      {hint && !error ? (
        <p id={`${id}-hint`} className="mt-2 text-xs text-taupe">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-2 text-xs text-red-800">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** The accessibility attributes every field needs when it can fail. */
export function fieldAria(id: string, error?: string, hint?: string) {
  return {
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : hint ? `${id}-hint` : undefined,
  } as const;
}

/**
 * Attachments. The accept list and the limits shown here mirror the endpoint's
 * own rules; the browser check is a courtesy, the server's is the one that
 * decides.
 */
export function UploadField({
  id,
  files,
  error,
  disabled,
  onAdd,
  onRemove,
}: {
  id: string;
  files: File[];
  error?: string;
  disabled?: boolean;
  onAdd: (files: File[]) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className={labelClass}>
        Attachments
      </label>
      <input
        id={id}
        name="files[]"
        type="file"
        multiple
        accept={UPLOAD_LIMITS.accept}
        disabled={disabled}
        onChange={(event) => {
          // Copy the selection first: resetting the input below can empty the
          // live FileList, and React reads this array on a later render.
          const chosen = Array.from(event.target.files ?? []);
          event.target.value = ""; // allow re-picking the same file
          onAdd(chosen);
        }}
        className={cn(
          "mt-3 w-full cursor-pointer text-xs text-taupe",
          "file:mr-4 file:cursor-pointer file:border-0 file:bg-ink file:px-4 file:py-2.5 file:text-2xs file:font-semibold file:uppercase file:tracking-[0.18em] file:text-ivory",
          "hover:file:bg-cocoa disabled:cursor-not-allowed disabled:opacity-60",
          error ? "text-red-800" : undefined
        )}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : `${id}-hint`}
      />

      {files.length > 0 ? (
        <ul className="mt-4 divide-y divide-hairline border-y border-hairline">
          {files.map((file, index) => (
            <li key={`${file.name}-${file.size}-${index}`} className="flex items-center justify-between gap-4 py-2.5">
              <span className="min-w-0 truncate text-xs text-umber">{file.name}</span>
              <span className="flex flex-none items-center gap-3">
                <span className="text-2xs uppercase tracking-[0.12em] text-taupe">
                  {formatBytes(file.size)}
                </span>
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  disabled={disabled}
                  className="cursor-pointer text-2xs uppercase tracking-[0.12em] text-taupe transition-colors hover:text-ink disabled:opacity-40"
                >
                  Remove
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-2 text-xs text-red-800">
          {error}
        </p>
      ) : (
        <p id={`${id}-hint`} className="mt-3 text-xs text-taupe">
          {UPLOAD_LIMITS.description}
        </p>
      )}
    </div>
  );
}

/** Hidden from people, irresistible to bots. */
export function Honeypot({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
      <label htmlFor={id}>Website</label>
      <input
        id={id}
        name="website"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={value}
        onChange={onChange}
      />
    </div>
  );
}

/** The brass pill submit control the enquiry form already used. */
export function SubmitButton({
  sending,
  label,
  sendingLabel = "Sending…",
}: {
  sending: boolean;
  label: string;
  sendingLabel?: string;
}) {
  return (
    <button
      type="submit"
      disabled={sending}
      className="group inline-flex cursor-pointer items-center gap-4 disabled:cursor-wait disabled:opacity-60"
    >
      <span
        className="grid h-12 w-12 place-items-center rounded-full border border-brass-deep text-lg text-brass-deep transition-colors duration-300 group-hover:bg-brass-deep group-hover:text-ivory"
        aria-hidden="true"
      >
        {sending ? "•" : "→"}
      </span>
      <span className="text-2xs font-semibold uppercase tracking-[0.22em] text-brass-deep transition-colors duration-300 group-hover:text-ink">
        {sending ? sendingLabel : label}
      </span>
    </button>
  );
}

/** The shared note under every submit control. */
export function RequiredNote({ children }: { children?: React.ReactNode }) {
  return <p className="text-2xs text-taupe">{children ?? "* Required. We reply within two business days."}</p>;
}
