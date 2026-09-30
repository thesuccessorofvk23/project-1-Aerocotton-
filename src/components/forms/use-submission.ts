"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  submitForm,
  validateFiles,
  type FormName,
  type SubmissionOutcome,
} from "@/lib/forms/submit";

/**
 * The sending / success / error state both forms share.
 *
 * The form is never cleared until the server has confirmed delivery, so a
 * visitor whose enquiry failed can simply press the button again.
 */

export type FormStatus = "idle" | "sending" | "success" | "error";

export function useSubmission(form: FormName) {
  const [status, setStatus] = useState<FormStatus>("idle");
  const [outcome, setOutcome] = useState<SubmissionOutcome | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<File[]>([]);
  /** When the form first appeared, for the endpoint's too-fast-to-be-human check. */
  const openedAt = useRef(0);

  useEffect(() => {
    openedAt.current = Date.now();
  }, []);

  // Attachment problems are reported as soon as the choice changes, rather
  // than after a slow upload that was never going to be accepted.
  useEffect(() => {
    setErrors((current) => {
      const problem = files.length > 0 ? validateFiles(files) : null;
      if ((current.files ?? "") === (problem ?? "") && !(problem && !current.files)) return current;
      return { ...current, files: problem ?? "" };
    });
  }, [files]);

  const addFiles = useCallback((incoming: File[]) => {
    if (incoming.length === 0) return;
    setFiles((current) => [...current, ...incoming]);
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles((current) => current.filter((_, position) => position !== index));
  }, []);

  const submit = useCallback(
    async (values: Record<string, string>) => {
      const attachmentProblem = files.length > 0 ? validateFiles(files) : null;
      if (attachmentProblem) {
        setErrors({ files: attachmentProblem });
        return;
      }

      setStatus("sending");
      setOutcome(null);
      setErrors({});

      const elapsed = openedAt.current > 0 ? Date.now() - openedAt.current : 0;
      const result = await submitForm(form, values, files, elapsed);

      setOutcome(result);

      if (result.ok) {
        setStatus("success");
        setErrors({});
        setFiles([]);
        return;
      }

      setStatus("error");
      setErrors(result.errors ?? {});
    },
    [files, form]
  );

  /** Back to an empty form, for a second enquiry without a reload. */
  const reset = useCallback(() => {
    setStatus("idle");
    setOutcome(null);
    setErrors({});
    setFiles([]);
    openedAt.current = Date.now();
  }, []);

  return {
    status,
    outcome,
    errors,
    setErrors,
    files,
    addFiles,
    removeFile,
    submit,
    reset,
    sending: status === "sending",
  };
}
